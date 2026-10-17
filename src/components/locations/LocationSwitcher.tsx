import { useEffect, useRef, useState } from 'react';
import { usePageContent } from '../../context/usePageContent';
import { outletUrl } from '../../services/outletNavigation';
import { usePublicLocations } from './usePublicLocations';

/** The same page on the other outlet - or its home page when that outlet doesn't offer it. A cart never moves between outlets, so checkout lands on the menu. */
function targetHash(modules: { booking: boolean; catalog: boolean }) {
  const page = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (page === 'reservations') return modules.booking ? '#/reservations' : '#/';
  if (page === 'menu' || page === 'checkout') return modules.catalog ? '#/menu' : '#/';
  return window.location.hash || '#/';
}

/**
 * Header "Change location" control: lists this business's other outlets and opens the same page on the one chosen.
 * Each outlet keeps its own menu, availability and cart, so switching loads that outlet's site. Hidden for a single outlet.
 */
export function LocationSwitcher() {
  const c = usePageContent('global');
  const { locations, hasSiblings } = usePublicLocations();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  if (!hasSiblings) return null;
  const current = locations.find((l) => l.current);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={c.text('locationSwitcherLabel')}
        className="h-10 px-2 sm:px-3 flex items-center gap-1 text-on-surface rounded-full hover:bg-surface-container-low transition-colors text-sm font-semibold"
      >
        <span className="material-symbols-outlined text-[22px]">location_on</span>
        <span className="hidden lg:inline max-w-[11rem] truncate">{current?.name}</span>
        <span className="material-symbols-outlined text-lg hidden sm:inline">expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-outline-variant/20 bg-surface shadow-xl py-2 z-50 animate-fadeIn">
          <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-secondary">{c.text('locationSwitcherLabel')}</div>
          <div className="max-h-72 overflow-y-auto">
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (!location.current) window.location.assign(outletUrl(location, targetHash(location.modules)));
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low transition-colors"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold truncate ${location.current ? 'text-primary' : 'text-on-surface'}`}>{location.name}</span>
                  {location.current && <span className="material-symbols-outlined text-primary text-lg">check</span>}
                </span>
                {location.addressText && <span className="block text-xs text-secondary mt-0.5 truncate">{location.addressText}</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-outline-variant/15 mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.location.hash = '#/locations';
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors"
            >
              {c.text('locationsViewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
