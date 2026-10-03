import { ChevronDown, Columns3 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type Option = { key: string; label: string };

export const linehaulColumnOptions: Option[] = [
  { key: "status", label: "Status" },
  { key: "requestTime", label: "Request time" },
  { key: "cluster", label: "Cluster" },
  { key: "region", label: "Region" },
  { key: "dock", label: "Dock #" },
  { key: "backlogs", label: "Backlog" },
  { key: "backlogsTime", label: "Backlogs Time Stamp" },
  { key: "lhTypeRequest", label: "LH Type (Request)" },
  { key: "opsFte", label: "Ops FTE" },
  { key: "plateNumber", label: "Plate number" },
  { key: "mmFte", label: "MM FTE" },
  { key: "truckSize", label: "LH size" },
  { key: "lhTypeInput", label: "LH type (input by FTE MM)" },
  { key: "provideTime", label: "Provide Time" },
  { key: "linehaulTrip", label: "Linehaul Trip" },
  { key: "assignedTime", label: "Assigned time" },
  { key: "dockedTime", label: "Docked Time" },
  { key: "docOfficer", label: "DOC Officer" },
  { key: "opsPic", label: "OPS/PIC" },
];

export const linehaulPrimaryColumnKeys = [
  "status",
  "cluster",
  "region",
  "dock",
  "backlogs",
  "plateNumber",
  "linehaulTrip",
  "truckSize",
  "requestTime",
  "dockedTime",
] as const;

type Props = {
  label: string;
  options: readonly Option[];
  visible: string[];
  onChange: (next: string[]) => void;
  iconOnly?: boolean;
};

export function ColumnVisibilityMenu({
  label,
  options,
  visible,
  onChange,
  iconOnly = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggle(key: string) {
    const next = visible.includes(key)
      ? visible.filter((value) => value !== key)
      : [...visible, key];
    onChange(next);
  }

  return (
    <div ref={rootRef} className="column-visibility">
      <button
        className={`column-visibility-button${iconOnly ? " lh-toolbar-icon" : ""}`}
        type="button"
        aria-label={label}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <Columns3 size={17} aria-hidden="true" />
        {!iconOnly && (
          <>
            <span>{label}</span>
            <ChevronDown size={15} aria-hidden="true" />
          </>
        )}
      </button>
      {open && (
        <div
          id={menuId}
          className="column-visibility-menu"
          role="group"
          aria-label={label}
        >
          {options.map((option) => (
            <label key={option.key} className="column-visibility-option">
              <input
                type="checkbox"
                checked={visible.includes(option.key)}
                onChange={() => toggle(option.key)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
