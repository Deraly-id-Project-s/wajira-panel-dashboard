import { StockSparepart } from '@/@types/stock-sparepart.types';
import type { Status, StockStatus } from '@/@types/stock-unit.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface StockSparepartApiModel {
  id: number;
  sparepart_id?: number;
  sparepart?: {
    id: number;
    code: string;
    name: string;
    unit_type?: string;
    price?: number | string;
  };
  code?: string;
  name?: string;
  price?: number | string;
  qty?: number | string;
  stock_available?: number | string | boolean;
  stock_state?: string;
  activity_type?: string;
  status?: string;
  warehouse_sub_block?: {
    id: number;
    name: string;
  } | null;
}

const mapStockSparepart = (payload: StockSparepartApiModel): StockSparepart => ({
  id: payload.id.toString(),
  sparepartId: payload.sparepart?.id ?? payload.sparepart_id ?? 0,
  sparepartCode: payload.sparepart?.code ?? payload.code ?? '-',
  sparepartName: payload.sparepart?.name ?? payload.name ?? '-',
  price: Number(payload.sparepart?.price ?? payload.price ?? 0),
  qty: Number(payload.qty ?? payload.stock_available ?? 0),
  status: (payload.status ?? 'normal') as Status,
  stockStatus: (payload.stock_state ?? 'draft') as StockStatus,
  warehouseSubBlock: payload.warehouse_sub_block,
  inStock: payload.stock_available === true || Number(payload.qty ?? payload.stock_available ?? 0) > 0,
});

type PaginatedStockSparepartResponse = LaravelApiResponse<{
  data: StockSparepartApiModel[];
  current_page: number;
  perPage: number;
  total: number;
  last_page: number;
}>;

export const getStockSpareparts = async (
  companyId: number | string,
  params: PaginationParams & {
    stock_state?: string;
    activity_type?: string;
    in_stock?: boolean | string;
    specified?: string;
    search?: string;
  },
) => {
  const queryParams: Record<string, unknown> = {
    ...buildLaravelPaginationQuery(params),
    page: params.page,
    per_page: params.perPage,
    search: params.search,
    stock_state: params.stock_state,
    activity_type: params.activity_type,
    specified: params.specified,
  };

  if (params.in_stock !== undefined) {
    queryParams.in_stock = params.in_stock;
  }

  const response = await apiClient.get<PaginatedStockSparepartResponse>(
    `/wapi/warehouse/warehouse-get-sparepart/${companyId}`,
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
    mapStockSparepart,
  );
};
