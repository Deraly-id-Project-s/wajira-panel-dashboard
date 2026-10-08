import { LaravelPagination } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';
import { SalesApiModel, mapSalesDetailToUI, mapSalesToTableItem, mapSalesToUI } from '@/services/sales.mapper';
import { unitTransactionService } from '@/services/unitTransaction.service';
import { UnitTransactionDetail } from '@/@types/unit-transaction.types';

const basePath = '/wapi/transaction/unit-transaction/unit-transaction';
const fallbackBasePath = '/wapi/transaction/unit-transaction';

export type SalesPayload = {
  company_id: number;
  person_id: number;
  code: string;
  type: 'sales';
  max_capacity: number;
  stock_state: string;
  warehouse_id?: number;
  unit_type_id?: number;
  sparepart_id?: number;
  qty_total?: number;
  price?: number;
  bbn_price?: number;
  expedition_fee?: number;
  other_fee?: number;
  price_discount?: number;
  price_usd_discount?: number;
  transaction_date?: string;
  price_usd?: number;
  price_per_unit_usd?: number;
  document_template_id?: number | string | null;
};

const appendIfDefined = (form: FormData, key: string, value: string | number | undefined) => {
  if (value !== undefined && value !== null && value !== '') {
    form.append(key, String(value));
  }
};

const appendPayload = (form: FormData, payload: SalesPayload) => {
  form.append('company_id', String(payload.company_id));
  form.append('person_id', String(payload.person_id));
  appendIfDefined(form, 'warehouse_id', payload.warehouse_id);
  form.append('code', payload.code);
  form.append('type', payload.type);
  form.append('max_capacity', String(payload.max_capacity));
  form.append('stock_state', payload.stock_state);
  appendIfDefined(form, 'unit_type_id', payload.unit_type_id);
  appendIfDefined(form, 'sparepart_id', payload.sparepart_id);
  appendIfDefined(form, 'qty_total', payload.qty_total);
  appendIfDefined(form, 'price', payload.price);
  form.append('price_discount', String(payload.price_discount ?? 0));
  form.append('price_usd_discount', String(payload.price_usd_discount ?? 0));
  appendIfDefined(form, 'bbn_price', payload.bbn_price);
  appendIfDefined(form, 'expedition_fee', payload.expedition_fee);
  appendIfDefined(form, 'other_fee', payload.other_fee);
  appendIfDefined(form, 'transaction_date', payload.transaction_date);
  appendIfDefined(form, 'price_usd', payload.price_usd);
  appendIfDefined(form, 'price_per_unit_usd', payload.price_per_unit_usd);
  form.append('document_template_id', payload.document_template_id == null ? '' : String(payload.document_template_id));
};

const toUrlEncodedPayload = (payload: SalesPayload): URLSearchParams => {
  const params = new URLSearchParams();
  params.append('company_id', String(payload.company_id));
  params.append('person_id', String(payload.person_id));
  if (payload.warehouse_id !== undefined && payload.warehouse_id !== null) {
    params.append('warehouse_id', String(payload.warehouse_id));
  }
  params.append('code', payload.code);
  params.append('type', payload.type);
  params.append('max_capacity', String(payload.max_capacity));
  params.append('stock_state', payload.stock_state);
  if (payload.unit_type_id !== undefined && payload.unit_type_id !== null) {
    params.append('unit_type_id', String(payload.unit_type_id));
  }
  if (payload.sparepart_id !== undefined && payload.sparepart_id !== null) {
    params.append('sparepart_id', String(payload.sparepart_id));
  }
  if (payload.qty_total !== undefined && payload.qty_total !== null) {
    params.append('qty_total', String(payload.qty_total));
  }
  if (payload.price !== undefined && payload.price !== null) {
    params.append('price', String(payload.price));
  }
  params.append('price_discount', String(payload.price_discount ?? 0));
  params.append('price_usd_discount', String(payload.price_usd_discount ?? 0));
  if (payload.bbn_price !== undefined && payload.bbn_price !== null) {
    params.append('bbn_price', String(payload.bbn_price));
  }
  if (payload.expedition_fee !== undefined && payload.expedition_fee !== null) {
    params.append('expedition_fee', String(payload.expedition_fee));
  }
  if (payload.other_fee !== undefined && payload.other_fee !== null) {
    params.append('other_fee', String(payload.other_fee));
  }
  if (payload.transaction_date) {
    params.append('transaction_date', payload.transaction_date);
  }
  if (payload.price_usd !== undefined && payload.price_usd !== null) {
    params.append('price_usd', String(payload.price_usd));
  }
  if (payload.price_per_unit_usd !== undefined && payload.price_per_unit_usd !== null) {
    params.append('price_per_unit_usd', String(payload.price_per_unit_usd));
  }
  params.append('document_template_id', payload.document_template_id == null ? '' : String(payload.document_template_id));
  return params;
};

