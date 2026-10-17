import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '../../../context/RestaurantContext';
import * as orderService from '../../../services/orders';
import type { OrderStatus } from '../../../types';

/** `allLocations` lists every outlet the user can access instead of just the active one. */
export function useOrders(allLocations = false) {
  const { restaurantId, organizationId } = useRestaurant();
  return useQuery({
    queryKey: allLocations ? ['admin-org-orders', organizationId] : ['admin-orders', restaurantId],
    queryFn: () => (allLocations ? orderService.getOrgOrders(organizationId) : orderService.getOrders(restaurantId)),
    refetchInterval: 15000,
  });
}

export function useUpdateOrderStatus() {
  const { restaurantId } = useRestaurant();
  const queryClient = useQueryClient();
  return useMutation({
    // `siteId` is the outlet the order belongs to - it differs from the active outlet in the "All locations" view.
    mutationFn: ({ orderId, status, siteId }: { orderId: string; status: OrderStatus; siteId?: string }) =>
      orderService.updateOrderStatus(siteId ?? restaurantId, orderId, status),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-org-orders'] }),
      ]),
  });
}
