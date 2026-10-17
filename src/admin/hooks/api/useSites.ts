import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as siteService from '../../../services/sites';

/** Takes `organizationId` explicitly (not via `useRestaurant()`) so `RestaurantContext` can use this hook itself without a circular dependency. */
export function useSites(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['sites', organizationId],
    queryFn: () => siteService.getSites(organizationId as string),
    enabled: Boolean(organizationId),
  });
}

/** Super Admin only (Multi-Vertical Platform Plan §5.2) - powers the Platform → Sites console. */
export function useAllSitesForSuperAdmin() {
  return useQuery({
    queryKey: ['admin-superadmin-sites'],
    queryFn: () => siteService.getAllSitesForSuperAdmin(),
  });
}

export function useUpdateSiteBrandingBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, enabled }: { siteId: string; enabled: boolean }) =>
      siteService.updateSiteBrandingBadge(siteId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-superadmin-sites'] }),
  });
}

/** Owner only - adds an outlet; resolves once the Org's Site list has been refetched so the new outlet can be made active straight away. */
export function useCreateSite(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: siteService.CreateSiteInput) => siteService.createSite(organizationId, input),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['sites', organizationId] }),
  });
}

/** Owner only - rename, change the address of, suspend or reactivate an outlet. */
export function useUpdateSite(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, ...input }: { siteId: string } & Parameters<typeof siteService.updateSite>[2]) =>
      siteService.updateSite(organizationId, siteId, input),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['sites', organizationId] }),
  });
}
