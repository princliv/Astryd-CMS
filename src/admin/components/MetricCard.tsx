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

/** Astryd stat card: 12px muted label with an icon tile, then a 24px extra-bold tabular value and an 11px dim detail. */
export function MetricCard({ label, value, icon: Icon, hint, tone = 'primary', onClick, className = '' }: MetricCardProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`group astryd-card astryd-card-sm text-left p-4 w-full h-full min-h-[104px] flex flex-col justify-between gap-3 transition-colors ${
        onClick ? 'cursor-pointer hover:border-[rgba(0,196,205,0.3)]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] astryd-text-muted">{label}</span>
        <div className="flex items-center gap-1.5">
          {onClick && (
            <ArrowUpRight className="h-3.5 w-3.5 astryd-text-dim opacity-0 transition-opacity group-hover:opacity-100" />
          )}
          <div className={`rounded-lg p-1.5 ${TONE_CLASSES[tone]}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-[24px] font-extrabold leading-none tracking-tight tabular-nums astryd-text-bright">{value}</div>
        {hint && <div className="text-[11px] astryd-text-dim">{hint}</div>}
      </div>
    </Tag>
  );
}
