import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

/** Astryd glass modal: blurred scrim, 10px frosted panel, 16px medium title, hairline-divided header/footer. */
export function Modal({ isOpen, onClose, title, description, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="astryd-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className={`astryd-modal w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between gap-4 p-4 pb-3 border-b border-[var(--astryd-divider)] shrink-0">
          <div className="space-y-1">
            <h3 className="text-[16px] font-medium astryd-text-bright">{title}</h3>
            {description && <p className="text-[11px] astryd-text-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md astryd-text-muted hover:bg-[var(--astryd-hover)] hover:text-[var(--astryd-text-bright)] transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2.5 p-4 pt-3 border-t border-[var(--astryd-divider)] shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
