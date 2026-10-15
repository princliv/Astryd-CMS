import { http } from './http';
import type { Restaurant, SiteAddress, Vertical } from '../types';

export interface SuperAdminSiteRow extends Restaurant {
  organizationName: string;
}

/** "Site" per the Multi-Vertical Platform Plan §2 is today's `Restaurant` row - no separate type yet (plan §12: no rename required for this phase). */
export const getSites = (organizationId: string) =>
  http.get<Restaurant[]>(`/organizations/${organizationId}/sites`);

/** Which parts of an existing outlet a new one starts from; outlet-specific details (address, slug, map) are never copied. */
export interface CopyFromSite {
  siteId: string;
  branding: boolean;
  menu: boolean;
  reservations: boolean;
}

/** The outlet's real map position; Google-sourced positions also carry the Google Place ID. */
export interface SiteLocationInput {
  location: { latitude: number; longitude: number; source: 'google' | 'owner' };
  googlePlaceId: string | null;
}

/** The timezone isn't sent - it comes from the map position. `vertical` is only a fallback: the server keeps the Org's existing type. */
export interface CreateSiteInput extends SiteLocationInput {
  name: string;
  slug: string;
  vertical: Vertical;
  address: SiteAddress | null;
  copyFrom?: CopyFromSite;
}

/** Owner only - adds another outlet (Site) to the Organization. */
export const createSite = (organizationId: string, input: CreateSiteInput) =>
  http.post<Restaurant>(`/organizations/${organizationId}/sites`, input);

export const updateSite = (
  organizationId: string,
  siteId: string,
  input: Partial<Pick<Restaurant, 'name' | 'address' | 'status'> & SiteLocationInput>,
) =>
  http.patch<Restaurant>(`/organizations/${organizationId}/sites/${siteId}`, input);

/** One-line address, in the same shape the API's `addressText` uses. */
export function formatSiteAddress(address: SiteAddress | null | undefined): string {
  if (!address) return '';
  const locality = [address.city, address.postalCode].filter(Boolean).join(' ');
  return [address.line1, address.line2, locality, address.region, address.country].filter(Boolean).join(', ');
}

/** Public - one live outlet of the Org, as listed by the site's location switcher and Locations page. */
export interface PublicLocation {
  id: string;
  slug: string;
  name: string;
  vertical: Vertical;
  address: SiteAddress | null;
  addressText: string;
  modules: { booking: boolean; catalog: boolean };
  current: boolean;
  location: { latitude: number; longitude: number } | null;
  googlePlaceId: string | null;
}

/** Google Maps directions to an outlet - by its pin when known, otherwise by its address. */
export function directionsUrl(location: PublicLocation): string | null {
  const destination = location.location ? `${location.location.latitude},${location.location.longitude}` : location.addressText;
  if (!destination) return null;
  const place = location.googlePlaceId ? `&destination_place_id=${encodeURIComponent(location.googlePlaceId)}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${place}`;
}

export const getPublicLocations = (siteId: string) =>
  http.get<PublicLocation[]>(`/public/sites/${siteId}/locations`);

/** Super Admin only (Plan §5.2) - every Site across every Org, for the Platform → Sites console. */
export const getAllSitesForSuperAdmin = () => http.get<SuperAdminSiteRow[]>('/superadmin/sites');

/** Super Admin only (Plan §5.2) - the sole write path for the "Powered by Astryd" footer badge. */
export const updateSiteBrandingBadge = (siteId: string, enabled: boolean) =>
  http.patch<Restaurant>(`/superadmin/sites/${siteId}/branding-badge`, { enabled });

/** Public, read-only - lets the storefront footer decide whether to show the badge; also carries `vertical` so the public site can style itself per Multi-Vertical Platform Plan §2 without a second round trip. */
export const getSiteBrandingBadge = (siteId: string) =>
  http.get<{ enabled: boolean; vertical: Vertical }>(`/public/sites/${siteId}/branding-badge`);
