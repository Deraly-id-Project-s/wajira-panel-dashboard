import { apiClient } from '@/lib/api/client';
import { ensureSuccess, toPaginatedResult, type LaravelApiResponse } from '@/lib/api/response';
import type { VehicleEquipmentTransactionItem, VehicleEquipmentTransactionReportParams } from '@/types/vehicle-equipment-transaction-report.types';
import type { PaginatedResult } from '@/@types/pagination.types';

type ApiResponse = LaravelApiResponse<{
  data: VehicleEquipmentTransactionItem[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}>;

export const getVehicleEquipmentTransactionReport = async (
  params?: VehicleEquipmentTransactionReportParams,
): Promise<PaginatedResult<VehicleEquipmentTransactionItem>> => {
  const response = await apiClient.get<ApiResponse>(
    '/wapi/report/vehicle-equipment-transaction-report',
    {
      params: {
        page: params?.page ?? 1,
        per_page: params?.perPage ?? 25,
        search: params?.search?.trim() || undefined,
        start_date: params?.start_date || undefined,
        end_date: params?.end_date || undefined,
        type: params?.type || undefined,
        state: params?.state || undefined,
        warehouse_id: params?.warehouse_id || undefined,
        code: params?.code || undefined,
        vehicle_equipment_id: params?.vehicle_equipment_id || undefined,
      },
    },
  );

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page,
      total: data.total,
      last_page: data.last_page,
    },
    (item) => item,
  );
};
