import type { Order } from './orders';

export type PaymentStatus = 'created' | 'submitting' | 'pending' | 'succeeded' | 'failed' | 'provider_unknown';
export type PaymentFulfillmentStatus = 'pending' | 'processing' | 'completed' | 'action_required';

export interface CheckoutSession {
  id: string;
  checkoutSecret: string;
  contextType: 'order' | 'reservation' | 'membership';
  contextId?: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  fulfillmentStatus: PaymentFulfillmentStatus;
  failure?: { code?: string; message?: string };
  order?: Order;
  reservation?: {
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
  };
}
