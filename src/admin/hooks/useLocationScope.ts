import { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';

const STORAGE_KEY = 'admin_all_locations';

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Whether an operational list (reservations, orders) shows every outlet or just the active one. Remembered across
 * those pages; only an Org with more than one active outlet gets the choice.
 */
export function useLocationScope() {
  const { sites } = useRestaurant();
  const [allLocations, setAllLocationsState] = useState(readStored);
  const available = sites.filter((s) => s.status !== 'suspended').length > 1;
  const setAllLocations = (value: boolean) => {
    setAllLocationsState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Storage may be unavailable (private mode); the choice then lasts for this page only.
    }
  };
  return { available, allLocations: available && allLocations, setAllLocations };
}
