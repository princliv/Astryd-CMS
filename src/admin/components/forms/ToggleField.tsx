interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function ToggleField({ label, checked, onChange, description, disabled }: ToggleFieldProps) {
  return (
    <label className={`flex items-center justify-between gap-4 py-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <div>
        <div className="text-[13px] font-medium astryd-text-bright">{label}</div>
        {description && <div className="text-[11px] astryd-text-muted mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="astryd-switch relative w-11 h-6 rounded-full shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed"
      >
        <span
          className={`astryd-switch-knob absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}
