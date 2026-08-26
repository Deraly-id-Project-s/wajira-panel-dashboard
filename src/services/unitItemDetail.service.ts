import { PaginationParams } from '@/types/pagination.types';
import {
  CreateUnitItemDetailPayload,
  UnitTransactionItemDetail,
  UnitTransactionItemDetailListResponse,
  UnitTransactionItemSummary,
  UpdateUnitItemDetailPayload,
} from '@/types/unit-transaction.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

type UnitTransactionItemApiModel = {
  id?: string | number;
  unit_transaction_id?: string | number;
  unit_type_id?: string | number;
  qty_total?: string | number;
  price?: string | number;
  bbn_price?: string | number;
  expedition_fee?: string | number;
  other_fee?: string | number;
  hpp_per_unit_price?: string | number;
  dpp_per_unit_price?: string | number;
  ppn_per_unit_price?: string | number;
  dpp_tax_id?: string | number;
  ppn_tax_id?: string | number;
  dpp_tax_rate?: string | number;
  ppn_tax_rate?: string | number;
  hpp_total_price?: string | number;
  dpp_total_price?: string | number;
  ppn_total_price?: string | number;
  unit_transaction?: {
    id?: string | number;
    code?: string;
  };
  dpp_tax?: {
    id?: string | number,
    tax_id?: string | number
    tax?: {
      id?: string | number,
      name?: string,
      code?: string,
    }
  };
  ppn_tax?: {
    id?: string | number,
    tax_id?: string | number
    tax?: {
      id?: string | number,
      name?: string,
      code?: string,
    }
  };
  unit_type?: {
    id?: string | number,
    name?: string,
    code?: string,
  };
};

type UnitTransactionItemDetailApiModel = {
  id?: string | number;
  unit_transaction_item_id?: string | number;
  color?: string;
  machine_number?: string;
  chassis_number?: string;
  in_stock?: boolean | number | string;
  is_forecast?: boolean;
  is_sold_unit?: boolean | number | string;
  status?: string;
  stock_state?: string | null;
  created_at?: string;
  unit_transaction_item?: {
    id?: string | number;
    unit_transaction_id?: string | number;
    unit_type_id?: string | number;
    price?: string | number;
    unit_type?: {
      id?: string | number;
      name?: string;
      code?: string;
    } | null;
    unit_transaction?: {
      id?: string | number;
      code?: string;
      stock_state?: string;
    } | null;
  } | null;
  warehouse_sub_block: {
    id?: string | number,
    name?: string
  } | null;
};

const itemBasePath = '/wapi/transaction/unit-transaction-item';
const itemLegacyBasePath = '/wapi/transaction/unit-transaction/unit-transaction-item';
const detailBasePath = '/wapi/transaction/unit-transaction/unit-transaction-item-detail';
const detailLegacyBasePath = '/wapi/transaction/unit-transaction/unit-transaction-item-detail';

const shouldFallback = (error: any): boolean => {
  const statusCode = error?.statusCode ?? error?.response?.status;
  return statusCode === 404 || statusCode === 405 || statusCode === 500;
};

const withPathFallback = async <T>(primary: () => Promise<T>, legacy: () => Promise<T>): Promise<T> => {
  try {
    return await primary();
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return legacy();
  }
};

const toNumber = (value: string | number | undefined): number => Number(value ?? 0);
const toIdString = (value: string | number | undefined): string => String(value ?? '');
const toBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }
  return false;
};
const mapUnitTransactionItem = (item: UnitTransactionItemApiModel): UnitTransactionItemSummary => ({
  id: String(item.id ?? ''),
  unit_transaction_id: String(item.unit_transaction_id ?? item.unit_transaction?.id ?? ''),
  unit_transaction_code: item.unit_transaction?.code,
  unit_type_id: item.unit_type_id !== undefined ? String(item.unit_type_id) : undefined,
  qty_total: toNumber(item.qty_total),
  price: toNumber(item.price),
  bbn_price: toNumber(item.bbn_price),
  expedition_fee: toNumber(item.expedition_fee),
  other_fee: toNumber(item.other_fee),
  hpp_per_unit_price: toNumber(item.hpp_per_unit_price),
  dpp_per_unit_price: toNumber(item.dpp_per_unit_price),
  ppn_per_unit_price: toNumber(item.ppn_per_unit_price),
  hpp_total_price: toNumber(item.hpp_total_price),
  dpp_total_price: toNumber(item.dpp_total_price),
  ppn_total_price: toNumber(item.ppn_total_price),
  dpp_tax_id: item.dpp_tax_id !== undefined ? String(item.dpp_tax_id) : undefined,
  ppn_tax_id: item.ppn_tax_id !== undefined ? String(item.ppn_tax_id) : undefined,
  dpp_tax_rate: toNumber(item.dpp_tax_rate),
  ppn_tax_rate: toNumber(item.ppn_tax_rate),
  dpp_tax: item.dpp_tax ? {
    id: item?.dpp_tax?.id,
    tax_id: item?.dpp_tax?.tax_id,
    tax: item?.dpp_tax?.tax ? {
      id: item?.dpp_tax?.tax?.id,
      name: item?.dpp_tax?.tax?.name,
      code: item?.dpp_tax?.tax?.code,
    } : null,
  } : null,
  ppn_tax: item.ppn_tax ? {
    id: item?.ppn_tax?.id,
    tax_id: item?.ppn_tax?.tax_id,
    tax: item?.ppn_tax?.tax ? {
      id: item?.ppn_tax?.tax?.id,
      name: item?.ppn_tax?.tax?.name,
      code: item?.ppn_tax?.tax?.code,
    } : null,
  } : null,
  unit_type: {
    id: item?.unit_type?.id,
    name: item?.unit_type?.name,
    code: item?.unit_type?.code,
  }
});

