import { Loader2 } from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';
import { usePageContent } from '../../context/usePageContent';
import { directionsUrl, type PublicLocation } from '../../services/sites';
import { outletUrl } from '../../services/outletNavigation';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { usePublicLocations } from './usePublicLocations';

export interface LocationsViewProps {
  onNavigateLanding: () => void;
  onNavigateMenu: () => void;
  onNavigateReservations: () => void;
  onToast: (msg: string) => void;
  cartUniqueCount: number;
  onOpenCart: () => void;
}

/** `#/locations` - every live outlet of this business, with directions and a way to book or order at each. */
export function LocationsView({ onNavigateLanding, onNavigateMenu, onNavigateReservations, onToast, cartUniqueCount, onOpenCart }: LocationsViewProps) {
  const c = usePageContent('global');
  const { getNavLabel } = usePublicData();
  const { locations, isPending } = usePublicLocations();

  // On the current outlet, book/order stay in-page; on another outlet they open that outlet's site.
  const go = (location: PublicLocation, hash: string, local: () => void) =>
    location.current ? local() : window.location.assign(outletUrl(location, hash));

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header currentPage="locations" onNavigateLanding={onNavigateLanding} onNavigateMenu={onNavigateMenu} onNavigateReservations={onNavigateReservations} onToast={onToast} cartUniqueCount={cartUniqueCount} onOpenCart={onOpenCart} />

      <main className="flex-grow pt-28 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">{c.text('locationsTitle')}</h1>
          <p className="text-secondary mt-2">{c.text('locationsIntro')}</p>
        </div>

        {isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {locations.map((location) => {
              const directions = directionsUrl(location);
              return (
                <article
                  key={location.id}
                  className={`bg-surface p-6 rounded-2xl shadow-sm flex flex-col ${location.current ? 'border-2 border-primary' : 'border border-outline-variant/20'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-serif text-xl font-semibold text-on-surface">{location.name}</h2>
                    {location.current && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {c.text('locationsCurrent')}
                      </span>
                    )}
                  </div>
                  {location.addressText && (
                    <p className="mt-2 flex items-start gap-2 text-sm text-secondary">
                      <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                      <span>{location.addressText}</span>
                    </p>
                  )}
                  <div className="mt-auto pt-5 flex flex-wrap items-center gap-2">
                    {location.modules.booking && (
                      <button
                        type="button"
                        onClick={() => go(location, '#/reservations', onNavigateReservations)}
                        className="px-4 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        {getNavLabel('booking', 'Reservation')}
                      </button>
                    )}
                    {location.modules.catalog && (
                      <button
                        type="button"
                        onClick={() => go(location, '#/menu', onNavigateMenu)}
                        className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
                      >
                        {getNavLabel('catalog', 'Menu')}
                      </button>
                    )}
                    {!location.current && (
                      <button
                        type="button"
                        onClick={() => go(location, '#/', onNavigateLanding)}
                        className="px-4 py-2 rounded-full border border-outline-variant/40 text-on-surface text-sm font-semibold hover:border-primary transition-colors"
                      >
                        {c.text('locationsVisit')}
                      </button>
                    )}
                    {directions && (
                      <a
                        href={directions}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">directions</span>
                        {c.text('locationsDirections')}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer onNavigateLanding={onNavigateLanding} onNavigateMenu={onNavigateMenu} onNavigateReservations={onNavigateReservations} onToast={onToast} />
    </div>
  );
}
