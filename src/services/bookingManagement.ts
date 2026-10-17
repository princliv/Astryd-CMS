const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
export interface ManagedBooking {
  confirmation_code: string; status: string; business_id: string; guest_name: string;
  business: { reserve_map_url: string; mode: string; name: string; logo: string; vertical: string; noun: string; slug: string; website: string; address: string; phone: string; policy: string; timezone: string; date_display: string; time_display: string };
  booking: { date: string; time_slot: string; party_size: number; seating_preference: string };
  can_modify: boolean; can_cancel: boolean; paid: boolean;
  calendar_url: string; google_calendar_url: string;
  seating_options: Array<{id: string; label: string}>;
}
export async function managementRequest<T>(token: string, suffix = '', init: RequestInit = {}, params?: URLSearchParams): Promise<T> {
  const slug = decodeURIComponent(window.location.pathname.split('/')[2] ?? '');
  const query = params ?? new URLSearchParams(); query.set('slug', slug);
  const response = await fetch(`${base}/api/v1/reservation-management/${encodeURIComponent(token)}${suffix}?${query}`, { ...init, referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json', ...init.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Reservation link is unavailable.');
  return body as T;
}