const unwrapDetail = (payload: SalesApiModel | { data?: SalesApiModel }): SalesApiModel => {
  if ((payload as { data?: SalesApiModel })?.data) {
    return (payload as { data: SalesApiModel }).data;
  }
  return payload as SalesApiModel;
};

export const salesService = {
  async getSalesList(
    companyId?: string | number,
    options: { page?: number; perPage?: number; search?: string; status?: string; start_date?: string | null; end_date?: string | null } = {},
  ) {
    let rows: SalesApiModel[] = [];
    let responseData: LaravelPagination<SalesApiModel> | null = null;
    const requestParams = {
      company_id: companyId,
      type: 'sales',
      sort_order: 'desc',
      page: options.page ?? 1,
      per_page: options.perPage ?? 10,
      search: options.search || undefined,
      status: options.status || undefined,
      start_date: options.start_date || undefined,
      end_date: options.end_date || undefined,
    };

    try {
      const response = await apiClient.get<LaravelApiResponse<LaravelPagination<any>>>(basePath, {
        params: requestParams,
      });

      const payload = ensureSuccess(response.data) as LaravelPagination<SalesApiModel>;
      responseData = payload;
      rows = payload.data ?? [];
    } catch {
      // Compatibility fallback for environments exposing the shorter base path.
      try {
        const fallbackResponse = await apiClient.get<LaravelApiResponse<LaravelPagination<any>>>(fallbackBasePath, {
          params: requestParams,
        });

        const fallbackPayload = ensureSuccess(fallbackResponse.data) as LaravelPagination<SalesApiModel>;
        responseData = fallbackPayload;
        rows = fallbackPayload.data ?? [];
      } catch {
        responseData = null;
      }
    }

    if (!responseData) {
      return {
        data: [],
        mappedData: [],
        meta: {
          currentPage: 1,
          perPage: options.perPage ?? 10,
          total: 0,
          lastPage: 1,
        },
      };
    }

    const mappedData = rows.map(mapSalesToUI);

    return {
      data: rows.map(mapSalesToTableItem),
      mappedData,
      meta: {
        currentPage: responseData.current_page ?? 1,
        perPage: responseData.per_page ?? options.perPage ?? 10,
        total: responseData.total ?? 0,
        lastPage: responseData.last_page ?? 1,
      },
    };
  },

  async getSalesDetail(id: string, companyId?: string | number): Promise<UnitTransactionDetail> {
    return unitTransactionService.getUnitTransactionDetail(id, companyId);
  },

  async createSales(payload: SalesPayload) {
    const form = new FormData();
    appendPayload(form, payload);

    try {
      const response = await apiClient.post<LaravelApiResponse<SalesApiModel | { data?: SalesApiModel }>>(basePath, form);
      const data = ensureSuccess(response.data);
      return unwrapDetail(data);
    } catch (error) {
      try {
        const response = await apiClient.post<LaravelApiResponse<SalesApiModel | { data?: SalesApiModel }>>(fallbackBasePath, form);
        const data = ensureSuccess(response.data);
        return unwrapDetail(data);
      } catch {
        throw error;
      }
    }
  },

  async updateSales(id: string, payload: SalesPayload) {
    const params = toUrlEncodedPayload(payload);

    const response = await apiClient.put<LaravelApiResponse<SalesApiModel | { data?: SalesApiModel }>>(`${basePath}/${id}`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const data = ensureSuccess(response.data);
    return unwrapDetail(data);
  },

  async deleteSales(id: string, companyId?: string | number) {
    await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`, {
      params: companyId ? { company_id: companyId } : undefined,
    });
  },
};
