import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, type LucideIcon } from 'lucide-react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  hint?: string;
}

/** Login-screen field: 12px muted label, 36px input with a leading icon, and an eye toggle on password inputs. */
export function AuthField({ label, icon: Icon, hint, required, className = '', type = 'text', ...rest }: AuthFieldProps) {
  const autoId = useId();
  const id = rest.id ?? autoId;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[12px] astryd-text-muted">
        {label}
        {required && <span className="astryd-text-dim"> *</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 astryd-text-dim" />}
        <input
          {...rest}
          id={id}
          type={isPassword && visible ? 'text' : type}
          required={required}
          className={`astryd-input h-9 w-full px-3 ${Icon ? '!pl-10' : ''} ${isPassword ? '!pr-10' : ''} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 astryd-text-dim transition-colors hover:text-[var(--astryd-text-muted)]"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] astryd-text-dim">{hint}</p>}
    </div>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="astryd-alert-danger">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function AuthSubmit({ busy, busyLabel, children, disabled }: { busy?: boolean; busyLabel?: string; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="submit" disabled={busy || disabled} className="astryd-btn h-10 w-full gap-2 text-[14px]">
      {busy ? (
        <>
          <span className="astryd-spinner" />
          <span>{busyLabel ?? 'Please wait…'}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export const authLinkClass = 'font-medium astryd-text-cyan transition-opacity hover:opacity-90';
export const authQuietLinkClass = 'inline-block text-[11px] astryd-text-dim transition-colors hover:text-[var(--astryd-text-muted)]';
