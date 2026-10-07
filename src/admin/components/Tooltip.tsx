import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  label: string;
  children: ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  };
  const hide = () => setPos(null);

  return (
    <div ref={anchorRef} className="flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {pos &&
        createPortal(
          <span
            role="tooltip"
            className="astryd-dropdown fixed z-[200] -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium astryd-text-bright"
            style={{ top: pos.top, left: pos.left }}
          >
            {label}
          </span>,
          document.body
        )}
    </div>
  );
}
