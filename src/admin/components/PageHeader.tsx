import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Keeps a page's title block pinned to the top of the admin scroll area while the content scrolls
 * underneath. Sticks below a PublishBar when the page has one (it publishes its height as
 * `--sticky-offset` on the page root). Frosted `astryd-sticky` fill so the page gradient reads through.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  // No sentinel element: an extra sibling would become the page's first child and break `space-y-*` spacing.
  useEffect(() => {
    const el = ref.current;
    const scroller = el?.closest('main');
    if (!el || !scroller) return;
    const update = () => {
      const offset = parseFloat(getComputedStyle(el).top) || 0;
      setStuck(scroller.scrollTop > 0 && el.getBoundingClientRect().top - scroller.getBoundingClientRect().top <= offset + 0.5);
    };
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      ref={ref}
      // No drop shadow when pinned (by request) - just a hairline so scrolled content doesn't blur into the title.
      className={`sticky z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 border-b ${stuck ? 'astryd-sticky border-[var(--astryd-divider)]' : 'border-transparent'}`}
      style={{ top: 'var(--sticky-offset, 0px)' }}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, icon: Icon, actions, eyebrow }: PageHeaderProps) {
  return (
    <StickyHeader>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {Icon && (
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,196,205,0.1)] astryd-text-cyan">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <div className="text-[10px] font-semibold uppercase tracking-[0.12em] astryd-text-cyan mb-1">{eyebrow}</div>}
            <h1 className="text-[24px] sm:text-[32px] font-semibold leading-tight astryd-text-strong truncate tracking-tight">{title}</h1>
            {description && <p className="astryd-text-muted text-[13px] mt-1.5 max-w-2xl">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </StickyHeader>
  );
}
