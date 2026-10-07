import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';
import { ModeToggle } from './ModeToggle';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** The AstryAi login screen frame: gradient page, centered frosted card, brand mark, title + muted subtitle. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="astryd-bg relative flex min-h-screen items-center justify-center p-4 font-sans">
      <div className="absolute right-4 top-4 z-20">
        <ModeToggle />
      </div>
      <div className="astryd-auth-card">
        <div className="mb-6 space-y-3 text-center">
          <div className="flex items-center justify-center">
            <BrandMark />
          </div>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight astryd-text-strong">{title}</h1>
            {subtitle && <p className="mt-1.5 text-[13px] astryd-text-muted">{subtitle}</p>}
          </div>
        </div>
        {children}
        {footer && <div className="mt-6 space-y-3 text-center">{footer}</div>}
      </div>
    </div>
  );
}
