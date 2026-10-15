import { http, HttpResponse } from 'msw';
import { db, nextId, nowIso } from '../db';
import { canAccessSite, orgOperationsScope, userFromAuthHeader } from './auth';
import type { ReservationAvailabilitySettings, ReservationDayAvailability } from '../../types';

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

interface MockAvailabilityPayload {
  operating_hours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    slot_duration_mins: number;
    max_per_slot: number;
    is_closed: boolean;
    disabled_slots: string[];
  }>;
  blocked_dates: Array<{ date: string; reason?: string }>;
}

function availabilityResponse(settings: ReservationAvailabilitySettings) {
  return {
    business_id: settings.restaurantId,
    operating_hours: settings.days.map((day) => ({
      day_of_week: WEEK_DAYS.indexOf(day.day),
      open_time: day.openTime,
      close_time: day.closeTime,
      slot_duration_mins: day.slotDurationMins,
      max_per_slot: day.maxPerSlot,
      is_closed: day.isClosed,
      disabled_slots: day.slots.filter((slot) => !slot.isOpen).map((slot) => slot.time),
      slots: day.slots.map((slot) => ({ time: slot.time, is_open: slot.isOpen })),
    })),
    blocked_dates: settings.blockedDates.map((entry) => ({ date: entry.date, reason: entry.reason })),
  };
}

function nextConfirmationCode() {
  return `LUM-${Math.floor(10000 + Math.random() * 89999)}`;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};
const toHHMM = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const toDisplay = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/**
 * The admin reservation endpoints take an optional `?siteId=` (the outlet picked in the admin's site switcher),
 * honoured when the caller may access that Site; without it they fall back to the signed-in user's own Site
 * instead of whichever Site happens to be first in the DB. `null` means the requested Site is off-limits (403).
 */
function siteForCaller(request: Request): string | null {
  const caller = userFromAuthHeader(request);
  const requested = new URL(request.url).searchParams.get('siteId');
  if (requested) return canAccessSite(caller, requested) ? requested : null;
  return caller?.restaurantId ?? Object.keys(db.data.reservationAvailability)[0];
}

function siteAccessDenied() {
  return HttpResponse.json({ error: 'forbidden', message: 'Restaurant access denied' }, { status: 403 });
}

function toAdminReservation(r: (typeof db.data.reservations)[number]) {
  return {
    id: r.id,
    business_id: r.restaurantId,
    confirmation_code: r.confirmationCode,
    status: r.status,
    booking: { date: r.date, time_slot: r.timeSlot, party_size: r.partySize, seating_preference: r.seatingPreference },
    guest: { full_name: r.guestName, email: r.guestEmail, phone: r.guestPhone, special_requests: r.specialRequests, newsletter_opt_in: r.newsletterOptIn },
    created_at: r.placedAt,
    updated_at: r.updatedAt,
    payment_id: r.paymentId,
    deposit_amount_cents: r.depositAmountCents,
    currency: r.currency,
  };
}

/** A day's bookable times: its explicit slots, or - for Sites that only set opening hours - one per slot duration. */
function slotTimesFor(day: ReservationDayAvailability): string[] {
  if (day.slots.length) return day.slots.filter((s) => s.isOpen).map((s) => s.time);
  const times: string[] = [];
  const step = Math.max(15, day.slotDurationMins || 60);
  for (let t = toMinutes(day.openTime); t + step <= toMinutes(day.closeTime); t += step) times.push(toHHMM(t));
  return times;
}

