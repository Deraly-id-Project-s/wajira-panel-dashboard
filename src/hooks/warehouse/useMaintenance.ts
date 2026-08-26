import { useQuery } from '@tanstack/react-query';
import type { MaintenanceListParams } from '@/types/maintenance.types';
import { getMaintenanceList } from '@/services/warehouse/maintenance.service';

export const warehouseMaintenanceKeys = {
  all: ['warehouse-maintenance'] as const,
  list: (params: MaintenanceListParams) => [
    ...warehouseMaintenanceKeys.all,
    params.company_id,
    params.search ?? '',
    params.code ?? '',
    params.registration_number ?? '',
    params.driver_name ?? '',
    params.page ?? 1,
    params.per_page ?? 10,
  ] as const,
};

export function useMaintenance(params: MaintenanceListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: warehouseMaintenanceKeys.list(params),
    queryFn: () => getMaintenanceList(params),
    enabled: options?.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}
