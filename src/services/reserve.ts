import { http } from './http';

export interface ReserveSettings {
  booking_email_policy?: string;
  booking_email_note?: string;
  vertical: string;
  booking_template_variant: 'a' | 'b' | 'c';
  google_place_id: string | null;
  location: { latitude: number; longitude: number; source: 'owner' | 'google' } | null;
  timezone: string | null;
  booking_duration_mins: number | null;
  slot_interval_mins: number | null;
  seating_areas: Array<{ id: string; name: string }>;
  tables: Array<{ id?: string; name: string; capacity: number; seating_type: string; is_active: boolean }>;
}

export const getReserveSettings = (id: string) => http.get<ReserveSettings>(`/restaurants/${encodeURIComponent(id)}/reserve-settings`);
export const saveReserveSettings = (id: string, settings: Partial<ReserveSettings>) => {
  const { vertical: _vertical, booking_template_variant: _variant, ...body } = settings;
  return http.put<ReserveSettings>(`/restaurants/${encodeURIComponent(id)}/reserve-settings`, body);
};
