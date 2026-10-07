import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: 'primary' | 'tertiary' | 'secondary' | 'error';
  onClick?: () => void;
  className?: string;
}

/** Icon-tile hues from AstryAi's summary cards (cyan / purple / blue / red on a 10% tint). */
const TONE_CLASSES: Record<Required<MetricCardProps>['tone'], string> = {
  primary: 'bg-[rgba(0,196,205,0.1)] astryd-text-cyan',
  tertiary: 'bg-purple-500/10 text-purple-500',
  secondary: 'bg-blue-500/10 text-blue-500',
  error: 'bg-red-500/10 text-red-400',
};

/** Astryd stat card, scaled up for the dashboard hero row: a large icon tile, then a 13px label, a 40px extra-bold value and a 12px detail. */
export function MetricCard({ label, value, icon: Icon, hint, tone = 'primary', onClick, className = '' }: MetricCardProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`group astryd-card astryd-card-sm text-left p-5 w-full h-full min-h-[104px] flex flex-col justify-between gap-6 transition-colors ${
        onClick ? 'cursor-pointer hover:border-[rgba(0,196,205,0.3)]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {onClick && (
          <ArrowUpRight className="h-4 w-4 astryd-text-dim opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="text-[13px] font-medium astryd-text-muted">{label}</div>
        <div className="truncate text-[40px] font-extrabold leading-none tracking-tight tabular-nums astryd-text-strong">{value}</div>
        {hint && <div className="pt-0.5 text-[12px] astryd-text-dim">{hint}</div>}
      </div>
    </Tag>
  );
}
