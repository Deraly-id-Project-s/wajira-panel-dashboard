// src/services/purchase.service.ts

import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';
import { PaginationParams } from '@/@types/pagination.types';

import {
  Purchase,
  PurchaseUnit,
  PurchaseUnitItemDetail,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  CreatePurchaseUnitRequest,
  PurchasePaginatedResponse,
  PurchaseUnitItemPaginatedResponse,
  PurchaseUnitItemRow,
} from '@/@types/purchase.types';

// Local in-memory store for UI state only.
let purchases: Purchase[] = [];
// Cache mirrors latest fetched details.
const purchaseUnitItemDetails: PurchaseUnitItemDetail[] = [];
type UnitTransactionItemListApiModel = {
  id?: number;
  uuid?: string;
  unit_transaction_id?: number;
  unit_type_id?: number;
  qty_total?: number;
  price?: string | number;
  bbn_price?: string | number;
  expedition_fee?: string | number;
  hpp_per_unit_price?: string | number;
  dpp_per_unit_price?: string | number;
  ppn_per_unit_price?: string | number;
  other_fee?: string | number;
  created_at?: string;
  unit_transaction?: {
    id?: number;
    uuid?: string;
    code?: string;
    warehouse_id?: number;
  };
};

const basePath = '/wapi/transaction/unit-transaction/unit-transaction';

type UnitTransactionListApiModel = {
  id: number;
  uuid?: string;
  warehouse_id?: number;
  person_id?: number;
  code?: string;
  type?: string;
  max_capacity?: string;
  stock_state?: string;
  created_at?: string;
  updated_at?: string;
  document_template_id?: number | string | null;
  document_template?: { id?: number | string; uuid?: string } | null;
  warehouse?: {
    id?: number;
    uuid?: string;
    name?: string;
    capacity?: number;
  };
  person?: {
    id?: number;
    uuid?: string;
    code?: string;
    name?: string;
    type?: string;
    address?: string | null;
    npwp?: string | null;
  };
  unit_transaction_billing?: {
    total_dpp?: string | number;
    total_ppn?: string | number;
    total_billing?: string | number;
    total_paid?: string | number;
    remaining_payment?: string | number;
  } | null;
};

type UnitTransactionDetailApiModel = UnitTransactionListApiModel & {
  unit_transaction_items?: Array<{
    id?: number;
    uuid?: string;
    unit_transaction_id?: number;
    qty_total?: number;
    price?: string | number;
    unit_transaction_item_details?: Array<{
      id?: number;
      uuid?: string;
      color?: string;
      machine_number?: string;
      chassis_number?: string;
    }>;
  }>;
};

const computeTotalsFromItems = (
  items: UnitTransactionDetailApiModel['unit_transaction_items'],
): {
  totalDpp: number;
  totalPpn: number;
  totalBiaya: number;
  totalPurchase: number;
  totalPaid: number;
  remainingPayment: number;
} => {
  const totalDpp = (items ?? []).reduce((acc, item) => {
    const qty = Number(item?.qty_total ?? 0);
    const price = Number(item?.price ?? 0);
    return acc + qty * price;
  }, 0);

  const totalPpn = totalDpp * 0.11;
  const totalPurchase = totalDpp + totalPpn;
  const totalPaid = 0;
  const remainingPayment = totalPurchase - totalPaid;

  return {
    totalDpp,
    totalPpn,
    totalBiaya: totalPurchase,
    totalPurchase,
    totalPaid,
    remainingPayment,
  };
};

const mapUnits = (detail: UnitTransactionDetailApiModel): PurchaseUnit[] => {
  return (detail.unit_transaction_items ?? []).map((item, index) => {
    const qty = Number(item?.qty_total ?? 0);
    const price = Number(item?.price ?? 0);
    const dpp = qty * price;
    const ppn = dpp * 0.11;
    const total = dpp + ppn;

    return {
      id: String(item?.id ?? index),
      purchaseId: String(detail.id),
      typeUnitId: item?.uuid ?? `unit-${index + 1}`,
      typeUnitName: item?.unit_transaction_item_details?.[0]?.color ?? `Unit ${index + 1}`,
      qty,
      price,
      biayaBBN: 0,
      biayaEkspedisi: 0,
      biayaLain: 0,
      dppTaxVersionId: '',
      ppnTaxVersionId: '',
      hpp: total,
      dpp,
      ppn,
      total,
    };
  });
};

