import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GOOGLE_MAP_ID,
  googleMapsConfigured,
  loadMap,
  resolvePlace,
  reverseGeocodeGoogle,
  suggestPlaces,
  type GoogleMap,
  type GoogleMarker,
  type PlaceSuggestion,
} from '../../services/googlePlaces';
import { geocodeAddress, reverseGeocode, type GeocodedAddress } from '../../services/osmGeocode';
import type { SiteAddress } from '../../types';
import { Button } from './Button';

/** A real map position for an outlet - from Google Places, an OpenStreetMap address lookup, or a pin the owner placed. */
export interface PickedLocation {
  latitude: number;
  longitude: number;
  source: 'google' | 'owner';
  googlePlaceId: string | null;
}

interface Point {
  latitude: number;
  longitude: number;
}

interface LocationFinderProps {
  location: PickedLocation | null;
  /** `address` is set when the position came from a search result, so the address fields can be filled in. */
  onPick: (location: PickedLocation, address?: SiteAddress) => void;
  /** The address at a pin placed by hand - a suggestion the form only uses for fields that are still empty. */
  onAddressAtPin?: (address: SiteAddress) => void;
  /** Where the map opens before anything is picked, e.g. another outlet of the same business. */
  initialCenter?: Point | null;
  required?: boolean;
}

const inputClass =
  'w-full h-9 rounded-lg border border-outline-variant/40 bg-surface pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary';

