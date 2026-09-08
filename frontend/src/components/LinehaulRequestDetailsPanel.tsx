import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { ArrowUp, CalendarDays, CheckCircle2, ClipboardCopy, ExternalLink, GripVertical, Hash, MapPin, Printer, Truck, UserRound, X } from 'lucide-react';
import type { TruckRequest } from '../types';

type Props = {
  request: TruckRequest;
  onClose: () => void;
  onNotice: (message: string) => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
};

function valueOf(value?: string | null) {
  return value?.trim() ? value : '-';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function LinehaulRequestDetailsPanel({ request, onClose, onNotice, position, onPositionChange }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'docs'>('details');
  const status = request.status.replaceAll('_', ' ');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const closeOnBackgroundClick = (event: PointerEvent) => { if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnBackgroundClick);
    return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOnBackgroundClick); };
  }, [onClose]);

  useEffect(() => {
    const movePanel = (event: PointerEvent) => {
      if (!dragRef.current || event.pointerId !== dragRef.current.pointerId) return;
      const panel = panelRef.current;
      const workspace = panel?.parentElement;
      if (!panel || !workspace) return;
      const workspaceBounds = workspace.getBoundingClientRect();
      const panelBounds = panel.getBoundingClientRect();
      const scale = window.matchMedia('(min-width: 821px)').matches ? 0.75 : 1;
      const x = (event.clientX - workspaceBounds.left) / scale - dragRef.current.offsetX / scale;
      const y = (event.clientY - workspaceBounds.top) / scale - dragRef.current.offsetY / scale;
      onPositionChange({ x: Math.max(8, Math.min(x, workspaceBounds.width / scale - panelBounds.width / scale - 8)), y: Math.max(8, Math.min(y, workspaceBounds.height / scale - panelBounds.height / scale - 8)) });
    };
    const stopDragging = (event: PointerEvent) => { if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null; };
    window.addEventListener('pointermove', movePanel);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => { window.removeEventListener('pointermove', movePanel); window.removeEventListener('pointerup', stopDragging); window.removeEventListener('pointercancel', stopDragging); };
  }, [onPositionChange]);

  function startDragging(event: React.PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  const tabs = [{ id: 'details' as const, label: 'Request details' }, { id: 'activity' as const, label: 'Activity' }, { id: 'docs' as const, label: 'Docs' }];

  return <section ref={panelRef} className="lh-request-details-panel" style={{ left: position.x, top: position.y }} aria-label={`Details for request ${request.id}`}>
    <header className="lh-details-panel-header" onPointerDown={startDragging}>
      <div className="lh-details-panel-title"><GripVertical className="lh-details-panel-grip" size={16} aria-hidden="true" /><div><span className="lh-details-panel-eyebrow">Linehaul request</span><strong>{request.id}</strong></div></div>
      <div className="lh-details-panel-actions"><button type="button" aria-label="Open request in new view" onClick={() => onNotice(`Opening ${request.id}`)}><ExternalLink size={15} /></button><button type="button" aria-label="Close request details" onClick={onClose}><X size={16} /></button></div>
    </header>
    <div className="lh-details-panel-summary"><div className="lh-details-panel-avatar" aria-hidden="true">{request.cluster.charAt(0)}</div><div className="lh-details-panel-summary-copy"><strong>{request.cluster}</strong><span>{request.region}</span></div><span className={`lh-status lh-status-${request.status.toLowerCase()}`}>{status}</span></div>
    <div className="lh-details-panel-tabs" role="tablist" aria-label="Request detail sections">{tabs.map(tab => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`lh-panel-${tab.id}`} onClick={() => setActiveTab(tab.id)}>{tab.id === 'details' && <CheckCircle2 size={14} />}{tab.label}</button>)}</div>
    {activeTab === 'details' && <div id="lh-panel-details" role="tabpanel"><dl className="lh-details-panel-fields">
      <div><dt><CalendarDays size={14} />Request time</dt><dd>{formatDateTime(request.request_timestamp)}</dd></div>
      <div><dt><Hash size={14} />Cluster</dt><dd>{valueOf(request.cluster)}</dd></div>
      <div><dt><MapPin size={14} />Region</dt><dd>{valueOf(request.region)}</dd></div>
      <div><dt><Truck size={14} />Dock #</dt><dd>{valueOf(request.dock_no)}</dd></div>
      <div><dt><Hash size={14} />Backlogs</dt><dd>{request.backlogs.toLocaleString()}</dd></div>
      <div><dt><Truck size={14} />LH size</dt><dd>{valueOf(request.truck_size)}</dd></div>
      <div><dt><UserRound size={14} />SOC PIC</dt><dd>{valueOf(request.ob_fte)}</dd></div>
      <div><dt><Hash size={14} />LH trip #</dt><dd>{valueOf(request.linehaul_trip_no)}</dd></div>
      <div><dt><Truck size={14} />Plate #</dt><dd>{valueOf(request.plate_number)}</dd></div>
    </dl></div>}
    {activeTab === 'activity' && <div id="lh-panel-activity" className="lh-details-panel-tab-content" role="tabpanel"><CheckCircle2 size={18} /><strong>Request activity</strong><span>No activity has been recorded for this request.</span></div>}
    {activeTab === 'docs' && <div id="lh-panel-docs" className="lh-details-panel-tab-content" role="tabpanel"><ClipboardCopy size={18} /><strong>Request documents</strong><span>No documents are attached to this request.</span></div>}
    <footer className="lh-details-panel-footer"><button type="button" onClick={() => onNotice(`Exporting ${request.id}`)}><ArrowUp size={15} />Export</button><button type="button" onClick={() => { void navigator.clipboard?.writeText(request.id); onNotice(`Copied ${request.id}`); }}><ClipboardCopy size={15} />Copy ID</button><button type="button" onClick={() => window.print()}><Printer size={15} />Print</button></footer>
  </section>;
}