const mapDetailToPurchase = (detail: UnitTransactionDetailApiModel): Purchase => {
  const fromItems = computeTotalsFromItems(detail.unit_transaction_items);

  const billing = detail.unit_transaction_billing;
  const billingTotals = billing
    ? {
      totalDpp: Number(billing.total_dpp ?? fromItems.totalDpp ?? 0),
      totalPpn: Number(billing.total_ppn ?? fromItems.totalPpn ?? 0),
      totalBiaya: Number(billing.total_billing ?? fromItems.totalBiaya ?? 0),
      totalPurchase: Number(billing.total_billing ?? fromItems.totalPurchase ?? 0),
      totalPaid: Number(billing.total_paid ?? 0),
      remainingPayment: Number(billing.remaining_payment ?? fromItems.totalPurchase - Number(billing.total_paid ?? 0)),
    }
    : fromItems;

  return {
    id: String(detail.id),
    code: detail.code ?? '-',
    date: detail.created_at ?? '',
    supplierName: detail.person?.name ?? '-',
    supplierAddress: detail.person?.address ?? null,
    supplierNpwp: detail.person?.npwp ?? null,
    companyId: String(detail.person_id ?? ''),
    stockState: detail.stock_state,
    maxCapacity: detail.max_capacity !== undefined && detail.max_capacity !== null ? Number(detail.max_capacity) : undefined,
    warehouseName: detail.warehouse?.name,
    warehouseId: detail.warehouse?.id ? String(detail.warehouse.id) : undefined,
    transaction_date: (detail as any).transaction_date ?? detail.created_at ?? '',
    documentTemplateId: detail.document_template_id != null ? String(detail.document_template_id) : detail.document_template?.id != null ? String(detail.document_template.id) : detail.document_template?.uuid ?? null,
    ...billingTotals,
    units: mapUnits(detail),
    unit_transaction_items: detail.unit_transaction_items ?? [],
    totalPaid: billingTotals.totalPaid ?? 0,
    createdAt: detail.created_at ?? '',
    updatedAt: detail.updated_at ?? '',
  };
};

const mapListItemToPurchase = (item: UnitTransactionListApiModel): Purchase => {
  const billing = item.unit_transaction_billing;
  const billingTotals = billing
    ? {
      totalDpp: Number(billing.total_dpp ?? 0),
      totalPpn: Number(billing.total_ppn ?? 0),
      totalBiaya: Number(billing.total_billing ?? 0),
      totalPurchase: Number(billing.total_billing ?? 0),
      totalPaid: Number(billing.total_paid ?? 0),
      remainingPayment: Number(billing.remaining_payment ?? 0),
    }
    : {
      totalDpp: 0,
      totalPpn: 0,
      totalBiaya: 0,
      totalPurchase: 0,
      totalPaid: 0,
      remainingPayment: 0,
    };

  return {
    id: String(item.id),
    code: item.code ?? '-',
    date: item.created_at ?? '',
    supplierName: item.person?.name ?? '-',
    companyId: String(item.person_id ?? ''),
    stockState: item.stock_state,
    maxCapacity: item.max_capacity !== undefined && item.max_capacity !== null ? Number(item.max_capacity) : undefined,
    warehouseName: item.warehouse?.name,
    warehouseId: item.warehouse?.id ? String(item.warehouse.id) : undefined,
    transaction_date: (item as any).transaction_date ?? item.created_at ?? '',
    documentTemplateId: item.document_template_id != null ? String(item.document_template_id) : item.document_template?.id != null ? String(item.document_template.id) : item.document_template?.uuid ?? null,
    ...billingTotals,
    units: [],
    unit_transaction_items: (item as any).unit_transaction_items ?? [],
    createdAt: item.created_at ?? '',
    updatedAt: item.updated_at ?? '',
  };
};

type UnitTransactionItemDetailApiModel = {
  id?: number;
  uuid?: string;
  unit_transaction_item_id?: number;
  color?: string;
  machine_number?: string;
  chassis_number?: string;
  in_stock?: boolean;
  created_at?: string;
  unit_transaction_item?: {
    id?: number;
    uuid?: string;
    unit_transaction_id?: number;
  };
};

const mapItemDetail = (item: UnitTransactionItemDetailApiModel): PurchaseUnitItemDetail => ({
  id: String(item.id ?? ''),
  uuid: item.uuid,
  purchaseId: item.unit_transaction_item?.unit_transaction_id ? String(item.unit_transaction_item.unit_transaction_id) : undefined,
  unitTransactionItemId: item.unit_transaction_item?.id ? String(item.unit_transaction_item.id) : item.unit_transaction_item_id ? String(item.unit_transaction_item_id) : undefined,
  color: item.color,
  machineNumber: item.machine_number,
  chassisNumber: item.chassis_number,
  inStock: item.in_stock,
  createdAt: item.created_at,
});

