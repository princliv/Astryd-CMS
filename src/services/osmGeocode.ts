import type { ResolvedPlace } from './googlePlaces';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: Partial<Record<'house_number' | 'road' | 'pedestrian' | 'unit' | 'city' | 'town' | 'village' | 'suburb' | 'state' | 'postcode' | 'country', string>>;
}

// Nominatim's usage policy requires an identifying Referer, which index.html's site-wide `no-referrer` would strip.
const NOMINATIM_REQUEST: RequestInit = { headers: { Accept: 'application/json' }, referrerPolicy: 'strict-origin-when-cross-origin' };

export type GeocodedAddress = Omit<ResolvedPlace, 'placeId'>;

/**
 * Address lookup on OpenStreetMap's public Nominatim service, used when Google Maps isn't configured.
 * Its usage policy allows only occasional, user-initiated searches, so call this on an explicit search - never per keystroke.
 */
export async function geocodeAddress(query: string): Promise<GeocodedAddress[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, NOMINATIM_REQUEST);
  if (!response.ok) throw new Error('Address search is unavailable right now. Please try again.');
  const results = (await response.json()) as NominatimResult[];
  return results.map(toGeocoded);
}

function toGeocoded(result: NominatimResult): GeocodedAddress {
  const a = result.address ?? {};
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    formattedAddress: result.display_name,
    address: {
      line1: [a.house_number, a.road ?? a.pedestrian].filter(Boolean).join(' '),
      line2: a.unit ?? '',
      city: a.city ?? a.town ?? a.village ?? a.suburb ?? '',
      region: a.state ?? '',
      postalCode: a.postcode ?? '',
      country: a.country ?? '',
    },
  };
}

/** The address at a map position (for a pin the owner placed by hand); `null` when nothing is found. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodedAddress | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`;
  const response = await fetch(url, NOMINATIM_REQUEST);
  if (!response.ok) return null;
  const result = (await response.json()) as NominatimResult & { error?: string };
  return result.error ? null : toGeocoded(result);
}
