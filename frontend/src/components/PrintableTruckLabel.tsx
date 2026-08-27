import { Printer, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Modal } from './Modal';
import type { TruckRequest } from '../types';

type TemplateKind = 'single' | 'coload' | 'triload';

const templateSrc: Record<TemplateKind, string> = {
  single: '/printable_templates/single_lh.jpg',
  coload: '/printable_templates/coload_lh.jpg',
  triload: '/printable_templates/triload_lh.jpg',
};

function clusters(request: TruckRequest) {
  return request.cluster.split(',').map(value => value.trim()).filter(Boolean);
}

function templateKind(count: number): TemplateKind {
  if (count <= 1) return 'single';
  if (count === 2) return 'coload';
  return 'triload';
}

function dockTime(request: TruckRequest) {
  if (!request.docked_time) return '';
  const date = new Date(request.docked_time);
  return Number.isNaN(date.getTime()) ? request.docked_time : date.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function qrCells(value: string) {
  const size = 21;
  let seed = 0;
  for (let index = 0; index < value.length; index += 1) seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  const cells: boolean[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const finder = (row < 7 && column < 7) || (row < 7 && column > 13) || (row > 13 && column < 7);
      const finderInner = finder && (row % 6 === 0 || column % 6 === 0 || (row % 6 >= 2 && row % 6 <= 4 && column % 6 >= 2 && column % 6 <= 4));
      seed = (seed * 1664525 + 1013904223) >>> 0;
      cells.push(finder ? finderInner : ((seed + row * 17 + column * 29) % 5) < 2);
    }
  }
  return cells;
}

function DriverQr({ value }: { value: string }) {
  const cells = qrCells(value || 'DRIVER');
  return <div className="driver-qr" aria-label={`Driver ID QR ${value}`}>{cells.map((active, index) => <i key={index} className={active ? 'on' : ''} />)}</div>;
}

function loadSlots(kind: TemplateKind, values: string[]) {
  if (kind === 'single') return [{ className: 'load-single', value: values[0] ?? '' }];
  if (kind === 'coload') return [
    { className: 'load-left', value: values[1] ?? '' },
    { className: 'load-right', value: values[0] ?? '' },
  ];
  return [
    { className: 'load-third', value: values[2] ?? '' },
    { className: 'load-second', value: values[1] ?? '' },
    { className: 'load-first', value: values[0] ?? '' },
  ];
}

export function PrintableTruckLabel({ request, onClose }: { request: TruckRequest; onClose: () => void }) {
  const clusterValues = clusters(request);
  const kind = templateKind(clusterValues.length);

  return createPortal(<Modal open onClose={onClose} className="print-dialog" ariaLabel="Printable truck label"><div className="print-toolbar">
        <strong>Printable LH label</strong>
        <div><button className="secondary-button" type="button" onClick={() => window.print()}><Printer size={16} />Print</button><button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      </div><div className="print-preview">
        <div className={`truck-label truck-label--${kind}`}>
          <img src={templateSrc[kind]} alt="" />
          <div className="label-value plate">{request.plate_number || ''}</div>
          <div className="label-value driver"><DriverQr value={request.driver_id || ''} /><span>{request.driver_id || ''}</span></div>
          <div className="label-value dock">{request.dock_no}</div>
          <div className="label-value dock-time">{dockTime(request)}</div>
          {loadSlots(kind, clusterValues).map(slot => <div key={slot.className} className={`label-value ${slot.className}`}>{slot.value}</div>)}
        </div>
      </div></Modal>, document.body);
}