const mapItemDetail = (item: UnitTransactionItemDetailApiModel): UnitTransactionItemDetail => ({
  id: String(item.id ?? ''),
  unit_transaction_item_id: String(item.unit_transaction_item_id ?? ''),
  code: item.unit_transaction_item?.unit_transaction?.code ?? '',
  created_at: item.created_at ?? '',
  unit_type_name: item.unit_transaction_item?.unit_type?.name ?? undefined,
  price: item.unit_transaction_item?.price !== undefined ? toNumber(item.unit_transaction_item.price) : undefined,
  color: item.color ?? '-',
  machine_number: item.machine_number ?? '-',
  chassis_number: item.chassis_number ?? '-',
  in_stock: toBool(item.in_stock),
  is_forecast: toBool(item.is_forecast),
  is_sold_unit: toBool(item.is_sold_unit),
  status: item.status,
  person: { id: undefined, name: '-' },
  warehouse_sub_block: {
    id: item.warehouse_sub_block?.id !== undefined ? String(item.warehouse_sub_block.id) : undefined,
    name: item.warehouse_sub_block?.name ?? undefined,
  },
  unit_transaction_bruto_total: 0,
  unit_transaction_item_total_hpp: 0,
  unit_transaction_item_total_dpp: 0,
  unit_transaction_item_total_ppn: 0,
  unit_transaction_item_bruto_total: 0,
  transaction_bbn_total: 0,
  transaction_other_fee: 0,
  expedition_fee_total: 0,
  stock_state: item.stock_state ?? null,
});

