import { ApiError, http } from './http';
import { fetchWithMockRecovery } from './mockRecovery';
import type {
  CheckoutSession,
  PublicAvailability,
  PublicReservationConfirmation,
  PublicReservationInput,
  Reservation,
  ReservationAvailabilitySettings,
  ReservationStatus,
} from '../types';
import { mapCheckoutSession, paymentRequest } from './payments';

const PUBLIC_API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

interface PublicApiErrorResponse {
  error?: string;
  message?: string;
}

interface PublicReservationResponse {
  success: boolean;
  management_url?: string;
  calendar_url?: string;
  google_calendar_url?: string;
  email_status?: string;
  confirmation_code: string;
  reservation: {
    date: string;
    time_slot: string;
    time_display: string;
    party_size: number;
    seating_preference: string;
    guest_name: string;
    guest_email: string;
  };
}

interface ReservationCheckoutResponse {
  id: string;
  checkout_secret: string;
  context_type: 'reservation';
  context_id?: string;
  amount_cents: number;
  currency: string;
  status: CheckoutSession['status'];
  fulfillment_status: CheckoutSession['fulfillmentStatus'];
}

interface PublicAvailabilityResponse {
  timezone?: string;
  seating_options?: Array<{ id: string; label: string }>;
  available: boolean;
  date?: string;
  party_size?: number;
  reason?: string;
  slots?: {
    afternoon?: Array<{ time: string; time_24: string; available: boolean }>;
    evening?: Array<{ time: string; time_24: string; available: boolean }>;
  };
}

async function requestPublicApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetchWithMockRecovery(`${PUBLIC_API_BASE_URL}/api/v1${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new Error('Unable to reach the reservation service. Please check your connection and try again.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as PublicApiErrorResponse | null;
    throw new ApiError(
      response.status,
      body?.error ?? 'unknown',
      body?.message ?? (response.status >= 500 ? 'The reservation service is temporarily unavailable. Please try again shortly.' : response.statusText),
    );
  }

  return response.json() as Promise<T>;
}

export async function getPublicAvailability(
  businessId: string,
  date: string,
  partySize: number,
  seatingPreference?: string,
): Promise<PublicAvailability> {
  const params = new URLSearchParams({ date, party_size: String(partySize) });
  if (seatingPreference) params.set('seating_preference', seatingPreference);
  const response = await requestPublicApi<PublicAvailabilityResponse>(
    `/availability/${encodeURIComponent(businessId)}?${params}`,
  );

  return {
    available: response.available,
    timezone: response.timezone,
    seatingOptions: response.seating_options,
    date: response.date,
    partySize: response.party_size,
    reason: response.reason,
    slots: {
      afternoon: (response.slots?.afternoon ?? []).map((slot) => ({
        time: slot.time,
        time24: slot.time_24,
        available: slot.available,
      })),
      evening: (response.slots?.evening ?? []).map((slot) => ({
        time: slot.time,
        time24: slot.time_24,
        available: slot.available,
      })),
    },
  };
}

export async function createPublicReservation(
  businessId: string,
  input: PublicReservationInput,
): Promise<PublicReservationConfirmation> {
  const response = await requestPublicApi<PublicReservationResponse>('/reservations', {
    method: 'POST',
    body: JSON.stringify({
      business_id: businessId,
      booking: {
        date: input.date,
        time_slot: input.timeSlot,
        party_size: input.partySize,
        seating_preference: input.seatingPreference,
      },
      guest: {
        full_name: input.guestName,
        email: input.guestEmail,
        phone: input.guestPhone,
        special_requests: input.specialRequests,
        newsletter_opt_in: input.newsletterOptIn,
      },
    }),
  });

  return {
    confirmationCode: response.confirmation_code,
    managementUrl: response.management_url,
    calendarUrl: response.calendar_url,
    googleCalendarUrl: response.google_calendar_url,
    emailStatus: response.email_status,
    date: response.reservation.date,
    timeSlot: response.reservation.time_slot,
    timeDisplay: response.reservation.time_display,
    partySize: response.reservation.party_size,
    seatingPreference: response.reservation.seating_preference,
    guestName: response.reservation.guest_name,
    guestEmail: response.reservation.guest_email,
  };
}

export async function createReservationCheckout(
  businessId: string,
  input: PublicReservationInput,
): Promise<CheckoutSession> {
  const response = await paymentRequest<ReservationCheckoutResponse>('/reservations/checkout', {
    method: 'POST',
    body: JSON.stringify({
      business_id: businessId,
      booking: {
        date: input.date,
        time_slot: input.timeSlot,
        party_size: input.partySize,
        seating_preference: input.seatingPreference,
      },
      guest: {
        full_name: input.guestName,
        email: input.guestEmail,
        phone: input.guestPhone,
        special_requests: input.specialRequests,
        newsletter_opt_in: input.newsletterOptIn,
      },
    }),
  });
  return mapCheckoutSession(response);
}

interface AdminReservationResponse {
  id?: string;
  businessId?: string;
  business_id?: string;
  confirmationCode?: string;
  confirmation_code?: string;
  status?: ReservationStatus;
  booking?: {
    date?: string;
    timeSlot?: string;
    time_slot?: string;
    timeDisplay?: string;
    time_display?: string;
    partySize?: number;
    party_size?: number;
    seatingPreference?: string;
    seating_preference?: string;
  };
  guest?: {
    fullName?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    specialRequests?: string;
    special_requests?: string;
    newsletterOptIn?: boolean;
    newsletter_opt_in?: boolean;
  };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  paymentId?: string;
  payment_id?: string;
  depositAmountCents?: number;
  deposit_amount_cents?: number;
  currency?: string;
  siteName?: string;
}

interface AdminReservationListResponse {
  reservations: AdminReservationResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AdminAvailabilityResponse {
  business_id: string;
  operating_hours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    slot_duration_mins: number;
    max_per_slot: number;
    is_closed: boolean;
    disabled_slots?: string[];
    slots?: Array<{ time: string; is_open: boolean }>;
  }>;
  blocked_dates: Array<{ date: string; reason?: string }>;
}

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function toTimeSlot(value: string | undefined): string {
  if (!value) return '';

  const twentyFourHour = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (twentyFourHour.test(value)) return value;

  const twelveHour = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i.exec(value.trim());
  if (!twelveHour) return '';

  const hour = Number(twelveHour[1]);
  const minute = twelveHour[2];
  const period = twelveHour[3].toUpperCase();
  if (hour < 1 || hour > 12) return '';

  const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${minute}`;
}

