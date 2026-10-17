import { ApiError } from './http';
import type { CheckoutSession } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

interface PaymentResponse {
  id: string;
  checkout_secret?: string;
  context_type: 'order' | 'reservation' | 'membership';
  context_id?: string;
  amount_cents: number;
  currency: string;
  status: CheckoutSession['status'];
  fulfillment_status: CheckoutSession['fulfillmentStatus'];
  failure?: { code?: string; message?: string };
  reservation?: {
    management_url?: string;
    calendar_url?: string;
    google_calendar_url?: string;
    email_status?: string;
    confirmation_code: string;
    date: string;
    time_slot: string;
    time_display: string;
    party_size: number;
    seating_preference: string;
    guest_name: string;
    guest_email: string;
  };
}

interface ErrorResponse {
  error?: string | { code?: string; message?: string };
  message?: string;
}

export async function paymentRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new Error('Unable to reach the payment service. Please check your connection and try again.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorResponse | null;
    const nested = typeof body?.error === 'object' ? body.error : undefined;
    throw new ApiError(
      response.status,
      typeof body?.error === 'string' ? body.error : nested?.code ?? 'unknown',
      body?.message ?? nested?.message ?? response.statusText,
    );
  }
  return response.json() as Promise<T>;
}

export function mapCheckoutSession(response: PaymentResponse, existingSecret = ''): CheckoutSession {
  return {
    id: response.id,
    checkoutSecret: response.checkout_secret ?? existingSecret,
    contextType: response.context_type,
    contextId: response.context_id,
    amountCents: response.amount_cents,
    currency: response.currency,
    status: response.status,
    fulfillmentStatus: response.fulfillment_status,
    failure: response.failure,
    reservation: response.reservation
      ? {
          confirmationCode: response.reservation.confirmation_code,
          managementUrl: response.reservation.management_url,
          calendarUrl: response.reservation.calendar_url,
          googleCalendarUrl: response.reservation.google_calendar_url,
          emailStatus: response.reservation.email_status,
          date: response.reservation.date,
          timeSlot: response.reservation.time_slot,
          timeDisplay: response.reservation.time_display,
          partySize: response.reservation.party_size,
          seatingPreference: response.reservation.seating_preference,
          guestName: response.reservation.guest_name,
          guestEmail: response.reservation.guest_email,
        }
      : undefined,
  };
}

export async function submitCard(session: CheckoutSession, token: string): Promise<CheckoutSession> {
  const response = await paymentRequest<PaymentResponse>('/payments/card', {
    method: 'POST',
    headers: { 'X-Checkout-Secret': session.checkoutSecret },
    body: JSON.stringify({ payment_id: session.id, token }),
  });
  const mapped = mapCheckoutSession(response, session.checkoutSecret);
  mapped.order = session.order;
  return mapped;
}

export async function getPayment(session: CheckoutSession): Promise<CheckoutSession> {
  const response = await paymentRequest<PaymentResponse>(`/payments/${encodeURIComponent(session.id)}`, {
    headers: { 'X-Checkout-Secret': session.checkoutSecret },
  });
  const mapped = mapCheckoutSession(response, session.checkoutSecret);
  mapped.order = session.order;
  return mapped;
}

export async function retryPayment(session: CheckoutSession): Promise<CheckoutSession> {
  const response = await paymentRequest<PaymentResponse>(`/payments/${encodeURIComponent(session.id)}/retry`, {
    method: 'POST',
    headers: { 'X-Checkout-Secret': session.checkoutSecret },
  });
  const mapped = mapCheckoutSession(response);
  mapped.order = session.order;
  return mapped;
}

export async function waitForPayment(session: CheckoutSession, attempts = 8): Promise<CheckoutSession> {
  let current = session;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (current.status !== 'pending' && current.status !== 'provider_unknown') return current;
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    current = await getPayment(current);
  }
  return current;
}
