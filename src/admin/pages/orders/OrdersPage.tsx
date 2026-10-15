import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Bike, Store, Phone, Mail, MapPin, StickyNote, History } from 'lucide-react';
import { useOrders, useUpdateOrderStatus } from '../../hooks/api/useOrders';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import { OrderCard } from '../../components/OrderCard';
import { OrderStatusStepper } from '../../components/OrderStatusStepper';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { OutletSelect } from '../../components/OutletSelect';
import { useLocationScope } from '../../hooks/useLocationScope';
import {
  BOARD_COLUMNS,
  NEXT_ACTION_LABEL,
  NEXT_STATUS,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  formatElapsed,
} from './orderMeta';
import type { Order } from '../../../types';

type Tab = 'active' | 'cancelled' | 'history';
type HistoryMode = 'all' | 'day' | 'month' | 'range';

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}
function toMonthInputValue(d: Date) {
  return d.toISOString().slice(0, 7);
}

export function OrdersPage() {
  const scope = useLocationScope();
  const { data: orders, isLoading } = useOrders(scope.allLocations);
  const updateStatus = useUpdateOrderStatus();

  const [tab, setTab] = useState<Tab>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [historyMode, setHistoryMode] = useState<HistoryMode>('all');
  const [historyDate, setHistoryDate] = useState(() => toDateInputValue(new Date()));
  const [historyMonth, setHistoryMonth] = useState(() => toMonthInputValue(new Date()));
  const [historyFrom, setHistoryFrom] = useState(() => toDateInputValue(new Date()));
  const [historyTo, setHistoryTo] = useState(() => toDateInputValue(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const cancelledOrders = useMemo(() => (orders ?? []).filter((o) => o.status === 'cancelled'), [orders]);
  const selectedOrder = orders?.find((o) => o.id === selectedId) ?? null;

  const historyOrders = useMemo(() => {
    const all = [...(orders ?? [])].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    if (historyMode === 'all') return all;
    if (historyMode === 'day') return all.filter((o) => o.placedAt.slice(0, 10) === historyDate);
    if (historyMode === 'month') return all.filter((o) => o.placedAt.slice(0, 7) === historyMonth);
    // range - inclusive of both endpoints, compared as calendar dates
    return all.filter((o) => {
      const d = o.placedAt.slice(0, 10);
      return (!historyFrom || d >= historyFrom) && (!historyTo || d <= historyTo);
    });
  }, [orders, historyMode, historyDate, historyMonth, historyFrom, historyTo]);

  const handleAdvance = (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (next) updateStatus.mutate({ orderId: order.id, status: next, siteId: order.restaurantId });
  };

  const handleConfirmCancel = () => {
    if (pendingCancel) updateStatus.mutate({ orderId: pendingCancel.id, status: 'cancelled', siteId: pendingCancel.restaurantId });
    setPendingCancel(null);
    setSelectedId(null);
  };

  const header = (
    <PageHeader
      icon={ShoppingBag}
      title="Orders"
      description="Track incoming orders from placement through to completion."
      actions={<OutletSelect allLocations={{ selected: scope.allLocations, onChange: scope.setAllLocations }} />}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <ListSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="flex gap-2">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            tab === 'active' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-secondary hover:border-primary/40'
          }`}
        >
          Active Board
        </button>
        <button
          onClick={() => setTab('cancelled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            tab === 'cancelled' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-secondary hover:border-primary/40'
          }`}
        >
          Cancelled {cancelledOrders.length > 0 && `(${cancelledOrders.length})`}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            tab === 'history' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-secondary hover:border-primary/40'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
      </div>

      {tab === 'active' ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map((status) => {
            const columnOrders = (orders ?? [])
              .filter((o) => o.status === status)
              .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());
            const color = ORDER_STATUS_COLOR[status];
            return (
              <div key={status} className="w-72 shrink-0 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">{ORDER_STATUS_LABEL[status]}</span>
                  <span className="text-xs text-secondary">({columnOrders.length})</span>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {columnOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant/30 py-8 text-center text-xs text-secondary">
                      No orders
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        now={now}
                        isUpdating={updateStatus.isPending && updateStatus.variables?.orderId === order.id}
                        onOpen={() => setSelectedId(order.id)}
                        onAdvance={() => handleAdvance(order)}
                        onCancel={() => setPendingCancel(order)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === 'cancelled' ? (
        cancelledOrders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No cancelled orders" description="Cancelled orders will show up here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                now={now}
                onOpen={() => setSelectedId(order.id)}
                onAdvance={() => {}}
                onCancel={() => {}}
              />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="admin-card p-4 flex flex-wrap items-end gap-4">
            <div className="flex gap-2">
              {(['all', 'day', 'month', 'range'] as HistoryMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setHistoryMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                    historyMode === mode ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-secondary hover:border-primary/40'
                  }`}
                >
                  {mode === 'all' ? 'All Time' : mode}
                </button>
              ))}
            </div>

            {historyMode === 'day' && (
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Date</label>
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
              </div>
            )}

            {historyMode === 'month' && (
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Month</label>
                <input
                  type="month"
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
              </div>
            )}

            {historyMode === 'range' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">From</label>
                  <input
                    type="date"
                    value={historyFrom}
                    max={historyTo}
                    onChange={(e) => setHistoryFrom(e.target.value)}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">To</label>
                  <input
                    type="date"
                    value={historyTo}
                    min={historyFrom}
                    onChange={(e) => setHistoryTo(e.target.value)}
                    className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </>
            )}

            <span className="text-xs text-secondary ml-auto">
              {historyOrders.length} order{historyOrders.length === 1 ? '' : 's'}
            </span>
          </div>

          <DataTable
            rows={historyOrders}
            rowKey={(o) => o.id}
            emptyMessage="No orders in this period."
            columns={[
              {
                header: 'Order',
                render: (o) => (
                  <button onClick={() => setSelectedId(o.id)} className="font-semibold text-on-surface hover:text-primary transition-colors">
                    #{o.orderNumber}
                  </button>
                ),
              },
              {
                header: 'Placed',
                render: (o) => <span className="text-secondary">{new Date(o.placedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>,
              },
              ...(scope.allLocations ? [{ header: 'Location', render: (o: Order) => <span className="text-secondary">{o.siteName}</span> }] : []),
              { header: 'Customer', render: (o) => o.customerName },
              { header: 'Service', render: (o) => <span className="capitalize text-secondary">{o.service}</span> },
              { header: 'Status', render: (o) => <OrderStatusBadge status={o.status} /> },
              { header: 'Total', className: 'text-right', render: (o) => <span className="font-semibold">${o.total.toFixed(2)}</span> },
            ]}
          />
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedId(null)}
        title={selectedOrder ? `Order #${selectedOrder.orderNumber}` : ''}
        description={selectedOrder ? `Placed ${formatElapsed(selectedOrder.placedAt, now)} ago` : undefined}
        maxWidth="max-w-lg"
        footer={
          selectedOrder && (
            <>
              {selectedOrder.paymentStatus !== 'succeeded' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <Button variant="outline" onClick={() => setPendingCancel(selectedOrder)}>
                  Cancel Order
                </Button>
              )}
              {NEXT_STATUS[selectedOrder.status] && (
                <Button variant="primary" loading={updateStatus.isPending} onClick={() => handleAdvance(selectedOrder)}>
                  {NEXT_ACTION_LABEL[selectedOrder.status]}
                </Button>
              )}
            </>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            <OrderStatusStepper status={selectedOrder.status} />

            <div className="flex items-center gap-4 text-sm text-secondary border-t border-outline-variant/10 pt-4">
              <span className="flex items-center gap-1.5">
                {selectedOrder.service === 'delivery' ? <Bike className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                <span className="capitalize">{selectedOrder.service}</span>
              </span>
              <span className="font-semibold text-on-surface">{selectedOrder.customerName}</span>
              {selectedOrder.siteName && <span className="ml-auto truncate">{selectedOrder.siteName}</span>}
            </div>

            <div className="space-y-1.5 text-sm text-secondary">
              {selectedOrder.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {selectedOrder.customerPhone}
                </div>
              )}
              {selectedOrder.customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {selectedOrder.customerEmail}
                </div>
              )}
              {selectedOrder.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {selectedOrder.address}
                </div>
              )}
              {selectedOrder.instructions && (
                <div className="flex items-start gap-2">
                  <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {selectedOrder.instructions}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10 overflow-hidden">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-on-surface">{item.quantity}× {item.name}</span>
                    <span className="text-on-surface">${item.lineTotal.toFixed(2)}</span>
                  </div>
                  {item.addons.length > 0 && (
                    <div className="text-xs text-secondary mt-1">+ {item.addons.map((a) => a.name).join(', ')}</div>
                  )}
                  {item.note && <div className="text-xs text-secondary mt-1 italic">"{item.note}"</div>}
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-sm border-t border-outline-variant/10 pt-4">
              <div className="flex justify-between text-secondary">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Taxes</span>
                <span>${selectedOrder.taxes.toFixed(2)}</span>
              </div>
              {selectedOrder.deliveryFee > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Delivery Fee</span>
                  <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-on-surface pt-1.5 border-t border-outline-variant/10">
                <span>Total</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingCancel)}
        title="Cancel order?"
        description={`Order #${pendingCancel?.orderNumber} will be marked as cancelled. This can't be undone.`}
        confirmLabel="Cancel Order"
        onCancel={() => setPendingCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
