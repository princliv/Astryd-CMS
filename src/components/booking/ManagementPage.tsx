import { useEffect, useState } from 'react';
import { managementRequest, type ManagedBooking } from '../../services/bookingManagement';
import './management.css';

export function ManagementPage() {
  const token = window.location.pathname.split('/')[4] ?? '';
  const [data, setData] = useState<ManagedBooking | null>(null);
  const [choices, setChoices] = useState<ManagedBooking['booking'] | null>(null);
  const [slots, setSlots] = useState<Array<{time: string; time_24: string; available: boolean}>>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(new URLSearchParams(window.location.search).get('action') === 'cancel');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const accept = (value: ManagedBooking) => { setData(value); setChoices(value.booking); };
  useEffect(() => {
    const meta = document.createElement('meta'); meta.name = 'referrer'; meta.content = 'no-referrer'; document.head.append(meta);
    let active = true;
    managementRequest<ManagedBooking>(token).then(value => { if (active) accept(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; meta.remove(); };
  }, [token]);
  const businessName = data?.business.name;
  useEffect(() => { document.title = businessName ? `${businessName} · Manage booking` : 'Manage booking · Astryd'; }, [businessName]);
  const chosenDate = choices?.date;
  const chosenParty = choices?.party_size;
  const chosenPreference = choices?.seating_preference;
  useEffect(() => {
    if (!editing || !chosenDate || !chosenParty || !chosenPreference) return;
    let active = true; setLoadingSlots(true); setSlots([]);
    managementRequest<{ slots: { afternoon: typeof slots; evening: typeof slots } }>(token, '/availability', {}, new URLSearchParams({date: chosenDate, party_size: String(chosenParty), seating_preference: chosenPreference}))
      .then(result => { if (active) { setSlots([...result.slots.afternoon, ...result.slots.evening]); setError(''); } })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [token, editing, chosenDate, chosenParty, chosenPreference]);
  async function change(cancel: boolean) {
    setBusy(true); setError('');
    try {
      const next = await managementRequest<ManagedBooking>(token, cancel ? '/cancel' : '', {method: cancel ? 'POST' : 'PATCH', body: JSON.stringify(cancel ? {} : choices)});
      accept(next); setEditing(false); setCancelling(false); setNotice(cancel ? 'Your booking has been cancelled.' : 'Your booking has been updated.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update booking.'); }
    finally { setBusy(false); }
  }
  if (!data) return <main className="booking-management"><p role={error ? 'alert' : 'status'}>{error || 'Loading your booking…'}</p></main>;
  const b = data.business;
  return <main className="booking-management">
    <header>{b.logo ? <img src={b.logo} alt={b.name} /> : <h1>{b.name}</h1>}<p>Manage your booking</p></header>
    <section aria-label="Reservation details"><p>{data.guest_name}</p><h2>{b.date_display}</h2><p className="booking-summary">{data.booking.party_size} {b.noun} · {b.time_display}</p><small>{b.timezone}</small><p>Status: <strong>{data.status}</strong></p><p>Confirmation: <strong>{data.confirmation_code}</strong></p></section>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    <nav aria-label="Booking actions">{data.can_modify && <button onClick={() => {setEditing(true); setCancelling(false);}} disabled={busy}>Modify booking</button>}{data.can_cancel && <button onClick={() => {setCancelling(true); setEditing(false);}} disabled={busy}>Cancel booking</button>}</nav>
    {editing && choices && <form onSubmit={e => {e.preventDefault(); void change(false);}}>
      <h3>Change your booking</h3>
      <div className="booking-fields"><label>Date<input type="date" value={choices.date} required onChange={e => setChoices({...choices, date:e.target.value, time_slot:''})} /></label>
      <label>{b.noun}<input type="number" disabled={b.mode === 'c'} min="1" max={data.paid ? data.booking.party_size : 20} value={choices.party_size} required onChange={e => setChoices({...choices, party_size:Number(e.target.value), time_slot:''})} /></label>
      {data.seating_options.length > 0 && <label>Seating preference<select value={choices.seating_preference} onChange={e => setChoices({...choices, seating_preference:e.target.value, time_slot:''})}>{data.seating_options.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>}</div>
      <p>Select an available time</p>{loadingSlots ? <p role="status">Loading times…</p> : <div className="booking-times">{slots.filter(s => s.available).map(s => <button type="button" key={s.time_24} aria-pressed={choices.time_slot === s.time_24} onClick={() => setChoices({...choices, time_slot:s.time_24})}>{s.time}</button>)}</div>}
      {data.paid && <p>Contact the business to increase a paid booking. Payment changes and refunds require staff assistance.</p>}
      <button className="booking-primary" disabled={busy || loadingSlots || !slots.some(s => s.available && s.time_24 === choices.time_slot)}>Save changes</button><button type="button" onClick={() => {setEditing(false);setChoices(data.booking);}}>Keep current booking</button>
    </form>}
    {cancelling && data.can_cancel && <section aria-label="Confirm cancellation"><h3>Cancel this booking?</h3><p>This releases your booked time. Any payment or refund questions must be handled by the business.</p><button className="booking-danger" disabled={busy} onClick={() => void change(true)}>Confirm cancellation</button><button disabled={busy} onClick={() => setCancelling(false)}>Keep booking</button></section>}
    {data.status !== 'cancelled' && <section><h3>Add to calendar</h3><nav><a href={data.calendar_url} referrerPolicy="no-referrer">Apple</a><a href={data.google_calendar_url} referrerPolicy="no-referrer" target="_blank" rel="noreferrer">Google</a><a href={data.calendar_url} referrerPolicy="no-referrer">Outlook</a></nav><p><small>Import the new event after changing your booking; existing calendar events do not update automatically.</small></p></section>}
    <section><h3>Contact</h3>{b.address && <p>{b.address}</p>}{b.phone && <p><a href={`tel:${b.phone}`}>{b.phone}</a></p>}<a href={b.reserve_map_url} referrerPolicy="no-referrer">View on Astryd Reserve map</a>{' · '}<a href={b.website} referrerPolicy="no-referrer">Visit business website</a></section>
    {b.policy && <section><h3>A note from us</h3><p className="booking-policy">{b.policy}</p></section>}
  </main>;
}
