import { useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme, type Theme } from '../theme/ThemeProvider';

const OPTIONS: { value: Theme; label: string; hint: string; icon: LucideIcon; iconClass: string }[] = [
  { value: 'light', label: 'Light', hint: 'Light theme', icon: Sun, iconClass: 'astryd-text-warning' },
  { value: 'dark', label: 'Dark', hint: 'Dark theme', icon: Moon, iconClass: 'astryd-text-muted' },
  { value: 'system', label: 'System', hint: 'Follow system', icon: Monitor, iconClass: 'astryd-text-muted' },
];

/** Astryd's theme switch: a sun/moon icon button that opens a Light / Dark / System menu. */
export function ModeToggle({ compact = false, align = 'right' }: { compact?: boolean; align?: 'left' | 'right' }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === 'dark';
  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-[1.2rem] w-[1.2rem]';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`astryd-btn-icon relative overflow-hidden ${compact ? 'h-7 w-7' : 'h-10 w-10 hover:scale-105'}`}
      >
        <Sun
          className={`${iconSize} astryd-text-warning transition-all ${isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'}`}
        />
        <Moon
          className={`absolute ${iconSize} astryd-text-muted transition-all ${isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`astryd-dropdown absolute top-full z-50 mt-2 w-48 p-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {OPTIONS.map(({ value, label, hint, icon: Icon, iconClass }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === value}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-[var(--astryd-hover)]"
            >
              <span className="rounded-md bg-[var(--astryd-hover)] p-1.5">
                <Icon className={`h-4 w-4 ${iconClass}`} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium astryd-text-bright">{label}</span>
                <span className="text-xs astryd-text-muted">{hint}</span>
              </span>
              {theme === value && <span className={`h-2 w-2 shrink-0 rounded-full ${value === 'light' ? 'bg-orange-500' : 'bg-slate-500'}`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
