import { StockUnit, StockStatus, Status } from '@/types/stock-unit.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface StockUnitApiModel {
  id: number;
  unit_transaction_item_id?: number;
  unit_type?: {
    id: number;
    code: string;
    name: string;
    unit_type: string;
    unit_model: string;
  };
  color: string;
  machine_number: string;
  chassis_number: string;
  stock_state: string; // Keep stock_state for API request params
  status: string; // Use 'status' directly from API response
  stock_status?: string; // Field from BE
  stock_available: boolean;
  type_unit_name?: string;
  is_sold_unit?: boolean | number | string;
  is_forecast?: boolean | number | string;
  warehouse_sub_block?: {
    id: number;
    name: string;
  } | null;
}

const mapStockUnit = (payload: StockUnitApiModel): StockUnit => ({
  id: payload.id.toString(),
  namaUnit: payload.unit_type?.unit_model ?? payload.unit_type?.name ?? payload.unit_type?.unit_type ?? '-',
  warna: payload.color,
  noMesin: payload.machine_number,
  noRangka: payload.chassis_number,
  status: (payload.status) as Status,
  inStock: (payload.stock_available),
  stockStatus: (payload.stock_state) as StockStatus,
  warehouseSubBlock: payload.warehouse_sub_block,
  isForecast: payload?.is_forecast === true || payload?.is_forecast === 1 || payload?.is_forecast === '1',
  isSoldUnit: payload?.is_sold_unit === true || payload?.is_sold_unit === 1 || payload?.is_sold_unit === '1',
});

type PaginatedStockUnitResponse = LaravelApiResponse<{
  data: StockUnitApiModel[];
  current_page: number;
  perPage: number;
  total: number;
  last_page: number;
}>;

export const getStockUnits = async (
  companyId: number | string,
  params: PaginationParams & {
    stock_state?: string; // Corrected from 'status'
    machine_number?: string;
    chassis_number?: string;
    color?: string;
    search?: string; // Added search param for consistency
    in_stock?: boolean | string;
    is_forecast?: boolean | string;
    is_sold_unit?: boolean | string;
    specified?: string;
    activity_type?: string;
    unit_transaction_item_id?: number | string;
  },
) => {
  const queryParams: Record<string, unknown> = {
    ...buildLaravelPaginationQuery(params),
    page: params.page,
    per_page: params.perPage,
    search: params.search,
    stock_state: params.stock_state,
    machine_number: params.machine_number,
    chassis_number: params.chassis_number,
    color: params.color,
    specified: params.specified,
    activity_type: params.activity_type,
    unit_transaction_item_id: params.unit_transaction_item_id,
  };

  if (params.in_stock !== undefined) {
    queryParams.in_stock = params.in_stock;
  }
  if (params.is_forecast !== undefined) {
    queryParams.is_forecast = params.is_forecast;
  }
  if (params.is_sold_unit !== undefined) {
    queryParams.is_sold_unit = params.is_sold_unit;
  }

  const response = await apiClient.get<PaginatedStockUnitResponse>(
    `/wapi/warehouse/warehouse-get-unit-transaction-item-details/${companyId}`,
    { params: queryParams },
  );

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.perPage,
      total: data.total,
      last_page: data.last_page,
    },
    mapStockUnit,
  );
};
