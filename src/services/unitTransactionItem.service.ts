import { PaginationParams } from '@/@types/pagination.types';
import {
  CreateUnitTransactionItemPayload,
  UnitTransactionItem,
  UnitTransactionItemFormulaResponse,
  UnitTransactionItemListResponse,
  UpdateUnitTransactionItemPayload,
} from '@/@types/unit-transaction.types';
import { apiClient } from '@/lib/api/client';
import {
  ensureSuccess,
  LaravelApiResponse,
  toPaginatedResult,
} from '@/lib/api/response';

type UnitTransactionItemApiModel = {
  id?: number | string;
  unit_transaction_id?: number | string;
  unit_type_id?: number | string;
  sparepart_id?: number | string;
  qty_total?: number | string;
  price?: number | string;
  bbn_price?: number | string;
  expedition_fee?: number | string;
  other_fee?: number | string;
  hpp_per_unit_price?: number | string;
  dpp_per_unit_price?: number | string;
  ppn_per_unit_price?: number | string;
  hpp_total_price?: number | string;
  dpp_total_price?: number | string;
  dpp_tax_rate?: number | string;
  ppn_tax_rate?: number | string;
  ppn_total_price?: number | string;
  price_usd?: number | string;
  price_per_unit_usd?: number | string;
  price_discount?: number | string;
  price_usd_discount?: number | string;
  price_total?: number | string;
};

export type UnitFormulaInput = {
  qty_total?: number | string;
  price?: number | string;
  bbn_price?: number | string;
  expedition_fee?: number | string;
  other_fee?: number | string;
  price_discount?: number | string;
  price_usd_discount?: number | string;
  dpp_tax_id?: number | string | null;
  ppn_tax_id?: number | string | null;
  price_per_unit_usd?: number | string;
  price_usd?: number | string;
  usd_costs?: Array<{
    id?: number;
    cost_type: string;
    amount: number;
    note?: string | null;
  }>;
};

export type { UnitTransactionItemFormulaResponse } from '@/@types/unit-transaction.types';
export type UnitFormulaResult = UnitTransactionItemFormulaResponse;

const basePath = '/wapi/transaction/unit-transaction/unit-transaction-item';

// ======================
// UTILS
// ======================

const toNumber = (value: number | string | undefined): number =>
  Number(value ?? 0);

const toIntegerString = (value: number | string | undefined): string =>
  String(Math.trunc(Number(value ?? 0)));

const toDecimalString = (value: number | string | undefined): string =>
  Number(value ?? 0).toFixed(2);

const appendIfDefined = (
  form: FormData,
  key: string,
  value: any,
  formatter?: (v: any) => string
) => {
  if (value !== undefined && value !== null) {
    form.append(key, formatter ? formatter(value) : String(value));
  }
};

// ======================
// MAPPER
// ======================

