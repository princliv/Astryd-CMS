import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '../../../context/RestaurantContext';
import * as reservationService from '../../../services/reservations';
import type { ReservationAvailabilitySettings, ReservationStatus } from '../../../types';

/** `allLocations` lists every outlet the user can access instead of just the active one. */
export function useReservations(allLocations = false) {
  const { restaurantId, organizationId } = useRestaurant();
  return useQuery({
    queryKey: allLocations ? ['admin-org-reservations', organizationId] : ['admin-reservations', restaurantId],
    queryFn: () =>
      allLocations ? reservationService.getOrgReservations(organizationId) : reservationService.getReservations(restaurantId),
    refetchInterval: 15000,
  });
}

export function useUpdateReservationStatus() {
  const { restaurantId } = useRestaurant();
  const queryClient = useQueryClient();
  return useMutation({
    // `siteId` is the outlet the booking belongs to - it differs from the active outlet in the "All locations" view.
    mutationFn: ({ reservationId, status, siteId }: { reservationId: string; status: ReservationStatus; siteId?: string }) =>
      reservationService.updateReservationStatus(reservationId, status, siteId ?? restaurantId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-reservations'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-org-reservations'] }),
      ]),
  });
}

export function useReservationAvailability() {
  const { restaurantId } = useRestaurant();
  return useQuery({
    queryKey: ['admin-reservation-availability', restaurantId],
    queryFn: () => reservationService.getReservationAvailability(restaurantId),
  });
}

export function useUpdateReservationAvailability() {
  const { restaurantId } = useRestaurant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Pick<ReservationAvailabilitySettings, 'days' | 'blockedDates'>) =>
      reservationService.updateReservationAvailability(settings, restaurantId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-reservation-availability', restaurantId] }),
  });
}
