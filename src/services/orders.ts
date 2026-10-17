import { http } from './http';
import { mapCheckoutSession, paymentRequest } from './payments';
import type { CheckoutSession, Order, OrderStatus } from '../types';

export interface OrderCheckoutInput {
  serviceType: 'pickup' | 'delivery';
  customer: { name: string; email: string; phone: string; address?: string };
  instructions?: string;
  items: Array<{ itemId: string; quantity: number; addonIds: string[]; note?: string }>;
}

export interface OrderApiResponse {
  id: string;
  business_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status?: string;
  payment_id?: string;
  service_type: 'pickup' | 'delivery';
  payment_method: 'card';
  customer: { name: string; email: string; phone: string; address?: string };
  instructions?: string;
  items: Array<{
    item_id: string;
    name: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    addons: Array<{ id: string; name: string; price_cents: number }>;
    note?: string;
  }>;
  subtotal_cents: number;
  tax_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  created_at: string;
  updated_at: string;
  status_updated_at: string;
  site_name?: string;
}

interface OrderCheckoutResponse {
  id: string;
  checkout_secret: string;
  context_type: 'order';
  context_id: string;
  amount_cents: number;
  currency: string;
  status: CheckoutSession['status'];
  fulfillment_status: CheckoutSession['fulfillmentStatus'];
  order: OrderApiResponse;
}

export function mapOrderResponse(order: OrderApiResponse): Order {
  return {
    id: order.id,
    restaurantId: order.business_id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentId: order.payment_id,
    service: order.service_type,
    paymentMethod: order.payment_method,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    customerEmail: order.customer.email,
    address: order.customer.address || undefined,
    instructions: order.instructions || undefined,
    items: order.items.map((item) => ({
      itemId: item.item_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price_cents / 100,
      lineTotal: item.line_total_cents / 100,
      addons: item.addons.map((addon) => ({ id: addon.id, name: addon.name, price: addon.price_cents / 100 })),
      note: item.note || undefined,
    })),
    subtotal: order.subtotal_cents / 100,
    taxes: order.tax_cents / 100,
    deliveryFee: order.delivery_fee_cents / 100,
    total: order.total_cents / 100,
    placedAt: order.created_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    statusUpdatedAt: order.status_updated_at,
    siteName: order.site_name,
  };
}

export async function getOrders(restaurantId: string): Promise<Order[]> {
  const response = await http.get<OrderApiResponse[]>(`/orders/restaurant/${restaurantId}`);
  return response.map(mapOrderResponse);
}

/** Every outlet of the Org the caller can access - the "All locations" view. */
export async function getOrgOrders(organizationId: string): Promise<Order[]> {
  const response = await http.get<OrderApiResponse[]>(`/organizations/${organizationId}/orders`);
  return response.map(mapOrderResponse);
}

export async function createOrderCheckout(restaurantId: string, input: OrderCheckoutInput): Promise<CheckoutSession> {
  const response = await paymentRequest<OrderCheckoutResponse>('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({
      business_id: restaurantId,
      service_type: input.serviceType,
      customer: input.customer,
      instructions: input.instructions,
      items: input.items.map((item) => ({
        item_id: item.itemId,
        quantity: item.quantity,
        addon_ids: item.addonIds,
        note: item.note,
      })),
    }),
  });
  const session = mapCheckoutSession(response);
  session.order = mapOrderResponse(response.order);
  return session;
}

export async function updateOrderStatus(restaurantId: string, orderId: string, status: OrderStatus): Promise<Order> {
  const response = await http.patch<OrderApiResponse>(`/orders/restaurant/${restaurantId}/${orderId}/status`, { status });
  return mapOrderResponse(response);
}
