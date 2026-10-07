import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 admin-card border-dashed">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,196,205,0.08)] mb-5">
        <Icon className="h-7 w-7 astryd-text-cyan" strokeWidth={1.5} />
      </div>
      <h3 className="text-[14px] font-medium astryd-text-bright mb-1.5">{title}</h3>
      {description && <p className="text-[12px] astryd-text-muted max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
