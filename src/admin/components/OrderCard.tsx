import { ArrowRight, Bike, Store, X } from 'lucide-react';
import { Button } from './Button';
import {
  NEXT_ACTION_LABEL,
  URGENCY_ACCENT,
  URGENCY_TEXT,
  getOrderUrgency,
  formatElapsed,
} from '../pages/orders/orderMeta';
import type { Order } from '../../types';

interface OrderCardProps {
  order: Order;
  now: number;
  isUpdating?: boolean;
  onOpen: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}

export function OrderCard({ order, now, isUpdating, onOpen, onAdvance, onCancel }: OrderCardProps) {
  const urgency = getOrderUrgency(order.statusUpdatedAt, now);
  const nextLabel = NEXT_ACTION_LABEL[order.status];
  const itemSummary = order.items.slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(', ');
  const extraCount = order.items.length - 2;

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface shadow-sm overflow-hidden">
      <div className={`h-1 ${URGENCY_ACCENT[urgency]}`} />
      <button onClick={onOpen} className="block w-full text-left p-4 hover:bg-surface-container-low/50 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="font-serif text-sm font-bold text-on-surface">#{order.orderNumber}</span>
          <span className={`text-xs ${URGENCY_TEXT[urgency]}`}>{formatElapsed(order.statusUpdatedAt, now)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-secondary">
          {order.service === 'delivery' ? <Bike className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
          <span className="capitalize">{order.service}</span>
          <span>·</span>
          <span className="truncate">{order.customerName}</span>
        </div>
        {order.siteName && <div className="mt-1 truncate text-xs font-semibold text-secondary">{order.siteName}</div>}
        <p className="text-sm text-on-surface mt-2 line-clamp-2">
          {itemSummary}
          {extraCount > 0 && <span className="text-secondary"> +{extraCount} more</span>}
        </p>
        <div className="text-sm font-bold text-on-surface mt-2">${order.total.toFixed(2)}</div>
      </button>

      <div className="flex items-center gap-2 px-4 pb-4">
        {nextLabel && (
          <Button variant="primary" size="sm" icon={ArrowRight} loading={isUpdating} onClick={onAdvance} className="flex-1">
            {nextLabel}
          </Button>
        )}
        {order.paymentStatus !== 'succeeded' && order.status !== 'completed' && order.status !== 'cancelled' && (
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-secondary hover:bg-error-container/40 hover:text-error transition-colors shrink-0"
            aria-label="Cancel order"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