const mapUnitTransactionItemList = (item: UnitTransactionItemListApiModel): PurchaseUnitItemRow => {
  const qty = Number(item.qty_total ?? 0);
  const price = Number(item.price ?? 0);
  const bbn = Number(item.bbn_price ?? 0);
  const expedition = Number(item.expedition_fee ?? 0);
  const other = Number(item.other_fee ?? 0);
  const hppPerUnit = Number(item.hpp_per_unit_price ?? 0);
  const dppPerUnit = Number(item.dpp_per_unit_price ?? 0);
  const ppnPerUnit = Number(item.ppn_per_unit_price ?? 0);

  const hppTotal = hppPerUnit * qty;
  const dppTotal = dppPerUnit * qty;
  const ppnTotal = ppnPerUnit * qty;
  const totalPurchase = dppTotal + ppnTotal;

  return {
    id: String(item.id ?? ''),
    code: item.unit_transaction?.code ?? '-',
    unitTransactionId: item.unit_transaction_id ? String(item.unit_transaction_id) : '',
    unitTransactionCode: item.unit_transaction?.code,
    unitTypeId: item.unit_type_id ? String(item.unit_type_id) : undefined,
    qtyTotal: qty,
    price,
    bbnPrice: bbn,
    expeditionFee: expedition,
    otherFee: other,
    hppPerUnit,
    dppPerUnit,
    ppnPerUnit,
    hppTotal,
    dppTotal,
    ppnTotal,
    totalDpp: dppTotal,
    totalPpn: ppnTotal,
    totalPurchase,
    createdAt: item.created_at,
  };
};

/* =====================================
   SERVICE METHODS
===================================== */

