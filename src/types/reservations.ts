import type { Id, ISODateString, Tenant, Timestamps } from './common';
import type { WeekDay } from './restaurant';

export const RESERVATION_STATUSES = ['confirmed', 'seated', 'completed', 'cancelled', 'no_show'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface Reservation extends Tenant, Timestamps {
  id: Id;
  confirmationCode: string;
  status: ReservationStatus;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "18:30"
  partySize: number;
  seatingPreference: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  newsletterOptIn: boolean;
  placedAt: ISODateString;
  paymentId?: string;
  depositAmountCents?: number;
  currency?: string;
  /** Set on Org-wide ("All locations") lists; `restaurantId` is the outlet the booking belongs to. */
  siteName?: string;
}

export interface ReservationTimeSlot {
  time: string; // "18:30", 24h for stable sorting/editing
  isOpen: boolean;
}

export interface ReservationDayAvailability {
  day: WeekDay;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  slotDurationMins: number;
  maxPerSlot: number;
  slots: ReservationTimeSlot[];
}

export interface ReservationBlockedDate {
  date: string;
  reason: string;
}

export interface ReservationAvailabilitySettings extends Tenant {
  days: ReservationDayAvailability[];
  blockedDates: ReservationBlockedDate[];
}

/** Public booking form values. Kept separate from the admin reservation model. */
export interface PublicReservationInput {
  date: string;
  timeSlot: string;
  partySize: number;
  seatingPreference: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
  newsletterOptIn: boolean;
}

export interface PublicReservationConfirmation {
  managementUrl?: string;
  calendarUrl?: string;
  googleCalendarUrl?: string;
  emailStatus?: string;
  confirmationCode: string;
  date: string;
  timeSlot: string;
  timeDisplay: string;
  partySize: number;
  seatingPreference: string;
  guestName: string;
  guestEmail: string;
}

export interface PublicAvailabilitySlot {
  time: string;
  time24: string;
  available: boolean;
}

export interface PublicAvailability {
  timezone?: string;
  seatingOptions?: Array<{ id: string; label: string }>;
  available: boolean;
  date?: string;
  partySize?: number;
  reason?: string;
  slots: {
    afternoon: PublicAvailabilitySlot[];
    evening: PublicAvailabilitySlot[];
  };
}