export function LocationFinder({ location, onPick, onAddressAtPin, initialCenter, required }: LocationFinderProps) {
  const [query, setQuery] = useState('');
  const [googleResults, setGoogleResults] = useState<PlaceSuggestion[]>([]);
  const [osmResults, setOsmResults] = useState<GeocodedAddress[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Google suggestions update as the owner types (debounced); OpenStreetMap is searched only on request.
  useEffect(() => {
    if (!googleMapsConfigured || query.trim().length < 3) {
      setGoogleResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      suggestPlaces(query.trim())
        .then((results) => {
          setGoogleResults(results);
          setError('');
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Google Places is unavailable.'));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchOsm = async () => {
    if (query.trim().length < 3) return;
    setSearching(true);
    setError('');
    try {
      const results = await geocodeAddress(query.trim());
      setOsmResults(results);
      if (results.length === 0) setError('No matching address found. Try adding the city or postcode, or click the spot on the map.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Address search is unavailable.');
    } finally {
      setSearching(false);
    }
  };

  const pickGoogle = async (suggestion: PlaceSuggestion) => {
    setSearching(true);
    try {
      const place = await resolvePlace(suggestion);
      onPick({ latitude: place.latitude, longitude: place.longitude, source: 'google', googlePlaceId: place.placeId }, place.address);
      setQuery(place.formattedAddress);
      setGoogleResults([]);
      setError('');
    } catch {
      setError('Unable to retrieve that place. Pick another result.');
    } finally {
      setSearching(false);
    }
  };

  const pickOsm = (result: GeocodedAddress) => {
    onPick({ latitude: result.latitude, longitude: result.longitude, source: 'owner', googlePlaceId: null }, result.address);
    setQuery(result.formattedAddress);
    setOsmResults([]);
  };

  /** A pin the owner clicked or dragged: their own exact position (any Google place match is kept). */
  const placePin = (latitude: number, longitude: number) => {
    onPick({ latitude, longitude, source: 'owner', googlePlaceId: location?.googlePlaceId ?? null });
    if (!onAddressAtPin) return;
    const lookup = googleMapsConfigured
      ? reverseGeocodeGoogle(latitude, longitude)
      : reverseGeocode(latitude, longitude).then((r) => r?.address ?? null);
    lookup.then((address) => address && onAddressAtPin(address)).catch(() => {});
  };

  const results = googleMapsConfigured
    ? googleResults.map((r) => ({ key: r.placeId, label: r.label, pick: () => pickGoogle(r) }))
    : osmResults.map((r, i) => ({ key: `${i}-${r.latitude}`, label: r.formattedAddress, pick: () => pickOsm(r) }));

  const MapView = googleMapsConfigured ? GooglePinMap : LeafletPinMap;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5">
          Find the location
          {required && <span className="text-secondary"> *</span>}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              className={inputClass}
              value={query}
              placeholder={googleMapsConfigured ? 'Search the business name or address' : 'Street, city and postcode'}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!googleMapsConfigured) void searchOsm();
                }
              }}
            />
          </div>
          {!googleMapsConfigured && (
            <Button type="button" variant="outline" loading={searching} disabled={query.trim().length < 3} onClick={searchOsm}>
              Search
            </Button>
          )}
        </div>
        {results.length > 0 && (
          <div className="mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface divide-y divide-outline-variant/10">
            {results.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={r.pick}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        )}
        {error && <p role="status" className="mt-1 text-xs text-error">{error}</p>}
      </div>

      <div className="space-y-1">
        <MapView position={location} center={initialCenter ?? null} onPlace={placePin} />
        <p className="text-[11px] text-secondary">
          {location
            ? 'Drag the pin, or click the map, to put it exactly on the entrance.'
            : 'Search above, or click the exact spot on the map to drop a pin.'}
          {!googleMapsConfigured && ' Map data © OpenStreetMap contributors.'}
        </p>
      </div>
    </div>
  );
}

interface PinMapProps {
  position: Point | null;
  /** Where to open when there's no pin yet; the whole world when unknown. */
  center: Point | null;
  onPlace: (latitude: number, longitude: number) => void;
}

const PIN_ZOOM = 17;

/** Keyless OpenStreetMap map (Leaflet): click to drop the pin, drag it to fine-tune. */
function LeafletPinMap({ position, center, onPlace }: PinMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const onPlaceRef = useRef(onPlace);
  useEffect(() => {
    onPlaceRef.current = onPlace;
  }, [onPlace]);

  useEffect(() => {
    if (!host.current) return;
    const start = position ?? center;
    const instance = L.map(host.current).setView(start ? [start.latitude, start.longitude] : [20, 0], position ? PIN_ZOOM : start ? 14 : 2);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      // index.html sets `no-referrer` site-wide, but OpenStreetMap answers 403 to tile requests without one; send just the origin.
      referrerPolicy: 'strict-origin-when-cross-origin',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    instance.on('click', (e: L.LeafletMouseEvent) => onPlaceRef.current(e.latlng.lat, e.latlng.lng));
    map.current = instance;
    // The map is created inside an opening modal; re-measure once it has its final size.
    const timer = window.setTimeout(() => instance.invalidateSize(), 250);
    return () => {
      window.clearTimeout(timer);
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // Created once; position changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !position) return;
    const latLng: L.LatLngTuple = [position.latitude, position.longitude];
    if (!marker.current) {
      marker.current = L.marker(latLng, { draggable: true, icon: PIN_ICON, title: 'Drag to the exact entrance' }).addTo(instance);
      marker.current.on('dragend', () => {
        const p = marker.current?.getLatLng();
        if (p) onPlaceRef.current(p.lat, p.lng);
      });
      instance.setView(latLng, Math.max(instance.getZoom(), PIN_ZOOM));
    } else {
      marker.current.setLatLng(latLng);
      if (!instance.getBounds().contains(latLng)) instance.setView(latLng, PIN_ZOOM);
    }
  }, [position?.latitude, position?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} className="h-64 w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low z-0" />;
}

// An inline SVG pin, so no marker image assets have to be resolved by the bundler.
const PIN_ICON = L.divIcon({
  className: '',
  html: '<svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#0e7490"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

/** Google map (when a Maps key is configured): click to drop the pin, drag it to fine-tune. */
function GooglePinMap({ position, center, onPlace }: PinMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<GoogleMap | null>(null);
  const marker = useRef<GoogleMarker | null>(null);
  const library = useRef<Awaited<ReturnType<typeof loadMap>> | null>(null);
  const onPlaceRef = useRef(onPlace);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    onPlaceRef.current = onPlace;
  }, [onPlace]);

  useEffect(() => {
    let cancelled = false;
    loadMap()
      .then((loaded) => {
        if (cancelled || !host.current) return;
        library.current = loaded;
        const start = position ?? center;
        map.current = new loaded.Map(host.current, {
          center: start ? { lat: start.latitude, lng: start.longitude } : { lat: 20, lng: 0 },
          zoom: position ? PIN_ZOOM : start ? 14 : 2,
          mapId: GOOGLE_MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        map.current.addListener('click', (event) => {
          if (event.latLng) onPlaceRef.current(event.latLng.lat(), event.latLng.lng());
        });
        setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Created once; position changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !map.current || !library.current || !position) return;
    const latLng = { lat: position.latitude, lng: position.longitude };
    if (!marker.current) {
      marker.current = new library.current.AdvancedMarkerElement({ map: map.current, position: latLng, gmpDraggable: true, title: 'Drag to the exact entrance' });
      marker.current.addListener('dragend', () => {
        const p = marker.current?.position;
        if (!p) return;
        onPlaceRef.current(typeof p.lat === 'function' ? p.lat() : p.lat, typeof p.lng === 'function' ? p.lng() : p.lng);
      });
      map.current.setCenter(latLng);
      map.current.setZoom(PIN_ZOOM);
    } else {
      marker.current.position = latLng;
      map.current.setCenter(latLng);
    }
  }, [ready, position?.latitude, position?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} className="h-64 w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low" />;
}
