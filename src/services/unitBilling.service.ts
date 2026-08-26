import {
  CreateUnitBillingHistoryPayload,
  CreateUnitBillingPayloadV2,
  UnitBilling,
  UnitBillingHistory,
  UpsertUnitBillingPayload,
} from '@/types/unit-billing.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

type UnitBillingApiModel = {
  id?: string | number;
  company_id?: string | number;
  unit_transaction_id?: string | number;
  unitTransactionId?: string | number;
  grand_total?: string | number;
  remaining_payment?: string | number;
  remaining_payment_usd?: string | number;
  last_payment_at?: string;
  bca_payment?: string | number;
  bca_payment_amount?: string | number;
  bca_payment_idr?: string | number;
  bca_payment_idr_amount?: string | number;
  cash_payment?: string | number;
  cash_payment_amount?: string | number;
  cash_amount?: string | number;
  bca_payment_2?: string | number;
  bca_payment_usd_amount?: string | number;
  bca_usd_payment?: string | number;
  usd_payment_amount?: string | number;
  total_paid?: string | number;
  total_payment?: string | number;
  paid_total?: string | number;
  total_cash_payment?: string | number;
  total_bca_cash_payment?: string | number;
  total_bca_payment?: string | number;
  total_usd_payment?: string | number;
  payment_date?: string;
  payment_at?: string;
  date?: string;
  is_paid?: boolean | number | string;
  bca_payment_liability?: string | number;
  cash_payment_liability?: string | number;
  bca_payment_usd_liability?: string | number;
  created_at?: string;
  updated_at?: string;
  unit_transaction?: {
    id?: string | number;
  };
  data?: UnitBillingApiModel;
};

type UnitBillingHistoryApiModel = {
  id?: string | number;
  unit_transaction_billing_id?: string | number;
  payment_proof?: string | null;
  bca_payment_amount?: string | number;
  cash_payment_amount?: string | number;
  bca_payment_usd_amount?: string | number;
  bca_usd_amount?: string | number;
  bca_usd_amount_original?: string | number;
  payment_at?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  unit_transaction_billing?: {
    id?: string | number;
    unit_transaction_id?: string | number;
  };
  cashes?: Array<{
    id?: string | number;
    uuid?: string;
    code?: string;
    pivot?: {
      unit_transaction_billing_history_id?: string | number;
      cash_id?: string | number;
      amount?: string | number;
    };
  }>;
  data?: UnitBillingHistoryApiModel;
};

type UnitTransactionBillingSnapshotApiModel = {
  id?: string | number;
  unit_transaction_id?: string | number;
  grand_total?: string | number;
  total_paid?: string | number;
  remaining_payment?: string | number;
  payment_at?: string | null;
  payment_date?: string;
  is_paid?: boolean | number | string;
  unit_transaction_billing_histories?: UnitBillingHistoryApiModel[];
};

type UnitTransactionDetailBillingApiModel = {
  id?: string | number;
  billing_summary?: {
    grand_total?: string | number;
    total_paid?: string | number;
    remaining_payment?: string | number;
    is_paid?: boolean | number | string;
  } | null;
  unit_transaction_billing?: UnitTransactionBillingSnapshotApiModel | null;
};

const basePath = '/wapi/transaction/unit-transaction/unit-transaction-billing';
const historyBasePath = '/wapi/transaction/unit-transaction/unit-transaction-billing-history';

const toBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
};

const unwrapBilling = (payload: any): UnitBillingApiModel => {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as UnitBillingApiModel;
  }
  return payload as UnitBillingApiModel;
};

const pickNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const normalized = Number(value ?? 0);
    if (Number.isFinite(normalized) && normalized > 0) return normalized;
  }
  return 0;
};

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapBilling = (raw: UnitBillingApiModel): UnitBilling => {
  const item = unwrapBilling(raw);
  const isPaid = toBool(item.is_paid);

  let bcaPayment = pickNumber(item.bca_payment, item.bca_payment_amount, item.bca_payment_idr, item.bca_payment_idr_amount);
  const cashPayment = pickNumber(item.cash_payment, item.cash_payment_amount, item.cash_amount);
  const bcaPayment2 = pickNumber(item.bca_payment_2, item.bca_payment_usd_amount, item.bca_usd_payment, item.usd_payment_amount);
  const totalPaidFromComponents =
    toSafeNumber(item.total_cash_payment) +
    toSafeNumber(item.total_bca_cash_payment) +
    toSafeNumber(item.total_bca_payment) +
    toSafeNumber(item.total_usd_payment);
  const totalPaid = pickNumber(item.total_paid, item.paid_total, totalPaidFromComponents);
  const rawGrandTotal = toSafeNumber(item.grand_total);
  const rawRemaining = toSafeNumber(item.remaining_payment);
  const grandTotal = rawGrandTotal > 0 ? rawGrandTotal : totalPaid + rawRemaining;
  const computedRemaining = Math.max(0, grandTotal - totalPaid);
  const remainingPayment = rawRemaining > 0 ? rawRemaining : isPaid ? 0 : computedRemaining;

  if (bcaPayment === 0 && cashPayment === 0 && bcaPayment2 === 0 && totalPaid > 0) {
    bcaPayment = totalPaid;
  }

  return {
    id: String(item.id ?? ''),
    company_id: String(item.company_id ?? ''),
    unit_transaction_id: String(item.unit_transaction_id ?? item.unitTransactionId ?? item.unit_transaction?.id ?? ''),
    grand_total: grandTotal,
    total_paid: totalPaid,
    remaining_payment: remainingPayment,
    remaining_payment_usd: toSafeNumber(item.remaining_payment_usd),
    last_payment_at: item.last_payment_at,
    bca_payment: bcaPayment,
    cash_payment: cashPayment,
    bca_payment_2: bcaPayment2,
    bca_payment_liability: pickNumber(item.bca_payment_liability),
    cash_payment_liability: pickNumber(item.cash_payment_liability),
    bca_payment_usd_liability: pickNumber(item.bca_payment_usd_liability),
    payment_date: item.payment_date ?? item.payment_at ?? item.date ?? '',
    is_paid: isPaid,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

const unwrapBillingHistory = (payload: any): UnitBillingHistoryApiModel => {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as UnitBillingHistoryApiModel;
  }
  return payload as UnitBillingHistoryApiModel;
};

const getHistoryAmountFromCashes = (item: UnitBillingHistoryApiModel, codes: string[]): number => {
  const rows = Array.isArray(item.cashes) ? item.cashes : [];
  return rows
    .filter((cash) => {
      const code = String(cash.code ?? '').toLowerCase();
      return codes.includes(code);
    })
    .reduce((sum, cash) => sum + toSafeNumber(cash.pivot?.amount), 0);
};

const mapBillingHistory = (raw: UnitBillingHistoryApiModel): UnitBillingHistory => {
  const item = unwrapBillingHistory(raw);
  const cashPayment = Math.max(toSafeNumber(item.cash_payment_amount), getHistoryAmountFromCashes(item, ['cash_idr', 'cash']));
  const bcaPayment = Math.max(toSafeNumber(item.bca_payment_amount), getHistoryAmountFromCashes(item, ['bca_idr', 'bca']));
  const bcaPaymentUsd = Math.max(toSafeNumber(item.bca_usd_amount), toSafeNumber(item.bca_payment_usd_amount), getHistoryAmountFromCashes(item, ['bca_usd', 'usd']));
  const bcaPaymentUsdOriginal = toSafeNumber(item.bca_usd_amount_original);

  return {
    id: String(item.id ?? ''),
    unit_transaction_billing_id: String(item.unit_transaction_billing_id ?? item.unit_transaction_billing?.id ?? ''),
    unit_transaction_id: item.unit_transaction_billing?.unit_transaction_id ? String(item.unit_transaction_billing.unit_transaction_id) : undefined,
    payment_proof: item.payment_proof ?? null,
    bca_payment_amount: bcaPayment,
    cash_payment_amount: cashPayment,
    bca_payment_usd_amount: bcaPaymentUsd,
    bca_payment_usd_amount_original: bcaPaymentUsdOriginal,
    payment_methods: [
      ...(bcaPaymentUsd > 0 ? ['BCA USD'] : []),
      ...(bcaPayment > 0 ? ['BCA IDR'] : []),
      ...(cashPayment > 0 ? ['Cash'] : []),
    ],
    cashes: (item.cashes ?? []).map((cash) => ({
      id: String(cash.id ?? ''),
      code: cash.code,
      amount: toSafeNumber(cash.pivot?.amount),
    })),
    payment_at: String(item.payment_at ?? ''),
    note: item.note,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

const mapBillingFromTransactionDetail = (
  transactionId: string,
  detail: UnitTransactionDetailBillingApiModel | null | undefined,
): UnitBilling | null => {
  const billing = detail?.unit_transaction_billing;
  const summary = detail?.billing_summary;

  if (!billing && !summary) return null;

  return {
    id: String(billing?.id ?? ''),
    company_id: '',
    unit_transaction_id: String(billing?.unit_transaction_id ?? detail?.id ?? transactionId),
    grand_total: toSafeNumber(billing?.grand_total ?? summary?.grand_total),
    total_paid: toSafeNumber(billing?.total_paid ?? summary?.total_paid),
    remaining_payment: toSafeNumber(billing?.remaining_payment ?? summary?.remaining_payment),
    last_payment_at: undefined,
    bca_payment: 0,
    cash_payment: 0,
    bca_payment_2: 0,
    bca_payment_liability: 0,
    cash_payment_liability: 0,
    bca_payment_usd_liability: 0,
    payment_date: String(billing?.payment_date ?? billing?.payment_at ?? ''),
    is_paid: toBool(billing?.is_paid ?? summary?.is_paid),
    created_at: undefined,
    updated_at: undefined,
  };
};

const extractBillingHistoriesFromTransactionDetail = (
  billing: UnitTransactionBillingSnapshotApiModel | null | undefined,
): UnitBillingHistory[] => {
  const rows = Array.isArray(billing?.unit_transaction_billing_histories) ? billing.unit_transaction_billing_histories : [];
  return rows.map(mapBillingHistory).filter((item) => Boolean(item.id || item.payment_at));
};

const extractHistoryRows = (payload: any): UnitBillingHistoryApiModel[] => {
  if (Array.isArray(payload)) return payload as UnitBillingHistoryApiModel[];
  if (Array.isArray(payload?.data)) return payload.data as UnitBillingHistoryApiModel[];
  if (Array.isArray(payload?.data?.data)) return payload.data.data as UnitBillingHistoryApiModel[];
  return [];
};

/**
 * Build the minimal FormData for creating a billing record.
 * New API spec only requires: company_id + unit_transaction_id.
 * DO NOT send grand_total, bca_payment, cash_payment etc — those fields
 * no longer exist in the finance_billings table schema.
 */
const toBillingCreateData = (companyId: string | number, unitTransactionId: string | number): FormData => {
  const form = new FormData();
  form.append('company_id', String(companyId));
  form.append('unit_transaction_id', String(unitTransactionId));
  return form;
};

const getBillingSnapshotFromTransaction = async (unitTransactionId: string): Promise<UnitTransactionDetailBillingApiModel | null> => {
  try {
    const response = await apiClient.get<LaravelApiResponse<UnitTransactionDetailBillingApiModel>>(`/wapi/transaction/unit-transaction/unit-transaction/${unitTransactionId}`);
    return ensureSuccess(response.data) as UnitTransactionDetailBillingApiModel;
  } catch {
    try {
      const response = await apiClient.get<LaravelApiResponse<UnitTransactionDetailBillingApiModel>>(`/wapi/transaction/unit-transaction/${unitTransactionId}`);
      return ensureSuccess(response.data) as UnitTransactionDetailBillingApiModel;
    } catch {
      return null;
    }
  }
};

export const unitBillingService = {
  async checkRightAmount(companyId: string, unitTransactionId: string): Promise<void> {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/check-right-amount`, {
      params: {
        company_id: companyId,
        unit_transaction_id: unitTransactionId,
      },
    });

    ensureSuccess(response.data);
  },

  async getCurrentBilling(unitTransactionId: string): Promise<UnitBilling | null> {
    const billings = await this.getBillings(unitTransactionId);
    if (billings.length === 0) {
      const snapshot = await getBillingSnapshotFromTransaction(unitTransactionId);
      return mapBillingFromTransactionDetail(unitTransactionId, snapshot);
    }

    const sorted = [...billings].sort((a, b) => {
      const idA = Number(a.id ?? 0);
      const idB = Number(b.id ?? 0);
      if (idA !== idB) return idB - idA;

      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    const active = sorted.find((item) => {
      const grand = Number(item.grand_total ?? 0);
      const paid = Number(item.total_paid ?? 0);
      const remaining = Number(item.remaining_payment ?? Math.max(0, grand - paid));
      return !item.is_paid || remaining > 0;
    });

    return active ?? sorted[0] ?? null;
  },

  async getBillings(unitTransactionId: string): Promise<UnitBilling[]> {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
      params: {
        unit_transaction_id: unitTransactionId,
      },
    });

    const payload = ensureSuccess(response.data);

    let mapped: UnitBilling[] = [];

    if (Array.isArray(payload)) {
      mapped = payload.map((item: UnitBillingApiModel) => mapBilling(item));
    } else if (Array.isArray(payload?.data)) {
      mapped = toPaginatedResult(payload, mapBilling).data;
    } else if (Array.isArray(payload?.data?.data)) {
      mapped = toPaginatedResult(payload.data, mapBilling).data;
    }

    const filtered = mapped
      .map((item) => ({
        ...item,
        unit_transaction_id: item.unit_transaction_id || String(unitTransactionId),
      }))
      .filter((item) => String(item.unit_transaction_id) === String(unitTransactionId));

    if (filtered.length > 0) {
      return filtered;
    }

    const snapshot = await getBillingSnapshotFromTransaction(unitTransactionId);
    const detailBilling = mapBillingFromTransactionDetail(unitTransactionId, snapshot);
    return detailBilling ? [detailBilling] : [];
  },

  /**
   * Create billing (v1 compat shim — delegates to the new minimal payload).
   * POST /wapi/transaction/unit-transaction/unit-transaction-billing
   * Required: company_id, unit_transaction_id
   */
  async createBilling(payload: UpsertUnitBillingPayload | CreateUnitBillingPayloadV2): Promise<UnitBilling> {
    const jsonPayload = {
      company_id: (payload as any).company_id,
      unit_transaction_id: (payload as any).unit_transaction_id,
    };
    const response = await apiClient.post<LaravelApiResponse<UnitBillingApiModel>>(basePath, jsonPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = ensureSuccess(response.data);
    return mapBilling(data as UnitBillingApiModel);
  },

  /**
   * Create billing V2 (same endpoint, same minimal payload, JSON format).
   */
  async createBillingV2(payload: CreateUnitBillingPayloadV2): Promise<UnitBilling> {
    const jsonPayload = {
      company_id: payload.company_id,
      unit_transaction_id: payload.unit_transaction_id,
    };
    const response = await apiClient.post<LaravelApiResponse<UnitBillingApiModel>>(basePath, jsonPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = ensureSuccess(response.data);
    return mapBilling(data as UnitBillingApiModel);
  },

  async getBillingHistory(unitTransactionBillingId?: string, unitTransactionId?: string): Promise<UnitBillingHistory[]> {
    const params = {
      unit_transaction_billing_id: unitTransactionBillingId || undefined,
      unit_transaction_id: unitTransactionId || undefined,
      per_page: 100,
      page: 1,
    };

    const firstResponse = await apiClient.get<LaravelApiResponse<any>>(historyBasePath, { params });
    const firstPayload = ensureSuccess(firstResponse.data);
    let rows = extractHistoryRows(firstPayload);

    const lastPage = Number(firstPayload?.last_page ?? firstPayload?.data?.last_page ?? 1);
    if (Number.isFinite(lastPage) && lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, idx) => idx + 2).map((page) =>
          apiClient
            .get<LaravelApiResponse<any>>(historyBasePath, { params: { ...params, page } })
            .then((res) => extractHistoryRows(ensureSuccess(res.data)))
            .catch(() => [] as UnitBillingHistoryApiModel[]),
        ),
      );
      rows = [...rows, ...rest.flat()];
    }

    const mapped = rows.map(mapBillingHistory);
    let filtered = mapped.filter((item) => {
      const byBilling = unitTransactionBillingId ? String(item.unit_transaction_billing_id) === String(unitTransactionBillingId) : false;
      const byTransaction = unitTransactionId ? String(item.unit_transaction_id ?? '') === String(unitTransactionId) : false;

      if (unitTransactionBillingId && unitTransactionId) return byBilling || byTransaction;
      if (unitTransactionBillingId) return byBilling;
      if (unitTransactionId) return byTransaction;
      return true;
    });

    // Fallback: some responses omit nested unit_transaction_billing, so infer by billing IDs under the same transaction.
    if (filtered.length === 0 && unitTransactionId) {
      const relatedBillingIds = new Set((await this.getBillings(unitTransactionId)).map((billing) => String(billing.id)));
      filtered = mapped.filter((item) => relatedBillingIds.has(String(item.unit_transaction_billing_id)));
    }

    const deduped = Array.from(new Map(filtered.map((item) => [`${item.id}:${item.payment_at}:${item.note ?? ''}`, item])).values()).sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    if (deduped.length > 0 || !unitTransactionId) {
      return deduped;
    }

    const snapshot = await getBillingSnapshotFromTransaction(unitTransactionId);
    return extractBillingHistoriesFromTransactionDetail(snapshot?.unit_transaction_billing);
  },

  async createBillingHistory(payload: CreateUnitBillingHistoryPayload): Promise<UnitBillingHistory> {
    const form = new FormData();
    const bcaPaymentAmount = Number(payload.bca_payment_amount ?? 0);
    const cashPaymentAmount = Number(payload.cash_payment_amount ?? 0);
    const bcaPaymentUsdAmount = Number(payload.bca_payment_usd_amount ?? 0);
    const totalPayment = bcaPaymentAmount + cashPaymentAmount + bcaPaymentUsdAmount;

    form.append('unit_transaction_billing_id', String(payload.unit_transaction_billing_id));
    if (bcaPaymentAmount > 0) form.append('bca_payment_amount', String(bcaPaymentAmount));
    if (cashPaymentAmount > 0) form.append('cash_payment_amount', String(cashPaymentAmount));
    if (bcaPaymentUsdAmount > 0) form.append('bca_payment_usd_amount', String(bcaPaymentUsdAmount));

    // Append total payment amount to satisfy backend validation
    form.append('payment', String(totalPayment));
    form.append('payment_amount', String(totalPayment));
    form.append('amount', String(totalPayment));

    if (payload.payment_at) form.append('payment_at', payload.payment_at);
    if (payload.note) form.append('note', payload.note);
    if (payload.cash_id !== undefined && payload.cash_id !== null) {
      form.append('cash_id', String(payload.cash_id));
    }
    if (payload.payment_proof) {
      form.append('payment_proof', payload.payment_proof);
    }

    const response = await apiClient.post<LaravelApiResponse<UnitBillingHistoryApiModel>>(historyBasePath, form);
    const data = ensureSuccess(response.data);
    return mapBillingHistory(data as UnitBillingHistoryApiModel);
  },

  async deleteBillingHistory(id: string | number): Promise<void> {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${historyBasePath}/${id}`);
    ensureSuccess(response.data);
  },

  async getBillingById(id: string): Promise<UnitBilling> {
    const response = await apiClient.get<LaravelApiResponse<UnitBillingApiModel>>(`${basePath}/${id}`);
    const payload = ensureSuccess(response.data);
    return mapBilling(payload as UnitBillingApiModel);
  },

  async updateBilling(id: string, payload: UpsertUnitBillingPayload): Promise<UnitBilling> {
    // PUT only accepts company_id + unit_transaction_id (no payment fields in schema)
    const form = toBillingCreateData(payload.company_id, payload.unit_transaction_id);
    form.append('_method', 'PUT');
    const response = await apiClient.post<LaravelApiResponse<UnitBillingApiModel>>(`${basePath}/${id}`, form);
    const data = ensureSuccess(response.data);
    return mapBilling(data as UnitBillingApiModel);
  },
};
