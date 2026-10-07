import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Astryd card: 16px radius, 4% fill + 10% stroke in dark; header is a 14px medium title with an 11px dim description. */
export function SectionCard({ title, description, icon: Icon, actions, children, className = '' }: SectionCardProps) {
  return (
    <div className={`admin-card p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-2.5 min-w-0">
            {Icon && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,196,205,0.1)] astryd-text-cyan">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-[14px] font-medium astryd-text-bright">{title}</h3>}
              {description && <p className="text-[11px] astryd-text-dim mt-0.5">{description}</p>}
            </div>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