export const unitItemDetailService = {
  /**
   * Fetch all unit item details for every unit_transaction_item belonging to
   * the given unit_transaction (purchase) id.
   *
   * Strategy: first get the list of unit_transaction_items for the transaction,
   * then fetch item-details for each item in parallel.
   */
  async getDetailsByTransactionId(unitTransactionId: string): Promise<UnitTransactionItemDetail[]> {
    // Step 1 – get items for this transaction
    const itemsResponse = await apiClient.get<LaravelApiResponse<any>>(
      '/wapi/transaction/unit-transaction/unit-transaction-item',
      { params: { unit_transaction_id: unitTransactionId, per_page: 200 } },
    );
    const itemsPayload = ensureSuccess(itemsResponse.data);
    const itemRows: Array<{ id?: string | number }> = Array.isArray(itemsPayload)
      ? itemsPayload
      : Array.isArray(itemsPayload?.data)
        ? itemsPayload.data
        : Array.isArray(itemsPayload?.data?.data)
          ? itemsPayload.data.data
          : [];

    if (itemRows.length === 0) return [];

    // Step 2 – fetch item-details for each item in parallel
    const detailGroups = await Promise.all(
      itemRows.map(async (row) => {
        const itemId = String(row.id ?? '');
        if (!itemId) return [] as UnitTransactionItemDetail[];
        try {
          const result = await unitItemDetailService.getDetails(itemId);
          return result.data;
        } catch {
          return [] as UnitTransactionItemDetail[];
        }
      }),
    );

    return detailGroups.flat();
  },
  async getUnitTransactionItemById(id: string): Promise<UnitTransactionItemSummary> {
    const response = await withPathFallback(
      () => apiClient.get<LaravelApiResponse<UnitTransactionItemApiModel>>(`${itemLegacyBasePath}/${id}`),
      () => apiClient.get<LaravelApiResponse<UnitTransactionItemApiModel>>(`${itemBasePath}/${id}`),
    );

    const payload = ensureSuccess(response.data);
    return mapUnitTransactionItem(payload);
  },

  async getDetails(unitTransactionItemId: string, params: PaginationParams = {}): Promise<UnitTransactionItemDetailListResponse> {
    const requestParams = {
      unit_transaction_item_id: unitTransactionItemId,
      page: params.page ?? 1,
      per_page: params.perPage ?? 9999,
    };

    const response = await withPathFallback(
      () =>
        apiClient.get<LaravelApiResponse<any>>(detailLegacyBasePath, {
          params: requestParams,
        }),
      () =>
        apiClient.get<LaravelApiResponse<any>>(detailBasePath, {
          params: requestParams,
        }),
    );

    const payload = ensureSuccess(response.data);

    if (Array.isArray(payload)) {
      return {
        data: payload.map((item: UnitTransactionItemDetailApiModel) => mapItemDetail(item)),
        meta: {
          currentPage: 1,
          perPage: payload.length || 1,
          total: payload.length,
          lastPage: 1,
        },
      };
    }

    if (Array.isArray(payload?.data)) {
      return toPaginatedResult(payload, mapItemDetail);
    }

    if (Array.isArray(payload?.data?.data)) {
      return toPaginatedResult(payload.data, mapItemDetail);
    }

    return {
      data: [],
      meta: {
        currentPage: 1,
        perPage: 25,
        total: 0,
        lastPage: 1,
      },
    };
  },

  async createDetail(payload: CreateUnitItemDetailPayload): Promise<UnitTransactionItemDetail> {
    const body = new URLSearchParams();
    body.append('unit_transaction_item_id', toIdString(payload.unit_transaction_item_id));
    body.append('color', payload.color);
    body.append('machine_number', payload.machine_number);
    body.append('chassis_number', payload.chassis_number);

    const response = await withPathFallback(
      () =>
        apiClient.post<LaravelApiResponse<UnitTransactionItemDetailApiModel>>(detailLegacyBasePath, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      () =>
        apiClient.post<LaravelApiResponse<UnitTransactionItemDetailApiModel>>(detailBasePath, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
    );

    const data = ensureSuccess(response.data);
    return mapItemDetail(data);
  },

  async updateDetail(id: string, payload: UpdateUnitItemDetailPayload): Promise<UnitTransactionItemDetail> {
    const body = new URLSearchParams();
    body.append('unit_transaction_item_id', toIdString(payload.unit_transaction_item_id));
    body.append('color', payload.color);
    body.append('machine_number', payload.machine_number);
    body.append('chassis_number', payload.chassis_number);

    const response = await withPathFallback(
      () =>
        apiClient.put<LaravelApiResponse<UnitTransactionItemDetailApiModel>>(`${detailLegacyBasePath}/${id}`, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      () =>
        apiClient.put<LaravelApiResponse<UnitTransactionItemDetailApiModel>>(`${detailBasePath}/${id}`, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
    );

    const data = ensureSuccess(response.data);
    return mapItemDetail(data);
  },

  async deleteDetail(id: string): Promise<void> {
    await withPathFallback(
      () => apiClient.delete<LaravelApiResponse<null>>(`${detailLegacyBasePath}/${id}`),
      () => apiClient.delete<LaravelApiResponse<null>>(`${detailBasePath}/${id}`),
    );
  },

  async bulkDeleteDetails(unitTransactionItemId: number | string, ids: Array<number | string>): Promise<void> {
    await apiClient.delete('/wapi/transaction/unit-transaction/unit-transaction-item-detail/bulk-delete', {
      data: {
        unit_transaction_item_id: Number(unitTransactionItemId),
        unit_transaction_item_details_ids: ids.map(id => Number(id)),
      }
    });
  },

  async bulkUpdateState(payload: {
    unit_transaction_item_details_ids: number[];
    stock_state: string;
    warehouse_sub_block_id?: number | null;
  }): Promise<void> {
    const response = await apiClient.put(
      '/wapi/transaction/unit-transaction/unit-transaction-item-detail/update-state',
      payload
    );
    ensureSuccess(response.data);
  },

  async importDetails(unitTransactionItemId: string, file: File): Promise<void> {
    const form = new FormData();
    form.append('file', file);

    const response = await withPathFallback(
      () => apiClient.post<LaravelApiResponse<any>>(`${detailLegacyBasePath}/${unitTransactionItemId}/import`, form),
      () => apiClient.post<LaravelApiResponse<any>>(`${detailBasePath}/${unitTransactionItemId}/import`, form),
    );
    ensureSuccess(response.data);
  },
};
