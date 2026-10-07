import { useMemo } from 'react';
import { MapPin, Menu } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { usePermissions } from '../hooks/usePermissions';
import { ModeToggle } from './ModeToggle';
import { UserMenu } from './UserMenu';

/** Astryd's top bar: slim 48px strip, right-aligned status (site, date), theme toggle, then the avatar menu. */
export function AdminTopBar() {
  const { openMobile } = useSidebar();
  const { restaurantId, sites } = useRestaurant();
  const perms = usePermissions();

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
    []
  );
  const siteName = perms.isSuperAdmin ? 'Platform' : (sites.find((s) => s.id === restaurantId)?.name ?? sites[0]?.name ?? '—');

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 shrink-0">
      <div className="flex h-12 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={openMobile}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md astryd-text-muted transition-colors hover:text-[var(--astryd-text-bright)] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-visible sm:gap-3 lg:gap-5">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--astryd-success)' }} />
            <span className="flex min-w-0 items-center gap-1.5 truncate text-[12px] astryd-text-dim">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{siteName}</span>
            </span>
          </div>

          <span className="hidden whitespace-nowrap text-[12px] astryd-text-dim sm:inline">{today}</span>

          <ModeToggle compact />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