function mapAdminReservation(reservation: AdminReservationResponse): Reservation {
  const booking = reservation.booking ?? {};
  const guest = reservation.guest ?? {};
  const createdAt = reservation.createdAt ?? reservation.created_at ?? '';
  return {
    id: reservation.id ?? '',
    restaurantId: reservation.businessId ?? reservation.business_id ?? '',
    confirmationCode: reservation.confirmationCode ?? reservation.confirmation_code ?? '',
    status: reservation.status ?? 'confirmed',
    date: booking.date ?? '',
    timeSlot: toTimeSlot(booking.timeSlot ?? booking.time_slot ?? booking.timeDisplay ?? booking.time_display),
    partySize: booking.partySize ?? booking.party_size ?? 0,
    seatingPreference: booking.seatingPreference ?? booking.seating_preference ?? '',
    guestName: guest.fullName ?? guest.full_name ?? '',
    guestEmail: guest.email ?? '',
    guestPhone: guest.phone ?? '',
    specialRequests: guest.specialRequests ?? guest.special_requests,
    newsletterOptIn: guest.newsletterOptIn ?? guest.newsletter_opt_in ?? false,
    placedAt: createdAt,
    createdAt,
    updatedAt: reservation.updatedAt ?? reservation.updated_at ?? createdAt,
    paymentId: reservation.paymentId ?? reservation.payment_id,
    depositAmountCents: reservation.depositAmountCents ?? reservation.deposit_amount_cents,
    currency: reservation.currency,
    siteName: reservation.siteName,
  };
}

export async function getReservations(siteId?: string): Promise<Reservation[]> {
  const response = await http.get<AdminReservationListResponse>(`/admin/reservations?limit=100${siteId ? `&siteId=${encodeURIComponent(siteId)}` : ''}`);
  return response.reservations.map(mapAdminReservation);
}

/** Every outlet of the Org the caller can access - the "All locations" view. */
export async function getOrgReservations(organizationId: string): Promise<Reservation[]> {
  const response = await http.get<AdminReservationListResponse>(`/organizations/${organizationId}/reservations?limit=100`);
  return response.reservations.map(mapAdminReservation);
}

export const createReservation = (restaurantId: string, payload: Partial<Reservation>) =>
  http.post<Reservation>(`/restaurants/${restaurantId}/reservations`, payload);

export async function updateReservationStatus(reservationId: string, status: ReservationStatus, siteId?: string): Promise<Reservation> {
  const response = await http.patch<{ reservation: AdminReservationResponse }>(
    `/admin/reservations/${reservationId}/status${siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''}`,
    { status },
  );
  return mapAdminReservation(response.reservation);
}

function mapAvailabilitySettings(response: AdminAvailabilityResponse): ReservationAvailabilitySettings {
  return {
    restaurantId: response.business_id,
    days: response.operating_hours.map((hours) => ({
      day: WEEK_DAYS[hours.day_of_week],
      isClosed: hours.is_closed,
      openTime: hours.open_time,
      closeTime: hours.close_time,
      slotDurationMins: hours.slot_duration_mins,
      maxPerSlot: hours.max_per_slot,
      slots: (hours.slots ?? []).map((slot) => ({ time: slot.time, isOpen: slot.is_open })),
    })),
    blockedDates: (response.blocked_dates ?? []).map((blockedDate) => ({
      date: blockedDate.date,
      reason: blockedDate.reason ?? '',
    })),
  };
}

export async function getReservationAvailability(siteId?: string): Promise<ReservationAvailabilitySettings> {
  const response = await http.get<AdminAvailabilityResponse>(`/admin/reservation-availability${siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''}`);
  return mapAvailabilitySettings(response);
}

export async function updateReservationAvailability(
  settings: Pick<ReservationAvailabilitySettings, 'days' | 'blockedDates'>,
  siteId?: string,
): Promise<ReservationAvailabilitySettings> {
  const response = await http.put<AdminAvailabilityResponse>(`/admin/reservation-availability${siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''}`, {
    operating_hours: settings.days.map((day) => ({
      day_of_week: WEEK_DAYS.indexOf(day.day),
      open_time: day.openTime,
      close_time: day.closeTime,
      slot_duration_mins: day.slotDurationMins,
      max_per_slot: day.maxPerSlot,
      is_closed: day.isClosed,
      disabled_slots: day.slots.filter((slot) => !slot.isOpen).map((slot) => slot.time),
    })),
    blocked_dates: settings.blockedDates.map((blockedDate) => ({
      date: blockedDate.date,
      reason: blockedDate.reason,
    })),
  });
  return mapAvailabilitySettings(response);
}
