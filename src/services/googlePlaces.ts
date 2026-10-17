interface LatLng { lat(): number; lng(): number }
interface AddressComponent { longText: string | null; shortText: string | null; types: string[] }
interface Place {
  id: string;
  location?: LatLng;
  formattedAddress?: string | null;
  addressComponents?: AddressComponent[];
  fetchFields(options: { fields: string[] }): Promise<unknown>;
}
export interface PlaceSelection extends Event { placePrediction: { toPlace(): Place } }
interface PlacePrediction { placeId: string; text: { toString(): string }; toPlace(): Place }
interface PlacesLibrary {
  PlaceAutocompleteElement: new () => HTMLElement;
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: { input: string; sessionToken?: object }): Promise<{ suggestions: Array<{ placePrediction: PlacePrediction | null }> }>;
  };
}
export interface GoogleMap {
  setCenter(position: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
  addListener(event: 'click', handler: (event: { latLng: LatLng | null }) => void): { remove(): void };
}
interface GeocoderResult { formatted_address: string; address_components: Array<{ long_name: string; short_name: string; types: string[] }> }
interface GeocodingLibrary {
  Geocoder: new () => { geocode(request: { location: { lat: number; lng: number } }): Promise<{ results: GeocoderResult[] }> };
}
export interface GoogleMarker extends EventTarget {
  position: { lat: number; lng: number } | LatLng | null;
  map: GoogleMap | null;
  addListener(event: 'dragend', handler: () => void): { remove(): void };
}
interface MapsLibrary { Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap }
interface MarkerLibrary { AdvancedMarkerElement: new (options: Record<string, unknown>) => GoogleMarker }
interface MapsApi { maps: { importLibrary(name: string): Promise<unknown> } }

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
let loading: Promise<MapsApi['maps']> | undefined;

/** Whether Google Maps/Places can be used at all - without a key the admin falls back to OpenStreetMap lookup. */
export const googleMapsConfigured = Boolean(KEY);

function loadGoogleMaps(): Promise<MapsApi['maps']> {
  if (!KEY) return Promise.reject(new Error('Configure VITE_GOOGLE_MAPS_API_KEY to enable Google place matching. You can enter your own coordinates below.'));
  const googleWindow = window as Window & { google?: MapsApi; astrydPlacesReady?: () => void };
  if (googleWindow.google?.maps) return Promise.resolve(googleWindow.google.maps);
  if (!loading) {
    loading = new Promise<MapsApi['maps']>((resolve, reject) => {
      const script = document.createElement('script');
      googleWindow.astrydPlacesReady = () => {
        resolve(googleWindow.google!.maps);
        delete googleWindow.astrydPlacesReady;
      };
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&loading=async&callback=astrydPlacesReady`;
      script.async = true;
      script.onerror = () => { script.remove(); loading = undefined; reject(new Error('Google Places could not load. Please try again.')); };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export const loadPlaces = () => loadGoogleMaps().then((maps) => maps.importLibrary('places') as Promise<PlacesLibrary>);
export const loadMap = () =>
  loadGoogleMaps().then(async (maps) => ({
    ...((await maps.importLibrary('maps')) as MapsLibrary),
    ...((await maps.importLibrary('marker')) as MarkerLibrary),
  }));

/** Advanced markers need a Map ID; Google's demo ID works for development until a real one is configured. */
export const GOOGLE_MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) || 'DEMO_MAP_ID';

export interface PlaceSuggestion { placeId: string; label: string; prediction: PlacePrediction }

export interface ResolvedPlace {
  placeId: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  address: { line1: string; line2: string; city: string; region: string; postalCode: string; country: string };
}

let sessionToken: object | undefined;

export async function suggestPlaces(input: string): Promise<PlaceSuggestion[]> {
  const places = await loadPlaces();
  sessionToken ??= new places.AutocompleteSessionToken();
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input, sessionToken });
  return suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is PlacePrediction => Boolean(p))
    .map((prediction) => ({ placeId: prediction.placeId, label: prediction.text.toString(), prediction }));
}

export async function resolvePlace(suggestion: PlaceSuggestion): Promise<ResolvedPlace> {
  const place = suggestion.prediction.toPlace();
  await place.fetchFields({ fields: ['id', 'location', 'formattedAddress', 'addressComponents'] });
  sessionToken = undefined; // A session ends once a place is fetched.
  if (!place.location) throw new Error('This place has no map coordinates.');
  const part = (type: string, short = false) => {
    const component = place.addressComponents?.find((c) => c.types.includes(type));
    return (short ? component?.shortText : component?.longText) ?? '';
  };
  return {
    placeId: place.id,
    latitude: place.location.lat(),
    longitude: place.location.lng(),
    formattedAddress: place.formattedAddress ?? suggestion.label,
    address: {
      line1: [part('street_number'), part('route')].filter(Boolean).join(' ') || part('premise') || part('point_of_interest'),
      line2: part('subpremise'),
      city: part('locality') || part('postal_town') || part('sublocality'),
      region: part('administrative_area_level_1'),
      postalCode: part('postal_code'),
      country: part('country'),
    },
  };
}

/** The address at a map position (for a pin the owner placed by hand); `null` when nothing is found. */
export async function reverseGeocodeGoogle(latitude: number, longitude: number): Promise<ResolvedPlace['address'] | null> {
  const maps = await loadGoogleMaps();
  const { Geocoder } = (await maps.importLibrary('geocoding')) as GeocodingLibrary;
  const { results } = await new Geocoder().geocode({ location: { lat: latitude, lng: longitude } });
  const best = results[0];
  if (!best) return null;
  const part = (type: string) => best.address_components.find((c) => c.types.includes(type))?.long_name ?? '';
  return {
    line1: [part('street_number'), part('route')].filter(Boolean).join(' ') || part('premise'),
    line2: part('subpremise'),
    city: part('locality') || part('postal_town') || part('sublocality'),
    region: part('administrative_area_level_1'),
    postalCode: part('postal_code'),
    country: part('country'),
  };
}
