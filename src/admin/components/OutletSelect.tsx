import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronsUpDown, Layers, MapPin } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { usePermissions } from '../hooks/usePermissions';
import { useDraftSave } from '../context/DraftSaveContext';
import { formatSiteAddress } from '../../services/sites';

interface OutletSelectProps {
  /** Offer "All locations" (for lists that can combine outlets, like reservations and orders). */
  allLocations?: { selected: boolean; onChange: (selected: boolean) => void };
  /** `compact` for the top bar; the default is a bordered control for page headers. */
  variant?: 'compact' | 'field';
}

/**
 * Chooses which outlet the dashboard is managing. Picking an outlet makes it the active one for every page
 * (menu, website, bookings, orders, settings), since all of their data belongs to one outlet.
 */
export function OutletSelect({ allLocations, variant = 'field' }: OutletSelectProps) {
  const { restaurantId, sites, setActiveSiteId } = useRestaurant();
  const perms = usePermissions();
  const { flushDraft } = useDraftSave();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const outlets = sites.filter((s) => s.status !== 'suspended');

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

  if (outlets.length <= 1) return null;
  const active = outlets.find((s) => s.id === restaurantId) ?? outlets[0];
  const showingAll = Boolean(allLocations?.selected);

  const choose = async (siteId: string | null) => {
    setIsOpen(false);
    if (siteId === null) return allLocations?.onChange(true);
    allLocations?.onChange(false);
    if (siteId === restaurantId) return;
    // Unsaved edits belong to the outlet they were made on - save them before switching away.
    await flushDraft();
    setActiveSiteId(siteId);
  };

  const triggerClass =
    variant === 'compact'
      ? 'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] astryd-text-bright transition-colors hover:bg-[var(--astryd-hover)]'
      : 'flex min-w-0 max-w-[16rem] items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface px-3 h-9 text-[13px] font-semibold text-on-surface transition-colors hover:border-primary/40';

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button type="button" onClick={() => setIsOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={isOpen} className={triggerClass}>
        {showingAll ? <Layers className="h-3.5 w-3.5 shrink-0" /> : <MapPin className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{showingAll ? 'All locations' : active.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 astryd-text-dim" />
      </button>

      {isOpen && (
        <div role="listbox" className="astryd-dropdown absolute right-0 top-full z-50 mt-1 w-72 py-1.5">
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] astryd-text-dim">Locations</div>
          {allLocations && (
            <button
              type="button"
              role="option"
              aria-selected={showingAll}
              onClick={() => choose(null)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] astryd-text-bright transition-colors hover:bg-[var(--astryd-hover)]"
            >
              <Layers className="h-3.5 w-3.5 shrink-0 astryd-text-dim" />
              <span className="flex-1 truncate">All locations</span>
              {showingAll && <Check className="h-4 w-4 shrink-0 astryd-text-cyan" />}
            </button>
          )}
          {outlets.map((site) => {
            const selected = !showingAll && site.id === active.id;
            const address = formatSiteAddress(site.address);
            return (
              <button
                key={site.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(site.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--astryd-hover)]"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 astryd-text-dim" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] astryd-text-bright">{site.name}</span>
                  {address && <span className="block truncate text-[11px] astryd-text-dim">{address}</span>}
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 astryd-text-cyan" />}
              </button>
            );
          })}
          {perms.isOwner && (
            <Link
              to="/admin/settings/locations"
              onClick={() => setIsOpen(false)}
              className="mt-1 block border-t border-[var(--astryd-divider)] px-3 pt-2 pb-1 text-[12px] astryd-text-cyan hover:underline"
            >
              Manage locations
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
