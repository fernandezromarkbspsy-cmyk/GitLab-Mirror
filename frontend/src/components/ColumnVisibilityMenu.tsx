import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Option = { key: string; label: string };

type Props = {
  label?: string;
  options: Option[];
  visible: string[];
  onChange: (next: string[]) => void;
};

export function ColumnVisibilityMenu({ label = 'Columns', options, visible, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function toggle(key: string) {
    const next = visible.includes(key) ? visible.filter(value => value !== key) : [...visible, key];
    onChange(next.length ? next : visible);
  }

  return <div ref={rootRef} className="column-visibility">
    <button className="toolbar-button column-visibility-button" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      {label}<ChevronDown size={15} />
    </button>
    {open && <div className="column-visibility-menu" role="menu" aria-label={`${label} menu`}>
      {options.map(option => <label key={option.key} className="column-visibility-option">
        <input type="checkbox" checked={visible.includes(option.key)} onChange={() => toggle(option.key)} />
        <span>{option.label}</span>
      </label>)}
    </div>}
  </div>;
}
