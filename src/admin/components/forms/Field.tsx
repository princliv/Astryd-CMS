import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldWrapper({ label, hint, required, children, className = '', htmlFor }: FieldWrapperProps & { htmlFor?: string }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[12px] astryd-text-muted mb-1.5">
          {label}
          {required && <span className="astryd-text-dim"> *</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] astryd-text-dim mt-1.5">{hint}</p>}
    </div>
  );
}

const inputBase = 'astryd-input w-full px-3';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, Omit<FieldWrapperProps, 'children' | 'className'> {
  icon?: LucideIcon;
  wrapperClassName?: string;
}

export function TextField({ label, hint, required, icon: Icon, wrapperClassName, className = '', ...rest }: TextFieldProps) {
  const autoId = useId();
  const id = rest.id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} required={required} className={wrapperClassName} htmlFor={id}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 astryd-text-dim" />}
        <input className={`${inputBase} h-9 ${Icon ? '!pl-10' : ''} ${className}`} {...rest} id={id} />
      </div>
    </FieldWrapper>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, Omit<FieldWrapperProps, 'children' | 'className'> {
  wrapperClassName?: string;
}

export function TextareaField({ label, hint, required, wrapperClassName, className = '', ...rest }: TextareaFieldProps) {
  const autoId = useId();
  const id = rest.id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} required={required} className={wrapperClassName} htmlFor={id}>
      <textarea className={`${inputBase} py-2 resize-none ${className}`} {...rest} id={id} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, Omit<FieldWrapperProps, 'children' | 'className'> {
  wrapperClassName?: string;
}

export function SelectField({ label, hint, required, wrapperClassName, className = '', children, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const id = rest.id ?? autoId;
  return (
    <FieldWrapper label={label} hint={hint} required={required} className={wrapperClassName} htmlFor={id}>
      <select className={`${inputBase} h-9 ${className}`} {...rest} id={id}>
        {children}
      </select>
    </FieldWrapper>
  );
}
