import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Save } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { getReserveSettings, saveReserveSettings } from '../../../services/reserve';
import type { ReserveSettings } from '../../../services/reserve';
import { supportsSeating } from '../../../services/bookingPolicy';
import { loadPlaces } from '../../../services/googlePlaces';
import type { PlaceSelection } from '../../../services/googlePlaces';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { useAdminToast } from '../../context/AdminToastContext';

const input = 'w-full mt-1 rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface';

export function ReserveSettingsPage() {
  const { restaurantId } = useRestaurant();
  const client = useQueryClient();
  const { showToast } = useAdminToast();
  const query = useQuery({ queryKey: ['reserve-settings', restaurantId], queryFn: () => getReserveSettings(restaurantId), retry: false });
  const [draft, setDraft] = useState<ReserveSettings | null>(null);
  const [mapError, setMapError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [updateTiming, setUpdateTiming] = useState(false);
  const autocompleteHost = useRef<HTMLDivElement>(null);
  const selectionHandler = useRef<((event: Event) => void) | null>(null);
  useEffect(() => {
    setUpdateTiming(false);
    setDraft(query.data ? { ...query.data, timezone: query.data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, booking_duration_mins: query.data.booking_duration_mins ?? 120, slot_interval_mins: query.data.slot_interval_mins ?? 15 } : null);
  }, [query.data, restaurantId]);
  useEffect(() => () => {
    const widget = autocompleteHost.current?.firstElementChild;
    if (widget && selectionHandler.current) widget.removeEventListener('gmp-select', selectionHandler.current);
  }, []);
  const save = useMutation({ mutationFn: (settings: Partial<ReserveSettings>) => saveReserveSettings(restaurantId, settings), onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['reserve-settings', restaurantId] });
    await client.invalidateQueries({ queryKey: ['admin-reservation-availability', restaurantId] });
    showToast('Reserve settings saved. Published businesses with booking enabled and a location can appear on Reserve.');
  } });
  async function connectPlace() {
    setMapError(''); setConnecting(true);
    try {
      const { PlaceAutocompleteElement } = await loadPlaces();
      const widget = new PlaceAutocompleteElement();
      widget.setAttribute('placeholder', 'Search for your business');
      const handler = async (event: Event) => {
        try {
          const place = (event as PlaceSelection).placePrediction.toPlace();
          await place.fetchFields({ fields: ['id', 'location'] });
          if (!place.location) throw new Error('This place has no map coordinates.');
          setDraft((current) => current ? { ...current, google_place_id: place.id, location: { latitude: place.location!.lat(), longitude: place.location!.lng(), source: 'google' } } : current);
          setMapError('');
        } catch { setMapError('Unable to retrieve that place. Select another result or enter coordinates.'); }
      };
      selectionHandler.current = handler;
      widget.addEventListener('gmp-select', handler);
      autocompleteHost.current?.replaceChildren(widget);
    } catch (error) { setMapError(error instanceof Error ? error.message : 'Google Places is unavailable.'); }
    finally { setConnecting(false); }
  }
  if (query.isPending) return <p role="status">Loading Reserve settings…</p>;
  if (query.error || !draft) return <p role="alert">{query.error?.message || 'Reserve settings are unavailable.'}</p>;
  const update = (patch: Partial<ReserveSettings>) => setDraft({ ...draft, ...patch });
  const seatingEnabled = supportsSeating(draft.vertical);
  const coordinate = (field: 'latitude' | 'longitude', value: string) => update({ location: { latitude: draft.location?.latitude ?? 0, longitude: draft.location?.longitude ?? 0, source: 'owner', [field]: Number(value) } });
  return <div className="space-y-6">
    <PageHeader
      icon={MapPin}
      title="Astryd Reserve"
      description="Manage this business’s map location and booking timing."
      actions={<Button type="submit" form="reserve-settings-form" variant="primary" icon={Save} loading={save.isPending}>Save Reserve settings</Button>}
    />
    <form id="reserve-settings-form" onSubmit={(event) => {
      event.preventDefault();
      const { booking_duration_mins, slot_interval_mins, seating_areas, tables, ...location } = draft;
      const settings = seatingEnabled ? { ...location, seating_areas, tables } : location;
      save.mutate(updateTiming ? { ...settings, booking_duration_mins, slot_interval_mins } : settings);
    }} className="space-y-6">
      <section className="admin-card p-5 space-y-4">
        <h2 className="font-semibold">Map location</h2>
        <Button type="button" onClick={connectPlace} loading={connecting}>Find on Google Maps</Button>
        <div ref={autocompleteHost} />
        {mapError && <p role="status" className="text-sm text-secondary">{mapError}</p>}
        <label className="block text-sm">Google Place ID<input className={input} value={draft.google_place_id ?? ''} onChange={(event) => update({ google_place_id: event.target.value || null })} /></label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Latitude<input className={input} type="number" step="any" min={-90} max={90} value={draft.location?.latitude ?? ''} onChange={(event) => coordinate('latitude', event.target.value)} required /></label>
          <label className="text-sm">Longitude<input className={input} type="number" step="any" min={-180} max={180} value={draft.location?.longitude ?? ''} onChange={(event) => coordinate('longitude', event.target.value)} required /></label>
        </div>
        <p className="text-xs text-secondary">Confirm that this location belongs to your business. Manually entered coordinates must come from your own location data. Google-derived coordinates expire and require server refresh.</p>
        <label className="block text-sm">Business time zone<input className={input} placeholder="America/New_York" value={draft.timezone ?? ''} onChange={(event) => update({ timezone: event.target.value })} required /></label>
      </section>
      <section className="admin-card p-5 space-y-4">
        <h2 className="font-semibold">Reservation timing</h2>
        <label className="block text-sm"><input type="checkbox" checked={updateTiming} onChange={(event) => setUpdateTiming(event.target.checked)} /> Update reservation timing for this business</label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Start interval (minutes)<input className={input} type="number" min={15} max={240} disabled={!updateTiming} value={draft.slot_interval_mins ?? 15} onChange={(event) => update({ slot_interval_mins: Number(event.target.value) })} required /></label>
          <label className="text-sm">Reservation duration (minutes)<input className={input} type="number" min={15} max={240} disabled={!updateTiming} value={draft.booking_duration_mins ?? 120} onChange={(event) => update({ booking_duration_mins: Number(event.target.value) })} required /></label>
        </div>
        <p className="text-sm text-secondary">Location-only saves preserve current booking timing. Enable this option to change the start interval and duration and activate overlap protection. Opening hours, blocked dates, and disabled starts remain controlled under Reservations → Availability.</p>
      </section>
      <section className="admin-card p-5 space-y-4">
        <h2 className="font-semibold">Booking confirmation email</h2>
        <p className="text-sm text-secondary">Published business branding and contact details appear in each message. Policies are displayed as written; refunds and charges remain handled by staff.</p>
        <label className="block text-sm">Cancellation and no-show policy<textarea className={input} maxLength={2000} value={draft.booking_email_policy ?? ''} onChange={event => update({booking_email_policy:event.target.value})} /></label>
        <label className="block text-sm">Additional note<textarea className={input} maxLength={2000} value={draft.booking_email_note ?? ''} onChange={event => update({booking_email_note:event.target.value})} /></label>
      </section>
      {seatingEnabled && <><section className="admin-card p-5 space-y-4">
        <h2 className="font-semibold">Seating areas</h2>
        {draft.seating_areas.map((area, index) => <label key={area.id} className="block text-sm">Area {index + 1}<input className={input} value={area.name} maxLength={60} onChange={(event) => update({ seating_areas: draft.seating_areas.map((a) => a.id === area.id ? { ...a, name: event.target.value } : a) })} required /></label>)}
        <Button type="button" onClick={() => update({ seating_areas: [...draft.seating_areas, { id: `area_${crypto.randomUUID().slice(0, 8)}`, name: 'New seating area' }] })}><Plus size={16} /> Add area</Button>
      </section>
      <section className="admin-card p-5 space-y-4">
        <h2 className="font-semibold">Tables</h2>
        <p className="text-sm text-secondary">Set actual capacities. Disable a resource to remove it from availability; existing IDs and POS mappings are retained. Each resource is reserved as a whole by the current booking engine.</p>
        {draft.tables.map((table, index) => <div key={table.id ?? index} className="grid sm:grid-cols-[1fr_90px_1fr_80px] gap-3 items-end border-b border-outline-variant/20 pb-3">
          <label className="text-xs">Name<input className={input} value={table.name} maxLength={60} onChange={(event) => update({ tables: draft.tables.map((t, i) => i === index ? { ...t, name: event.target.value } : t) })} required /></label>
          <label className="text-xs">Seats<input className={input} type="number" min={1} max={100} value={table.capacity} onChange={(event) => update({ tables: draft.tables.map((t, i) => i === index ? { ...t, capacity: Number(event.target.value) } : t) })} required /></label>
          <label className="text-xs">Area<select className={input} value={table.seating_type} onChange={(event) => update({ tables: draft.tables.map((t, i) => i === index ? { ...t, seating_type: event.target.value } : t) })}>{draft.seating_areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
          <label className="text-xs pb-2"><input type="checkbox" checked={table.is_active} onChange={(event) => update({ tables: draft.tables.map((t, i) => i === index ? { ...t, is_active: event.target.checked } : t) })} /> Active</label>
        </div>)}
        <Button type="button" disabled={!draft.seating_areas.length} onClick={() => update({ tables: [...draft.tables, { name: `Table ${draft.tables.length + 1}`, capacity: 2, seating_type: draft.seating_areas[0].id, is_active: true }] })}><Plus size={16} /> Add table</Button>
      </section></>}
      {save.error && <p role="alert" className="text-sm text-red-600">{save.error.message}</p>}
    </form>
  </div>;
}
