import { useQuery } from '@tanstack/react-query';
import { useRestaurant } from '../../context/RestaurantContext';
import { getPublicLocations } from '../../services/sites';

/** The live outlets of this site's Organization (empty for a single-outlet business or an unpublished preview). */
export function usePublicLocations() {
  const { restaurantId } = useRestaurant();
  const query = useQuery({
    queryKey: ['public-locations', restaurantId],
    queryFn: () => getPublicLocations(restaurantId),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const locations = query.data ?? [];
  return { ...query, locations, hasSiblings: locations.length > 1 };
}