export const purchaseService = {
  async getPurchases(companyId: string, params: PaginationParams & { withTotals?: boolean } = {}): Promise<PurchasePaginatedResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
      params: {
        company_id: companyId,
        page: params.page ?? 1,
        per_page: params.perPage ?? 10,
        sort_order: 'asc',
        type: 'purchase',
        search: params.search || undefined,
      },
    });

    const payload = ensureSuccess(response.data);
    const mapped = (payload.data ?? []).map((item: UnitTransactionListApiModel) => mapListItemToPurchase(item));

    // Optionally enrich totals with detail fetch when billing is empty
    let purchasesWithTotals = mapped;
    if (params.withTotals !== false) {
      const needsTotals = mapped.filter((item: Purchase) => item.totalDpp === 0 && item.totalPpn === 0 && item.totalPurchase === 0);

      if (needsTotals.length > 0) {
        const enriched = await Promise.all(
          needsTotals.map(async (item: Purchase) => {
            const detail = await this.getPurchaseById(item.id);
            if (!detail) return item;
            return {
              ...item,
              totalDpp: detail.totalDpp,
              totalPpn: detail.totalPpn,
              totalBiaya: detail.totalBiaya,
              totalPurchase: detail.totalPurchase,
              remainingPayment: detail.remainingPayment,
              totalPaid: detail.totalPaid,
              units: detail.units,
            };
          }),
        );

        purchasesWithTotals = mapped.map((item: Purchase) => enriched.find((enrichedItem) => enrichedItem.id === item.id) ?? item);
      }
    }

    return {
      data: purchasesWithTotals,
      meta: mapLaravelPaginationMeta(payload),
    };
  },

  async getPurchaseById(id: string): Promise<Purchase | undefined> {
    const response = await apiClient.get<LaravelApiResponse<UnitTransactionDetailApiModel>>(`${basePath}/${id}`);
    const payload = ensureSuccess(response.data);
    const mapped = mapDetailToPurchase(payload);
    const existingIdx = purchases.findIndex((p) => p.id === mapped.id);
    if (existingIdx >= 0) {
      purchases[existingIdx] = mapped;
    } else {
      purchases = [...purchases, mapped];
    }
    return mapped;
  },

  /* =====================================
     UNIT ITEM DETAIL CRUD
  ===================================== */

  async getUnitTransactionItems(params: PaginationParams & { company_id?: string | null } = {}): Promise<PurchaseUnitItemPaginatedResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}-item`, {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 10,
        search: params.search || undefined,
        company_id: params.company_id || undefined,
      },
    });
    const payload = ensureSuccess(response.data);
    return {
      data: (payload.data ?? []).map((item: UnitTransactionItemListApiModel) => mapUnitTransactionItemList(item)),
      meta: mapLaravelPaginationMeta(payload),
    };
  },

  async getUnitItemDetails(purchaseId?: string): Promise<PurchaseUnitItemDetail[]> {
    try {
      const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}-item-detail`);
      const payload = ensureSuccess(response.data);
      const mapped: PurchaseUnitItemDetail[] = (payload.data?.data ?? []).map((item: UnitTransactionItemDetailApiModel) => mapItemDetail(item));
      if (!purchaseId) return mapped;
      return mapped.filter((item) => item.purchaseId === purchaseId);
    } catch {
      return purchaseUnitItemDetails.filter((item) => (purchaseId ? item.purchaseId === purchaseId : true));
    }
  },

  async getUnitItemDetail(id: string): Promise<PurchaseUnitItemDetail | undefined> {
    try {
      const response = await apiClient.get<LaravelApiResponse<UnitTransactionItemDetailApiModel>>(`${basePath}-item-detail/${id}`);
      const payload = ensureSuccess(response.data);
      return mapItemDetail(payload);
    } catch {
      return purchaseUnitItemDetails.find((item) => item.id === id);
    }
  },

  async createUnitItemDetail(formData: FormData): Promise<PurchaseUnitItemDetail> {
    const response = await apiClient.post<LaravelApiResponse<UnitTransactionItemDetailApiModel>>(`${basePath}-item-detail`, formData);
    const payload = ensureSuccess(response.data);
    const mapped = mapItemDetail(payload);
    purchaseUnitItemDetails.push(mapped);
    return mapped;
  },

  async updateUnitItemDetail(id: string, formData: FormData): Promise<PurchaseUnitItemDetail> {
    const response = await apiClient.post<LaravelApiResponse<UnitTransactionItemDetailApiModel>>(`${basePath}-item-detail/${id}?_method=PUT`, formData);
    const payload = ensureSuccess(response.data);
    const mapped = mapItemDetail(payload);
    const idx = purchaseUnitItemDetails.findIndex((i) => i.id === id);
    if (idx >= 0) purchaseUnitItemDetails[idx] = mapped;
    return mapped;
  },

  async deleteUnitItemDetail(id: string): Promise<void> {
    try {
      await apiClient.delete<LaravelApiResponse<null>>(`${basePath}-item-detail/${id}`);
    } finally {
      const idx = purchaseUnitItemDetails.findIndex((i) => i.id === id);
      if (idx >= 0) purchaseUnitItemDetails.splice(idx, 1);
    }
  },

  async deleteUnitTransactionItem(id: string): Promise<void> {
    await apiClient.delete<LaravelApiResponse<null>>(`${basePath}-item/${id}`);
  },

  async createPurchase(payload: CreatePurchaseRequest): Promise<Purchase> {
    const form = new FormData();
    form.append('warehouse_id', String(payload.warehouse_id));
    form.append('person_id', String(payload.person_id));
    form.append('company_id', String(payload.company_id));
    form.append('type', payload.type);
    form.append('stock_state', payload.stock_state);
    form.append('max_capacity', payload.max_capacity);
    if (payload.code) form.append('code', payload.code);
    if (payload.transaction_date) form.append('transaction_date', payload.transaction_date);
    if (payload.unit_type_id !== undefined) form.append('unit_type_id', String(payload.unit_type_id));
    if (payload.sparepart_id !== undefined) form.append('sparepart_id', String(payload.sparepart_id));
    if (payload.qty_total !== undefined) form.append('qty_total', String(payload.qty_total));
    if (payload.price !== undefined) form.append('price', String(payload.price));
    if (payload.bbn_price !== undefined) form.append('bbn_price', String(payload.bbn_price));
    if (payload.expedition_fee !== undefined) form.append('expedition_fee', String(payload.expedition_fee));
    if (payload.other_fee !== undefined) form.append('other_fee', String(payload.other_fee));
    if (payload.price_usd !== undefined) form.append('price_usd', String(payload.price_usd));
    if (payload.price_per_unit_usd !== undefined) form.append('price_per_unit_usd', String(payload.price_per_unit_usd));
    form.append('document_template_id', payload.document_template_id == null ? '' : String(payload.document_template_id));

    if (process.env.NODE_ENV !== 'production') {
      const preview = Array.from(form.entries()).reduce<Record<string, any>>((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});
    }

    const response = await apiClient.post<LaravelApiResponse<UnitTransactionDetailApiModel>>(basePath, form);
    const data = ensureSuccess(response.data);
    const mapped = mapDetailToPurchase(data);

    // keep legacy store in sync for offline cases
    purchases = [...purchases, mapped];
    return mapped;
  },

  async updatePurchase(id: string, payload: UpdatePurchaseRequest): Promise<Purchase> {
    const form = new FormData();
    form.append('_method', 'PUT');
    form.append('company_id', String(payload.company_id));
    form.append('person_id', String(payload.person_id));
    form.append('code', payload.code);
    form.append('type', payload.type);
    form.append('max_capacity', String(payload.max_capacity));
    form.append('stock_state', payload.stock_state);
    if (payload.transaction_date) {
      form.append('transaction_date', payload.transaction_date);
    }
    form.append('document_template_id', payload.document_template_id == null ? '' : String(payload.document_template_id));

    const response = await apiClient.post<LaravelApiResponse<UnitTransactionDetailApiModel>>(`${basePath}/${id}`, form);
    const data = ensureSuccess(response.data);
    const mapped = mapDetailToPurchase(data);

    // Sync in-memory store
    purchases = purchases.map((p) => (p.id === id ? mapped : p));

    return mapped;
  },

  async deletePurchase(id: string): Promise<void> {
    try {
      await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
    } catch {
      // swallow API errors here so UI can still proceed; local store will also delete
    }
    purchases = purchases.filter((p) => p.id !== id);
  },

  async addUnit(payload: CreatePurchaseUnitRequest): Promise<Purchase> {
    const form = new FormData();
    form.append('unit_transaction_id', payload.purchaseId);
    form.append('unit_type_id', payload.typeUnitId);
    form.append('qty_total', String(payload.qty));
    form.append('price', String(payload.price));
    form.append('bbn_price', String(payload.biayaBBN ?? 0));
    form.append('expedition_fee', String(payload.biayaEkspedisi ?? 0));
    form.append('other_fee', String(payload.biayaLain ?? 0));
    if (payload.priceUsd !== undefined) form.append('price_usd', String(payload.priceUsd));
    if (payload.pricePerUnitUsd !== undefined) form.append('price_per_unit_usd', String(payload.pricePerUnitUsd));

    await apiClient.post<LaravelApiResponse<any>>(`${basePath}-item`, form);

    const refreshed = await this.getPurchaseById(payload.purchaseId);
    if (!refreshed) throw new Error('Purchase not found');
    return refreshed;
  },

  async updatePayment(id: string, payload: { bca: number; bcaUsd: number; cash: number }): Promise<Purchase> {
    const purchase = purchases.find((p) => p.id === id);
    if (!purchase) throw new Error('Purchase not found');

    const totalPaid = (payload.bca || 0) + (payload.bcaUsd || 0) + (payload.cash || 0);

    const updated: Purchase = {
      ...purchase,
      totalPaid,
      remainingPayment: purchase.totalPurchase - totalPaid,
      updatedAt: new Date().toISOString(),
    };

    purchases = purchases.map((p) => (p.id === id ? updated : p));

    return updated;
  },

  async deleteUnit(purchaseId: string, unitId: string): Promise<Purchase> {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) throw new Error('Purchase not found');

    const updatedUnits = purchase.units.filter((u: PurchaseUnit) => u.id !== unitId);

    const totalDpp = updatedUnits.reduce((acc, u) => acc + u.dpp, 0);
    const totalPpn = updatedUnits.reduce((acc, u) => acc + u.ppn, 0);
    const totalBiaya = updatedUnits.reduce((acc, u) => acc + u.total, 0);

    const updatedPurchase: Purchase = {
      ...purchase,
      units: updatedUnits,
      totalDpp,
      totalPpn,
      totalBiaya,
      totalPurchase: totalBiaya,
      remainingPayment: totalBiaya - purchase.totalPaid,
    };

    purchases = purchases.map((p) => (p.id === purchaseId ? updatedPurchase : p));

    return updatedPurchase;
  },

  async getUnitTransactionItemDetailsData(id: string, params: { in_stock?: boolean; color?: string; machine_number?: string; chassis_number?: string; status?: string } = {}): Promise<any[]> {
    const response = await apiClient.get<LaravelApiResponse<any[]>>(`${basePath}/${id}/get-item-details`, {
      params: {
        in_stock: params.in_stock !== undefined ? params.in_stock : true,
        color: params.color || undefined,
        machine_number: params.machine_number || undefined,
        chassis_number: params.chassis_number || undefined,
        status: params.status || undefined,
      }
    });
    return ensureSuccess(response.data);
  },
};
