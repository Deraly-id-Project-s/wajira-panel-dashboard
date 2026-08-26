import { useQuery } from '@tanstack/react-query';
import { companyQueryKeys } from '@/lib/query/company-key';
import { getVehicleFleetLookups, type VehicleFleetLookupParams } from '@/services/vehicle-fleet-lookup.service';

export function useVehicleFleetLookups(params: VehicleFleetLookupParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: companyQueryKeys.list(rest.company_id, 'order-list-vehicle-fleets', rest),
    queryFn: () => getVehicleFleetLookups(rest),
    enabled: enabled && Boolean(rest.company_id) && Boolean(rest.type),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}
