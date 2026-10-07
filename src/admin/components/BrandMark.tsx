import { Sparkles } from 'lucide-react';

/** Lumière wordmark in the Astryd treatment: a cyan-tinted icon tile beside an Inter semibold wordmark. */
export function BrandMark({ size = 'md', showName = true, name = 'Lumière' }: { size?: 'sm' | 'md'; showName?: boolean; name?: string }) {
  const tile = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-[10px]';
  return (
    <div className="inline-flex min-w-0 items-center gap-2.5">
      <span className={`flex shrink-0 items-center justify-center bg-[rgba(0,196,205,0.12)] ${tile}`}>
        <Sparkles className={`astryd-text-cyan ${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
      </span>
      {showName && <span className="truncate text-[17px] font-semibold tracking-tight astryd-text-strong">{name}</span>}
    </div>
  );
}
