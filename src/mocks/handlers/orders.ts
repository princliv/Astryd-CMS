import { http, HttpResponse } from 'msw';
import { db, nextId, nowIso } from '../db';
import { canAccessSite, orgOperationsScope, userFromAuthHeader } from './auth';
import type { OrderApiResponse } from '../../services/orders';
import type { Order, OrderLineItem, OrderStatus } from '../../types';

type MockOrder = (typeof db.data.orders)[number];

/** Seeded/legacy mock orders use `pending` for a placed, paid order - the backend's equivalent is `paid`. */
const effectiveStatus = (order: MockOrder): OrderStatus => (order.status === 'pending' ? 'paid' : order.status);

const cents = (amount: number | undefined) => Math.round((amount ?? 0) * 100);

/** The backend's `serialize_order` shape (snake_case, amounts in cents) built from a mock DB order. */
function toOrderApi(order: Order): OrderApiResponse {
  return {
    id: order.id,
    business_id: order.restaurantId,
    order_number: order.orderNumber,
    status: effectiveStatus(order),
    payment_status: order.paymentStatus ?? 'created',
    payment_id: order.paymentId,
    service_type: order.service,
    payment_method: order.paymentMethod as OrderApiResponse['payment_method'],
    customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone, address: order.address ?? '' },
    instructions: order.instructions ?? '',
    items: order.items.map((item) => ({
      item_id: item.itemId,
      name: item.name,
      quantity: item.quantity,
      unit_price_cents: cents(item.unitPrice),
      line_total_cents: cents(item.lineTotal),
      addons: item.addons.map((addon) => ({ id: addon.id, name: addon.name, price_cents: cents(addon.price) })),
      note: item.note ?? '',
    })),
    subtotal_cents: cents(order.subtotal),
    tax_cents: cents(order.taxes),
    delivery_fee_cents: cents(order.deliveryFee),
    total_cents: cents(order.total),
    created_at: order.placedAt ?? order.createdAt,
    updated_at: order.updatedAt,
    status_updated_at: order.statusUpdatedAt ?? order.updatedAt,
  };
}

const newestFirst = (a: MockOrder, b: MockOrder) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();

/** Kitchen board flow, mirroring the backend's ALLOWED_TRANSITIONS. */
const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ['confirmed'],
  confirmed: ['preparing'],
  preparing: ['ready'],
  ready: ['completed'],
};

function restaurantAccessDenied() {
  return HttpResponse.json({ error: 'forbidden', message: 'Restaurant access denied' }, { status: 403 });
}

export const orderHandlers = [
  // The paths the admin uses (the backend's `/orders` blueprint) - snake_case, amounts in cents.
  http.get('*/api/v1/orders/restaurant/:id', ({ params, request }) => {
    const siteId = params.id as string;
    if (!canAccessSite(userFromAuthHeader(request), siteId)) return restaurantAccessDenied();
    return HttpResponse.json(db.data.orders.filter((o) => o.restaurantId === siteId).sort(newestFirst).slice(0, 500).map(toOrderApi));
  }),

  http.patch('*/api/v1/orders/restaurant/:id/:orderId/status', async ({ params, request }) => {
    const siteId = params.id as string;
    if (!canAccessSite(userFromAuthHeader(request), siteId)) return restaurantAccessDenied();
    const order = db.data.orders.find((o) => o.id === params.orderId && o.restaurantId === siteId);
    if (!order) return HttpResponse.json({ error: 'not_found', message: 'Order not found' }, { status: 404 });
    const requested = ((await request.json().catch(() => null)) as { status?: OrderStatus } | null)?.status;
    const current = effectiveStatus(order);
    if (requested === 'cancelled' && order.paymentStatus === 'succeeded') {
      return HttpResponse.json({ error: 'refund_required', message: 'Paid orders cannot be cancelled until refunds are enabled' }, { status: 409 });
    }
    const allowed =
      requested === 'cancelled' && (current === 'payment_pending' || current === 'payment_failed')
        ? true
        : !!requested && (ALLOWED_TRANSITIONS[current] ?? []).includes(requested);
    if (!allowed || !requested) {
      return HttpResponse.json({ error: 'invalid_state', message: 'Order status transition is invalid' }, { status: 409 });
    }
    const now = nowIso();
    order.status = requested;
    order.statusUpdatedAt = now;
    order.updatedAt = now;
    db.save();
    return HttpResponse.json(toOrderApi(order));
  }),

  /** Every outlet of the Org the caller can access - the "All locations" view; `?siteId=` narrows it to one outlet. */
  http.get('*/api/v1/organizations/:orgId/orders', ({ params, request }) => {
    const scope = orgOperationsScope(request, params.orgId as string);
    if ('failure' in scope) return scope.failure;
    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') ?? 500) || 500));
    const status = url.searchParams.get('status');
    return HttpResponse.json(
      db.data.orders
        .filter((o) => scope.siteIds.includes(o.restaurantId) && (!status || effectiveStatus(o) === status))
        .sort(newestFirst)
        .slice(0, limit)
        .map((o) => ({ ...toOrderApi(o), site_id: o.restaurantId, site_name: scope.names.get(o.restaurantId) ?? '' })),
    );
  }),

  http.get('*/api/v1/restaurants/:id/orders', ({ params }) =>
    HttpResponse.json(
      db.data.orders
        .filter((o) => o.restaurantId === params.id)
        .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()),
    ),
  ),

  http.post('*/api/v1/restaurants/:id/orders', async ({ params, request }) => {
    const restaurantId = params.id as string;
    const body = (await request.json()) as Record<string, unknown>;
    const now = nowIso();
    const items = (body.items as OrderLineItem[]) ?? [];
    const order = {
      id: nextId('order'),
      restaurantId,
      orderNumber: String(1000 + db.data.orders.length + 1),
      status: 'pending' as const,
      service: (body.service as 'pickup' | 'delivery') ?? 'pickup',
      paymentMethod: (body.paymentMethod as 'apple' | 'google' | 'card' | 'cash') ?? 'card',
      customerName: (body.customerName as string) ?? 'Guest',
      customerPhone: (body.customerPhone as string) ?? '',
      customerEmail: (body.customerEmail as string) ?? '',
      address: body.address as string | undefined,
      instructions: body.instructions as string | undefined,
      items,
      subtotal: (body.subtotal as number) ?? 0,
      taxes: (body.taxes as number) ?? 0,
      deliveryFee: (body.deliveryFee as number) ?? 0,
      total: (body.total as number) ?? 0,
      placedAt: now,
      statusUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.data.orders.push(order);
    db.save();
    return HttpResponse.json(order, { status: 201 });
  }),

  http.patch('*/api/v1/restaurants/:id/orders/:orderId/status', async ({ params, request }) => {
    const body = (await request.json()) as { status?: string };
    const order = db.data.orders.find((o) => o.id === params.orderId);
    if (!order) return HttpResponse.json({ error: { code: 'not_found', message: 'Order not found.' } }, { status: 404 });
    if (body.status) {
      order.status = body.status as typeof order.status;
      order.statusUpdatedAt = nowIso();
      order.updatedAt = nowIso();
    }
    db.save();
    return HttpResponse.json(order);
  }),
];
