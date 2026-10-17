import type { Id, ISODateString, Tenant, Timestamps } from './common';

export type OrderServiceType = 'pickup' | 'delivery';
export type OrderPaymentMethod = 'apple' | 'google' | 'card' | 'cash';

/** Lifecycle an order moves through. `cancelled` is a terminal state reachable from any active stage. */
export const ORDER_STATUSES = ['payment_pending', 'payment_failed', 'paid', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The subset of statuses shown as board columns - cancelled orders are filtered to their own view instead. */
export const ORDER_BOARD_COLUMNS = ['paid', 'confirmed', 'preparing', 'ready', 'completed'] as const;

export interface OrderItemAddon {
  id: Id;
  name: string;
  price: number;
}

export interface OrderLineItem {
  itemId: Id;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  addons: OrderItemAddon[];
  note?: string;
}

export interface Order extends Tenant, Timestamps {
  id: Id;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus?: string;
  paymentId?: string;
  service: OrderServiceType;
  paymentMethod: OrderPaymentMethod;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address?: string;
  instructions?: string;
  items: OrderLineItem[];
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  total: number;
  placedAt: ISODateString;
  statusUpdatedAt: ISODateString;
  /** Set on Org-wide ("All locations") lists; `restaurantId` is the outlet the order belongs to. */
  siteName?: string;
}
