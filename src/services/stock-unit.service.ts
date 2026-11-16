import { StockUnit, StockStatus, Status, InitImportStockPayload, InitImportStockResponse } from '@/@types/stock-unit.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';
import { downloadFileFromResponse, extractBlobErrorMessage } from '@/utils/download';

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
  customer?: {
    id?: number | null;
    name?: string | null;
  } | null;
  supplier?: {
    id?: number | null;
    name?: string | null;
  } | null;
}

const mapStockUnit = (payload: StockUnitApiModel): StockUnit => ({
  id: payload.id.toString(),
  namaUnit: payload.unit_type?.name ?? payload.type_unit_name ?? payload.unit_type?.unit_model ?? payload.unit_type?.unit_type ?? '-',
  warna: payload.color,
  noMesin: payload.machine_number,
  noRangka: payload.chassis_number,
  status: (payload.status) as Status,
  inStock: (payload.stock_available),
  stockStatus: (payload.stock_state) as StockStatus,
  unitType: payload.unit_type ?? null,
  warehouseSubBlock: payload.warehouse_sub_block,
  customer: payload.customer ?? null,
  supplier: payload.supplier ?? null,
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
    search: params.search?.trim() ? params.search.trim() : undefined,
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

export interface ExportStockUnitParams {
  search?: string;
  in_stock?: boolean | string;
  is_sold_unit?: boolean | string;
  stock_state?: string;
  status?: string;
  color?: string;
  machine_number?: string;
  chassis_number?: string;
  unit_transaction_item_id?: number | string;
  unit_transaction_id?: number | string;
  specified?: string;
  activity_type?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

/**
 * Download file Excel data stok unit gudang berdasarkan filter aktif
 */
export const exportStockUnits = async (
  companyId: number | string,
  params: ExportStockUnitParams = {},
): Promise<void> => {
  const queryParams: Record<string, unknown> = {
    search: params.search?.trim() ? params.search.trim() : undefined,
    in_stock: params.in_stock,
    is_sold_unit: params.is_sold_unit,
    stock_state: params.stock_state,
    status: params.status,
    color: params.color,
    machine_number: params.machine_number,
    chassis_number: params.chassis_number,
    unit_transaction_item_id: params.unit_transaction_item_id,
    unit_transaction_id: params.unit_transaction_id,
    specified: params.specified,
    activity_type: params.activity_type,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  };

  // Bersihkan key bernilai undefined
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] === undefined) {
      delete queryParams[key];
    }
  });

  try {
    const response = await apiClient.get(
      `/wapi/warehouse/warehouse-get-unit-transaction-item-details/${companyId}/export`,
      {
        params: queryParams,
        responseType: 'blob',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
        },
      },
    );

    await downloadFileFromResponse(response, `data_stok_unit_${Date.now()}.xlsx`);
  } catch (error: any) {
    if (error instanceof ApiResponseError) {
      throw error;
    }
    const message = await extractBlobErrorMessage(error, 'Gagal mengekspor data stok unit');
    throw new ApiResponseError(message);
  }
};

/**
 * Inisialisasi import stok awal unit kendaraan tanpa transaksi sebelumnya (Fitur init-import)
 */
export const initImportStockUnits = async (
  payload: InitImportStockPayload,
  companyId?: number | string | null,
): Promise<InitImportStockResponse> => {
  const formData = new FormData();

  formData.append('unit_type_id', String(payload.unit_type_id));
  formData.append('qty_total', String(payload.qty_total));

  if (payload.price !== undefined && payload.price !== null) {
    formData.append('price', String(payload.price));
  }

  if (payload.file) {
    formData.append('file', payload.file);
  }

  if (
    payload.warehouse_sub_block_id !== undefined &&
    payload.warehouse_sub_block_id !== null &&
    String(payload.warehouse_sub_block_id).trim() !== ''
  ) {
    formData.append('warehouse_sub_block_id', String(payload.warehouse_sub_block_id));
  }

  if (typeof payload.in_stock === 'boolean') {
    formData.append('in_stock', payload.in_stock ? '1' : '0');
  }

  if (payload.status) {
    formData.append('status', payload.status);
  }

  if (payload.stock_state) {
    formData.append('stock_state', payload.stock_state);
  }

  try {
    const response = await apiClient.post<InitImportStockResponse>(
      '/wapi/unit-transaction/unit-transaction-item/init-import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(companyId ? { 'company-id': String(companyId) } : {}),
        },
      },
    );

    return response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      const resData = error.response.data;
      if (resData.message) {
        let msg = resData.message;
        if (resData.errors && typeof resData.errors === 'object') {
          const errList = Object.values(resData.errors).flat().filter(Boolean);
          if (errList.length > 0) {
            msg = `${msg}: ${errList.join(', ')}`;
          }
        }
        throw new ApiResponseError(msg, error?.response?.status, resData);
      }
    }
    throw error;
  }
};
