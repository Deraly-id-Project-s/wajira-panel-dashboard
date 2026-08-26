import type { PaginatedResult, PaginationParams } from '@/types/pagination.types';
import type { OrderListVehicleType } from '@/types/order-list.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/master-data/vehicle-fleet';

export interface VehicleFleetLookup {
  id: number;
  uuid?: string;
  registrationNumber: string;
  type: OrderListVehicleType;
}

export interface VehicleFleetLookupParams extends PaginationParams {
  company_id: string | number;
  type: OrderListVehicleType;
  search?: string;
}

export const getVehicleFleetLookups = async (
  params: VehicleFleetLookupParams,
): Promise<PaginatedResult<VehicleFleetLookup>> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      search: params.search?.trim() || undefined,
      registration_number: params.search?.trim() || undefined,
      company_id: params.company_id,
      type: params.type,
    },
  });
  const payload = ensureSuccess(response.data);

  return toPaginatedResult(payload, (item: any) => ({
    id: Number(item?.id ?? 0),
    uuid: item?.uuid,
    registrationNumber: item?.registration_number ?? '-',
    type: item?.type as OrderListVehicleType,
  }));
};