export const reservationHandlers = [
  // Public booking API (the storefront's Reservations / Classes / Appointments pages). Per Site - the
  // `businessId` is the Site id - using that Site's own opening hours and per-slot capacity.
  http.get('*/api/v1/availability/:businessId', ({ params, request }) => {
    const siteId = params.businessId as string;
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? '';
    const partySize = Number(url.searchParams.get('party_size') ?? 1);
    const settings = db.data.reservationAvailability[siteId];
    if (!settings || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return HttpResponse.json({ available: false, date, party_size: partySize, reason: 'Online booking is not set up yet.', slots: { afternoon: [], evening: [] } });
    }
    const blocked = settings.blockedDates.find((b) => b.date === date);
    const weekday = WEEK_DAYS[(new Date(`${date}T12:00:00`).getDay() + 6) % 7];
    const day = settings.days.find((d) => d.day === weekday);
    if (blocked || !day || day.isClosed) {
      return HttpResponse.json({ available: false, date, party_size: partySize, reason: blocked?.reason || 'Closed on this day.', slots: { afternoon: [], evening: [] } });
    }
    const now = new Date();
    const isToday = date === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const taken = db.data.reservations.filter((r) => r.restaurantId === siteId && r.date === date && r.status !== 'cancelled');
    const slots = slotTimesFor(day).map((time) => ({
      time: toDisplay(time),
      time_24: time,
      available: !(isToday && toMinutes(time) <= nowMins) && taken.filter((r) => r.timeSlot === time).length < Math.max(1, day.maxPerSlot),
    }));
    return HttpResponse.json({
      available: slots.some((s) => s.available),
      date,
      party_size: partySize,
      slots: { afternoon: slots.filter((s) => toMinutes(s.time_24) < 17 * 60), evening: slots.filter((s) => toMinutes(s.time_24) >= 17 * 60) },
    });
  }),

  http.post('*/api/v1/reservations', async ({ request }) => {
    const body = (await request.json()) as {
      business_id: string;
      booking: { date: string; time_slot: string; party_size: number; seating_preference?: string };
      guest: { full_name: string; email: string; phone?: string; special_requests?: string; newsletter_opt_in?: boolean };
    };
    if (!db.data.restaurants.some((r) => r.id === body.business_id)) {
      return HttpResponse.json({ error: 'not_found', message: 'Unknown business.' }, { status: 404 });
    }
    const now = nowIso();
    const reservation = {
      id: nextId('reservation'),
      restaurantId: body.business_id,
      confirmationCode: nextConfirmationCode(),
      status: 'confirmed' as const,
      date: body.booking.date,
      timeSlot: body.booking.time_slot,
      partySize: body.booking.party_size,
      seatingPreference: body.booking.seating_preference ?? '',
      guestName: body.guest.full_name,
      guestEmail: body.guest.email,
      guestPhone: body.guest.phone ?? '',
      specialRequests: body.guest.special_requests,
      newsletterOptIn: Boolean(body.guest.newsletter_opt_in),
      placedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.data.reservations.push(reservation);
    db.save();
    return HttpResponse.json({
      success: true,
      confirmation_code: reservation.confirmationCode,
      reservation: {
        date: reservation.date,
        time_slot: reservation.timeSlot,
        time_display: /^\d{2}:\d{2}$/.test(reservation.timeSlot) ? toDisplay(reservation.timeSlot) : reservation.timeSlot,
        party_size: reservation.partySize,
        seating_preference: reservation.seatingPreference,
        guest_name: reservation.guestName,
        guest_email: reservation.guestEmail,
      },
    }, { status: 201 });
  }),

  http.get('*/api/v1/restaurants/:id/reservations', ({ params }) =>
    HttpResponse.json(
      db.data.reservations
        .filter((r) => r.restaurantId === params.id)
        .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()),
    ),
  ),

  http.post('*/api/v1/restaurants/:id/reservations', async ({ params, request }) => {
    const restaurantId = params.id as string;
    const body = (await request.json()) as Record<string, unknown>;
    const now = nowIso();
    const reservation = {
      id: nextId('reservation'),
      restaurantId,
      confirmationCode: nextConfirmationCode(),
      status: 'confirmed' as const,
      date: (body.date as string) ?? '',
      timeSlot: (body.timeSlot as string) ?? '',
      partySize: (body.partySize as number) ?? 1,
      seatingPreference: (body.seatingPreference as string) ?? 'Indoor',
      guestName: (body.guestName as string) ?? 'Guest',
      guestEmail: (body.guestEmail as string) ?? '',
      guestPhone: (body.guestPhone as string) ?? '',
      specialRequests: body.specialRequests as string | undefined,
      newsletterOptIn: (body.newsletterOptIn as boolean) ?? false,
      placedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.data.reservations.push(reservation);
    db.save();
    return HttpResponse.json(reservation, { status: 201 });
  }),

  http.patch('*/api/v1/restaurants/:id/reservations/:reservationId/status', async ({ params, request }) => {
    const body = (await request.json()) as { status?: string };
    const reservation = db.data.reservations.find((r) => r.id === params.reservationId);
    if (!reservation) {
      return HttpResponse.json({ error: { code: 'not_found', message: 'Reservation not found.' } }, { status: 404 });
    }
    if (body.status) {
      reservation.status = body.status as typeof reservation.status;
      reservation.updatedAt = nowIso();
    }
    db.save();
    return HttpResponse.json(reservation);
  }),


  http.get('*/api/v1/admin/reservations', ({ request }) => {
    const siteId = siteForCaller(request);
    if (!siteId) return siteAccessDenied();
    const limit = Number(new URL(request.url).searchParams.get('limit') ?? 100);
    const rows = db.data.reservations
      .filter((r) => r.restaurantId === siteId)
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    return HttpResponse.json({ reservations: rows.slice(0, limit).map(toAdminReservation), total: rows.length, page: 1, limit, pages: Math.max(1, Math.ceil(rows.length / limit)) });
  }),

  /** Every outlet of the Org the caller can access - the "All locations" view; `?siteId=` narrows it to one outlet. */
  http.get('*/api/v1/organizations/:orgId/reservations', ({ params, request }) => {
    const scope = orgOperationsScope(request, params.orgId as string);
    if ('failure' in scope) return scope.failure;
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20));
    const date = url.searchParams.get('date');
    const status = url.searchParams.get('status');
    const rows = db.data.reservations
      .filter((r) => scope.siteIds.includes(r.restaurantId))
      .filter((r) => (!date || r.date === date) && (!status || r.status === status))
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    return HttpResponse.json({
      reservations: rows
        .slice((page - 1) * limit, page * limit)
        .map((r) => ({ ...toAdminReservation(r), siteId: r.restaurantId, siteName: scope.names.get(r.restaurantId) ?? '' })),
      total: rows.length,
      page,
      limit,
      pages: Math.ceil(rows.length / limit),
    });
  }),

  http.patch('*/api/v1/admin/reservations/:id/status', async ({ params, request }) => {
    const siteId = siteForCaller(request);
    if (!siteId) return siteAccessDenied();
    const { status } = (await request.json()) as { status: (typeof db.data.reservations)[number]['status'] };
    const reservation = db.data.reservations.find((r) => r.id === params.id && r.restaurantId === siteId);
    if (!reservation) return HttpResponse.json({ error: 'not_found', message: 'Reservation not found.' }, { status: 404 });
    reservation.status = status;
    reservation.updatedAt = nowIso();
    db.save();
    return HttpResponse.json({ reservation: toAdminReservation(reservation) });
  }),

  http.get('*/api/v1/admin/reservation-availability', ({ request }) => {
    const restaurantId = siteForCaller(request);
    if (!restaurantId) return siteAccessDenied();
    const settings = db.data.reservationAvailability[restaurantId];
    if (!settings) {
      return HttpResponse.json({ error: { code: 'not_found', message: 'Availability settings not found.' } }, { status: 404 });
    }
    return HttpResponse.json(availabilityResponse(settings));
  }),

  http.put('*/api/v1/admin/reservation-availability', async ({ request }) => {
    const restaurantId = siteForCaller(request);
    if (!restaurantId) return siteAccessDenied();
    const body = (await request.json()) as MockAvailabilityPayload;
    const settings: ReservationAvailabilitySettings = {
      restaurantId,
      days: body.operating_hours.map((hours): ReservationDayAvailability => ({
        day: WEEK_DAYS[hours.day_of_week],
        isClosed: hours.is_closed,
        openTime: hours.open_time,
        closeTime: hours.close_time,
        slotDurationMins: hours.slot_duration_mins,
        maxPerSlot: hours.max_per_slot,
        slots: db.data.reservationAvailability[restaurantId]?.days[hours.day_of_week]?.slots.map((slot) => ({
          ...slot,
          isOpen: !hours.disabled_slots.includes(slot.time),
        })) ?? [],
      })),
      blockedDates: body.blocked_dates.map((entry) => ({ date: entry.date, reason: entry.reason ?? '' })),
    };
    db.data.reservationAvailability[restaurantId] = settings;
    db.save();
    return HttpResponse.json(availabilityResponse(settings));
  }),
];
