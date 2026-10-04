import { Printer, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { TruckRequest } from "../types";
import {
  driverQrActiveCellClass,
  driverQrCellClass,
  driverQrClass,
  iconButtonClass,
  printDialogClass,
  printPreviewClass,
  printToolbarActionsClass,
  printToolbarClass,
  printToolbarTitleClass,
  secondaryButtonClass,
  truckLabelClass,
  truckLabelDockClass,
  truckLabelDockTimeClass,
  truckLabelDriverClass,
  truckLabelImageClass,
  truckLabelLoadBaseClass,
  truckLabelLoadLeftClass,
  truckLabelLoadRightClass,
  truckLabelLoadSecondClass,
  truckLabelLoadSingleClass,
  truckLabelPlateClass,
  truckLabelValueClass,
} from "../lib/uiClasses";
import { Modal } from "./Modal";

type TemplateKind = "single" | "coload" | "triload";

const templateSrc: Record<TemplateKind, string> = {
  single: "/printable_templates/single_lh.jpg",
  coload: "/printable_templates/coload_lh.jpg",
  triload: "/printable_templates/triload_lh.jpg",
};

function requestedLoads(request: TruckRequest) {
  return request.cluster
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function templateKind(count: number): TemplateKind {
  if (count <= 1) return "single";
  if (count === 2) return "coload";
  return "triload";
}

function dockTime(request: TruckRequest) {
  if (!request.docked_time) return "";
  const date = new Date(request.docked_time);
  return Number.isNaN(date.getTime())
    ? request.docked_time
    : date.toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function qrCells(value: string) {
  const size = 21;
  let seed = 0;
  for (let index = 0; index < value.length; index += 1)
    seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  const cells: boolean[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const finder =
        (row < 7 && column < 7) ||
        (row < 7 && column > 13) ||
        (row > 13 && column < 7);
      const finderInner =
        finder &&
        (row % 6 === 0 ||
          column % 6 === 0 ||
          (row % 6 >= 2 && row % 6 <= 4 && column % 6 >= 2 && column % 6 <= 4));
      seed = (seed * 1664525 + 1013904223) >>> 0;
      cells.push(
        finder ? finderInner : (seed + row * 17 + column * 29) % 5 < 2,
      );
    }
  }
  return cells;
}

function loadSlotClass(slot: string) {
  switch (slot) {
    case "load-single":
      return truckLabelLoadSingleClass;
    case "load-left":
    case "load-third":
      return truckLabelLoadLeftClass;
    case "load-right":
    case "load-first":
      return truckLabelLoadRightClass;
    case "load-second":
      return truckLabelLoadSecondClass;
    default:
      return "";
  }
}

function DriverQr({ value }: { value: string }) {
  const cells = qrCells(value || "DRIVER");
  return (
    <div className={driverQrClass} role="img" aria-label={`Driver ID QR ${value}`}>
      {cells.map((active, index) => (
        <i
          key={index}
          className={`${driverQrCellClass}${active ? ` ${driverQrActiveCellClass}` : ""}`}
        />
      ))}
    </div>
  );
}

function loadSlots(kind: TemplateKind, values: string[]) {
  if (kind === "single")
    return [{ className: "load-single", value: values[0] ?? "" }];
  if (kind === "coload")
    return [
      // The source order is 1st load, 2nd load; the template boxes run right to left.
      { className: "load-left", value: values[1] ?? "" },
      { className: "load-right", value: values[0] ?? "" },
    ];
  return [
    // The source order is 1st, 2nd, 3rd; the template boxes run right to left.
    { className: "load-third", value: values[2] ?? "" },
    { className: "load-second", value: values[1] ?? "" },
    { className: "load-first", value: values[0] ?? "" },
  ];
}

export function PrintableTruckLabel({
  request,
  onClose,
}: {
  request: TruckRequest;
  onClose: () => void;
}) {
  const clusterValues = requestedLoads(request);
  const kind = templateKind(clusterValues.length);

  return createPortal(
    <Modal
      open
      onClose={onClose}
      className={printDialogClass}
      ariaLabel="Printable truck label"
    >
      <div className={printToolbarClass}>
        <strong className={printToolbarTitleClass}>Printable LH label</strong>
        <div className={printToolbarActionsClass}>
          <button
            className={`${secondaryButtonClass} text-xs font-bold`}
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print
          </button>
          <button
            className={iconButtonClass}
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className={printPreviewClass}>
        <div className={truckLabelClass}>
          <img className={truckLabelImageClass} src={templateSrc[kind]} alt="" />
          <div className={`${truckLabelValueClass} ${truckLabelPlateClass}`}>{request.plate_number || ""}</div>
          <div className={`${truckLabelValueClass} ${truckLabelDriverClass}`}>
            <DriverQr value={request.driver_id || ""} />
            <span>{request.driver_id || ""}</span>
          </div>
          <div className={`${truckLabelValueClass} ${truckLabelDockClass}`}>{request.dock_no}</div>
          <div className={`${truckLabelValueClass} ${truckLabelDockTimeClass}`}>{dockTime(request)}</div>
          {loadSlots(kind, clusterValues).map((slot) => (
            <div
              key={slot.className}
              className={`${truckLabelValueClass} ${truckLabelLoadBaseClass} ${loadSlotClass(slot.className)}`}
            >
              {slot.value}
            </div>
          ))}
        </div>
      </div>
    </Modal>,
    document.body,
  );
}
