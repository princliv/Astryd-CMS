import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getSites } from '../services/sites';
import { http } from '../services/http';
import type { Restaurant } from '../types';

const MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const DEFAULT_RESTAURANT_ID = MOCKS ? 'rest_lumiere' : '';
const DEFAULT_RESTAURANT_SLUG = MOCKS ? 'lumiere-mayfair' : '';
const DEFAULT_ORGANIZATION_ID = MOCKS ? 'org_lumiere' : '';
const ACTIVE_SITE_STORAGE_KEY = 'admin_active_site_id';

interface RestaurantContextValue {
  organizationId: string;
  restaurantId: string;
  restaurantSlug: string;
  /** Multi-Vertical Platform Plan §14, Phase 1 - the Sites this user can switch between within their Org; empty on the public site. */
  sites: Restaurant[];
  setActiveSiteId: (siteId: string) => void;
}

const RestaurantContext = createContext<RestaurantContextValue>({
  organizationId: DEFAULT_ORGANIZATION_ID,
  restaurantId: DEFAULT_RESTAURANT_ID,
  restaurantSlug: DEFAULT_RESTAURANT_SLUG,
  sites: [],
  setActiveSiteId: () => {},
});

/**
 * Public site: resolves to the Site named by `?site=` (set by the admin's Preview flow, which now
 * always passes the Site being edited - see `draftPreviewUrl`), falling back to the platform default
 * when absent so a bare `?preview=true` link keeps working. No real domain routing yet - Multi-Vertical
 * Platform Plan §9.2 is what eventually replaces this with Host-header resolution.
 */
export function PublicRestaurantProvider({ children }: { children: ReactNode }) {
  const siteIdParam = new URLSearchParams(window.location.search).get('site');
  const slug = window.location.pathname.match(/^\/s\/([^/]+)/)?.[1];
  const { data: site, isPending, error } = useQuery({
    queryKey: ['public-site-resolver', slug, window.location.hostname],
    queryFn: () => http.get<Restaurant>(`/public/sites/resolve?${slug ? `slug=${encodeURIComponent(slug)}` : `hostname=${encodeURIComponent(window.location.hostname)}`}`),
    enabled: !MOCKS && !siteIdParam,
    retry: false,
  });
  const restaurantId = siteIdParam || site?.id || DEFAULT_RESTAURANT_ID;
  if (!MOCKS && !siteIdParam && isPending) return <p role="status">Loading site…</p>;
  if (!restaurantId || error) return <p role="alert">Site not found. Open a site address or preview it from your dashboard.</p>;

  return (
    <RestaurantContext.Provider
      value={{
        organizationId: site?.organizationId || DEFAULT_ORGANIZATION_ID,
        restaurantId,
        restaurantSlug: site?.slug || DEFAULT_RESTAURANT_SLUG,
        sites: [],
        setActiveSiteId: () => {},
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

/**
 * Admin: resolves the Org from the logged-in user, then which Site within it is "active" (Multi-Vertical
 * Platform Plan §10.2's Site switcher). Falls back to the user's own `restaurantId`, then the first Site
 * the API returns, then the global defaults - in that order - so this degrades gracefully for a
 * single-Site Org (today's only real case) while being ready for more.
 */
export function AdminRestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

  const { data: sites } = useQuery({
    queryKey: ['sites', organizationId],
    queryFn: () => getSites(organizationId),
    enabled: Boolean(user && organizationId),
  });

  const [activeSiteId, setActiveSiteIdState] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_SITE_STORAGE_KEY),
  );

  // A suspended outlet can't be operated on (the API answers 403), so it's never the active one.
  const operable = useMemo(() => (sites ?? []).filter((s) => s.status !== 'suspended'), [sites]);

  useEffect(() => {
    if (operable.length === 0) return;
    if (activeSiteId && operable.some((s) => s.id === activeSiteId)) return;
    const fallback = operable.find((s) => s.id === user?.restaurantId)?.id ?? operable[0].id;
    setActiveSiteIdState(fallback);
    localStorage.setItem(ACTIVE_SITE_STORAGE_KEY, fallback);
  }, [operable, activeSiteId, user?.restaurantId]);

  const setActiveSiteId = useCallback(
    (siteId: string) => {
      // Read the cache rather than this render's `sites` so an outlet created a moment ago can be switched to.
      const latest = queryClient.getQueryData<Restaurant[]>(['sites', organizationId]) ?? sites;
      if (!latest?.some((s) => s.id === siteId && s.status !== 'suspended')) return;
      setActiveSiteIdState(siteId);
      localStorage.setItem(ACTIVE_SITE_STORAGE_KEY, siteId);
      // Every admin data hook keys its queries `['admin-<domain>', restaurantId, ...]` - re-scope them all in one go.
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('admin-');
        },
      });
    },
    [queryClient, sites, organizationId],
  );

  const activeSite = operable.find((s) => s.id === activeSiteId);
  useEffect(() => {
    document.title = activeSite?.name ? `${activeSite.name} | Admin` : 'Astryd | Admin';
  }, [activeSite?.name]);
  const restaurantId = activeSite?.id ?? user?.restaurantId ?? DEFAULT_RESTAURANT_ID;
  const restaurantSlug = activeSite?.slug ?? DEFAULT_RESTAURANT_SLUG;

  return (
    <RestaurantContext.Provider value={{ organizationId, restaurantId, restaurantSlug, sites: sites ?? [], setActiveSiteId }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  return useContext(RestaurantContext);
}