const mapItem = (item: UnitTransactionItemApiModel): UnitTransactionItem => {
  const qty = toNumber(item.qty_total);
  const price = toNumber(item.price);
  const bbnPrice = toNumber(item.bbn_price);
  const expeditionFee = toNumber(item.expedition_fee);
  const otherFee = toNumber(item.other_fee);

  const hppPerUnit = toNumber(item.hpp_per_unit_price);
  const dppPerUnit = toNumber(item.dpp_per_unit_price);
  const ppnPerUnit = toNumber(item.ppn_per_unit_price);

  const hppTotal = toNumber(item.hpp_total_price) || (hppPerUnit > 0 ? hppPerUnit * qty : price * qty);
  const dppTotal = toNumber(item.dpp_total_price) || (dppPerUnit > 0 ? dppPerUnit * qty : hppTotal);
  const ppnTotal = toNumber(item.ppn_total_price) || (ppnPerUnit > 0 ? ppnPerUnit * qty : dppTotal * 0.11);

  return {
    id: String(item.id ?? ''),
    unit_transaction_id: String(item.unit_transaction_id ?? ''),
    unit_type_id:
      item.unit_type_id !== undefined
        ? String(item.unit_type_id)
        : undefined,
    sparepart_id:
      item.sparepart_id !== undefined
        ? String(item.sparepart_id)
        : undefined,
    qty_total: qty,
    price,
    bbn_price: bbnPrice,
    expedition_fee: expeditionFee,
    other_fee: otherFee,
    hpp_total_price: hppTotal,
    dpp_total_price: dppTotal,
    ppn_total_price: ppnTotal,
    price_total: item.price_total !== undefined ? toNumber(item.price_total) : (dppTotal + ppnTotal + bbnPrice + expeditionFee + otherFee),
    price_usd: item.price_usd !== undefined ? toNumber(item.price_usd) : undefined,
    price_per_unit_usd: item.price_per_unit_usd !== undefined ? toNumber(item.price_per_unit_usd) : undefined,
    price_discount: item.price_discount !== undefined ? toNumber(item.price_discount) : 0,
    price_usd_discount: item.price_usd_discount !== undefined ? toNumber(item.price_usd_discount) : 0,
  };
};

const mapFormula = (payload: any): UnitTransactionItemFormulaResponse => {
  const priceUsdAdditionalTotal = payload?.price_usd_additional_total !== undefined
    ? toNumber(payload.price_usd_additional_total)
    : toNumber(payload?.total_usd_cost);

  const priceUsdTotal = payload?.price_usd_total !== undefined
    ? toNumber(payload.price_usd_total)
    : (payload?.price_total_usd !== undefined ? toNumber(payload.price_total_usd) : 0);

  const totalUsdCost = payload?.total_usd_cost !== undefined
    ? toNumber(payload.total_usd_cost)
    : priceUsdAdditionalTotal;

  return {
    bbn_price: toNumber(payload?.bbn_price),
    expedition_fee: toNumber(payload?.expedition_fee),
    other_fee: toNumber(payload?.other_fee),
    hpp_per_unit_price: toNumber(payload?.hpp_per_unit_price),
    dpp_per_unit_price: toNumber(payload?.dpp_per_unit_price),
    ppn_per_unit_price: toNumber(payload?.ppn_per_unit_price),
    hpp_total_price: toNumber(payload?.hpp_total_price),
    dpp_total_price: toNumber(payload?.dpp_total_price),
    ppn_total_price: toNumber(payload?.ppn_total_price),
    price_per_unit_usd: toNumber(payload?.price_per_unit_usd),
    price_usd: toNumber(payload?.price_usd),
    total_usd_cost: totalUsdCost,
    price_usd_additional_total: priceUsdAdditionalTotal,
    price_usd_total: priceUsdTotal,
    price_total: payload?.price_total !== undefined ? toNumber(payload.price_total) : undefined,
    price_total_usd: priceUsdTotal,
  };
};

// ======================
// SERVICE
// ======================

