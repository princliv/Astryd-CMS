interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, description, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <div className="astryd-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="astryd-modal w-full max-w-sm p-4 space-y-3">
        <h3 className="text-[16px] font-medium astryd-text-bright">{title}</h3>
        <p className="text-[12px] astryd-text-muted leading-relaxed">{description}</p>
        <div className="flex justify-end gap-2.5 pt-2">
          <button onClick={onCancel} className="astryd-btn astryd-btn-neutral h-9 px-3.5 text-[13px]">
            Cancel
          </button>
          <button onClick={onConfirm} className="astryd-btn astryd-btn-danger h-9 px-3.5 text-[13px]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