export const unitTransactionItemService = {
  async getFormula(payload: UnitFormulaInput): Promise<UnitTransactionItemFormulaResponse> {
    const requestParams: Record<string, any> = {
      qty_total: toIntegerString(payload.qty_total),
      price: toDecimalString(payload.price),
      bbn_price: toDecimalString(payload.bbn_price),
      expedition_fee: toDecimalString(payload.expedition_fee),
      other_fee: toDecimalString(payload.other_fee),
    };

    if (payload.price_discount !== undefined && payload.price_discount !== null) {
      requestParams.price_discount = toDecimalString(payload.price_discount);
    }
    if (payload.price_usd_discount !== undefined && payload.price_usd_discount !== null) {
      requestParams.price_usd_discount = toDecimalString(payload.price_usd_discount);
    }
    if (payload.price_per_unit_usd !== undefined && payload.price_per_unit_usd !== null) {
      requestParams.price_per_unit_usd = toDecimalString(payload.price_per_unit_usd);
    }
    if (payload.price_usd !== undefined && payload.price_usd !== null) {
      requestParams.price_usd = toDecimalString(payload.price_usd);
    }
    if (payload.dpp_tax_id != null && payload.dpp_tax_id !== '') {
      requestParams.dpp_tax_id = Number(payload.dpp_tax_id);
    }
    if (payload.ppn_tax_id != null && payload.ppn_tax_id !== '') {
      requestParams.ppn_tax_id = Number(payload.ppn_tax_id);
    }
    if (payload.usd_costs && payload.usd_costs.length > 0) {
      requestParams.usd_costs = payload.usd_costs;
    }

    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/get-formula`, {
      params: requestParams,
    });

    const data = ensureSuccess(response.data);
    const normalized = (data as any)?.data ?? data;
    return mapFormula(normalized);
  },

  async getSalesItemsByWarehouse(
    warehouseId: string | number,
    params: PaginationParams = {}
  ): Promise<UnitTransactionItem[]> {
    const response = await apiClient.get<LaravelApiResponse<any>>(
      basePath,
      {
        params: {
          warehouse_id: String(warehouseId),
          type: 'sales',
          page: params.page ?? 1,
          per_page: params.perPage ?? 200,
        },
      }
    );

    const payload = ensureSuccess(response.data);

    if (Array.isArray(payload)) {
      return payload.map(mapItem);
    }

    if (Array.isArray(payload?.data)) {
      return payload.data.map(mapItem);
    }

    if (Array.isArray(payload?.data?.data)) {
      return payload.data.data.map(mapItem);
    }

    return [];
  },

  // ======================
  // GET ITEMS
  // ======================
  async getItems(
    purchaseId: string,
    params: PaginationParams & { type?: 'purchase' | 'sales' } = {}
  ): Promise<UnitTransactionItemListResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(
      basePath,
      {
        params: {
          unit_transaction_id: purchaseId,
          type: params.type ?? 'purchase',
          page: params.page ?? 1,
          per_page: params.perPage ?? 50,
        },
      }
    );

    const payload = ensureSuccess(response.data);

    if (Array.isArray(payload)) {
      return {
        data: payload.map(mapItem),
        meta: {
          currentPage: 1,
          perPage: payload.length || 1,
          total: payload.length,
          lastPage: 1,
        },
      };
    }

    if (Array.isArray(payload?.data)) {
      return toPaginatedResult(payload, mapItem);
    }

    if (Array.isArray(payload?.data?.data)) {
      return toPaginatedResult(payload.data, mapItem);
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

  // ======================
  // CREATE ITEM
  // ======================
  async createItem(
    payload: CreateUnitTransactionItemPayload
  ): Promise<UnitTransactionItem> {
    const form = new FormData();

    form.append(
      'unit_transaction_id',
      toIntegerString(payload.unit_transaction_id)
    );
    form.append(
      'unit_type_id',
      toIntegerString(payload.unit_type_id)
    );

    if (payload.company_id) {
      form.append('company_id', String(payload.company_id));
    }
    if (payload.type) {
      form.append('type', payload.type);
    }

    appendIfDefined(
      form,
      'sparepart_id',
      payload.sparepart_id,
      toIntegerString
    );
    appendIfDefined(
      form,
      'qty_total',
      payload.qty_total,
      toIntegerString
    );
    appendIfDefined(form, 'price', payload.price, toDecimalString);
    appendIfDefined(
      form,
      'bbn_price',
      payload.bbn_price,
      toDecimalString
    );
    appendIfDefined(
      form,
      'expedition_fee',
      payload.expedition_fee,
      toDecimalString
    );
    appendIfDefined(
      form,
      'other_fee',
      payload.other_fee,
      toDecimalString
    );
    form.append('price_discount', toDecimalString(payload.price_discount ?? 0));
    form.append('price_usd_discount', toDecimalString(payload.price_usd_discount ?? 0));
    appendIfDefined(
      form,
      'price_usd',
      payload.price_usd,
      toDecimalString
    );
    appendIfDefined(
      form,
      'price_per_unit_usd',
      payload.price_per_unit_usd,
      toDecimalString
    );

    appendIfDefined(
      form,
      'dpp_tax_id',
      payload.dpp_tax_id,
      toIntegerString
    );
    appendIfDefined(
      form,
      'ppn_tax_id',
      payload.ppn_tax_id,
      toIntegerString
    );

    const response = await apiClient.post<
      LaravelApiResponse<UnitTransactionItemApiModel>
    >(basePath, form);

    return mapItem(ensureSuccess(response.data));
  },

  // ======================
  // UPDATE ITEM (FIXED)
  // ======================
  async updateItem(
    id: string,
    payload: UpdateUnitTransactionItemPayload
  ): Promise<UnitTransactionItem> {
    const params = new URLSearchParams();

    if (payload.unit_transaction_id !== undefined && String(payload.unit_transaction_id) !== 'null') {
      params.append('unit_transaction_id', String(payload.unit_transaction_id));
    }

    if (payload.unit_type_id !== undefined && String(payload.unit_type_id) !== 'null') {
      params.append('unit_type_id', String(payload.unit_type_id));
    }

    if (
      payload.sparepart_id !== undefined &&
      payload.sparepart_id !== null &&
      String(payload.sparepart_id) !== 'null' &&
      String(payload.sparepart_id).trim().length > 0
    ) {
      params.append('sparepart_id', String(payload.sparepart_id));
    }

    if (payload.qty_total !== undefined) {
      params.append('qty_total', String(payload.qty_total));
    }

    if (payload.price !== undefined) {
      params.append('price', Number(payload.price).toFixed(2));
    }

    if (payload.price_discount !== undefined) {
      params.append('price_discount', Number(payload.price_discount).toFixed(2));
    }

    if (payload.price_usd_discount !== undefined) {
      params.append('price_usd_discount', Number(payload.price_usd_discount).toFixed(2));
    }

    if (payload.bbn_price !== undefined) {
      params.append('bbn_price', Number(payload.bbn_price).toFixed(2));
    }

    if (payload.expedition_fee !== undefined) {
      params.append('expedition_fee', Number(payload.expedition_fee).toFixed(2));
    }

    if (payload.other_fee !== undefined) {
      params.append('other_fee', Number(payload.other_fee).toFixed(2));
    }

    if (payload.price_usd !== undefined) {
      params.append('price_usd', Number(payload.price_usd).toFixed(2));
    }

    if (payload.price_per_unit_usd !== undefined) {
      params.append('price_per_unit_usd', Number(payload.price_per_unit_usd).toFixed(2));
    }

    if (payload.dpp_tax_id !== undefined && payload.dpp_tax_id !== null && String(payload.dpp_tax_id) !== '') {
      params.append('dpp_tax_id', String(Math.trunc(Number(payload.dpp_tax_id))));
    }

    if (payload.ppn_tax_id !== undefined && payload.ppn_tax_id !== null && String(payload.ppn_tax_id) !== '') {
      params.append('ppn_tax_id', String(Math.trunc(Number(payload.ppn_tax_id))));
    }

    const response = await apiClient.put(
      `${basePath}/${id}`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return mapItem(ensureSuccess(response.data));
  },

  // ======================
  // DELETE
  // ======================
  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`${basePath}/${id}`);
  },

  // ======================
  // BULK DELETE
  // ======================
  async bulkDelete(ids: string | string[]): Promise<void> {
    const idList = Array.isArray(ids) ? ids : [ids];
    const normalizedIds = idList.map((id) => String(id)).filter(Boolean);

    if (normalizedIds.length === 0) return;

    await apiClient.delete(`${basePath}/bulk-delete`, {
      params: {
        ids: normalizedIds,
      },
    });
  },
};
