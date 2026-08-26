import { PaginationParams } from '@/types/pagination.types';
import {
  UnitTransaction,
  UnitTransactionDetail,
  UnitTransactionResponse,
  UnitTransactionTypeDetail,
  UnitTransactionTypeDetailListResponse,
} from '@/types/unit-transaction.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

type UnitTransactionApiModel = {
  id?: number | string;
  person_id?: number | string;
  warehouse_id?: number | string;
  code?: string;
  created_at?: string;
  stock_state?: string;
  max_capacity?: number | string;
  document_template_id?: number | string | null;
  document_template?: { id?: number | string; uuid?: string } | null;
  unit_transaction_bruto_total?: string | number;
  transaction_bruto_total?: string | number;
  transaction_dpp_total?: string | number;
  transaction_ppn_total?: string | number;
  transaction_bbn_total?: string | number;
  transaction_other_fee?: string | number;
  expedition_fee_total?: string | number;
  has_returned_data?: boolean | string;
  type?: string;
  person?: {
    id?: number | string;
    name?: string;
  };
  warehouse?: {
    id?: number | string;
    name?: string;
  };
  unit_transaction_item_total_dpp?: string | number;
  unit_transaction_item_total_ppn?: string | number;
  unit_transaction_item_bruto_total?: string | number;
  total_operational_fee?: string | number;
  unit_transaction_items?: Array<{
    id?: number | string;
    qty_total?: number | string;
    price?: number | string;
    hpp_total_price?: number | string;
    dpp_total_price?: number | string;
    ppn_total_price?: number | string;
    bbn_price?: number | string;
    expedition_fee?: number | string;
    other_fee?: number | string;
    unit_type?: { name?: string };
  }>;
  unit_transaction_billing?: {
    id?: number | string;
    unit_transaction_id?: number | string;
    grand_total?: number | string;
    total_paid?: number | string;
    remaining_payment?: number | string;
    is_paid?: boolean;
    payment_at?: string | null;
    unit_transaction_billing_histories?: Array<{
      id?: number | string;
      unit_transaction_billing_id?: number | string;
      payment_proof?: string | null;
      bca_payment_amount?: number | string;
      cash_payment_amount?: number | string;
      bca_payment_usd_amount?: number | string;
      payment_at?: string;
      note?: string;
      created_at?: string;
      updated_at?: string;
    }>;
  } | null;
  billing_summary?: {
    grand_total?: number | string;
    total_cash_payment?: number | string;
    total_bca_payment?: number | string;
    total_paid?: number | string;
    remaining_payment?: number | string;
    is_paid?: boolean;
  } | null;
  has_refund_transaction?: boolean;
  warehouse_activity?: {
    id?: number | string;
    uuid?: string;
    person_id?: number | string;
    cash_id?: number | string;
    warehouse_id?: number | string;
    unit_transaction_id?: number | string;
    sparepart_transaction_id?: number | string;
    activity_number?: string;
    activity_type?: string;
    type?: string;
    activity_date?: string;
    description?: string;
    state?: string;
  };
  is_unit_type_detail_valid?: boolean | string | number;
};

type UnitTransactionItemListApiModel = {
  id?: number | string;
  unit_transaction_id?: number | string;
  qty_total?: number | string;
  price?: number | string;
  bbn_price?: number | string;
  expedition_fee?: number | string;
  other_fee?: number | string;
  dpp_per_unit_price?: number | string;
  ppn_per_unit_price?: number | string;
  dpp_total_price?: number | string;
  ppn_total_price?: number | string;
  dpp_tax_rate?: number | string;
  ppn_tax_rate?: number | string;
  created_at?: string;
  has_returned_data?: boolean | string;
  unit_transaction?: {
    id?: number | string;
    person_id?: number | string;
    warehouse_id?: number | string;
    code?: string;
    stock_state?: string;
    expedition_fee_total?: string | number;
    total_operational_fee?: string | number;
    created_at?: string;
    document_template_id?: number | string | null;
    person?: {
      id?: number | string;
      name?: string;
    };
    warehouse?: {
      id?: number | string;
      name?: string;
    };
  };
};

type UnitTransactionTypeDetailApiModel = {
  id?: number | string;
  unit_transaction_item_id?: number | string;
  warehouse_sub_block_id?: number | string | null;
  uuid?: string;
  color?: string | null;
  machine_number?: string | null;
  chassis_number?: string | null;
  in_stock?: boolean | number | string;
  is_forecast?: boolean | number | string;
  status?: string | null;
  stock_state?: string | null;
  is_sold_unit?: boolean | number | string;
  created_at?: string;
  updated_at?: string;
  unit_transaction_item?: {
    id?: number | string;
    unit_transaction_id?: number | string;
    unit_type_id?: number | string;
    price?: number | string;
    price_usd?: number | string;
    price_per_unit_usd?: number | string;
    unit_type?: {
      id?: number | string;
      code?: string;
      name?: string;
      unit_type?: string | null;
      unit_model?: string | null;
      buy_price?: number | string;
      sell_price?: number | string;
    } | null;
  } | null;
  warehouse_sub_block?: {
    id?: number | string;
    name?: string;
  } | null;
};

const basePath = '/wapi/transaction/unit-transaction/unit-transaction';
const fallbackBasePath = '/wapi/transaction/unit-transaction';
const strictBasePath = '/wapi/transaction/unit-transaction/unit-transaction';
const itemBasePath = '/wapi/transaction/unit-transaction-item';
const itemLegacyBasePath = '/wapi/transaction/unit-transaction/unit-transaction-item';

const listBasePaths = [basePath, fallbackBasePath, itemBasePath, itemLegacyBasePath];

const withBaseFallback = async <T>(
  primary: (activeBasePath: string) => Promise<T>,
  fallback: (activeBasePath: string) => Promise<T>,
): Promise<T> => {
  try {
    return await primary(basePath);
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return fallback(fallbackBasePath);
  }
};

const toNumber = (value: string | number | undefined): number => Number(value ?? 0);

const toBoolean = (value: boolean | number | string | undefined): boolean =>
  value === true || value === 1 || value === '1' || value === 'true';

const mapUnitTransactionTypeDetail = (
  item: UnitTransactionTypeDetailApiModel,
): UnitTransactionTypeDetail => ({
  id: String(item.id ?? ''),
  unit_transaction_item_id: String(item.unit_transaction_item_id ?? ''),
  warehouse_sub_block_id:
    item.warehouse_sub_block_id === null || item.warehouse_sub_block_id === undefined
      ? null
      : String(item.warehouse_sub_block_id),
  uuid: item.uuid ?? '',
  color: item.color ?? null,
  machine_number: item.machine_number ?? null,
  chassis_number: item.chassis_number ?? null,
  in_stock: toBoolean(item.in_stock),
  is_forecast: toBoolean(item.is_forecast),
  status: item.status ?? null,
  stock_state: item.stock_state ?? null,
  is_sold_unit: toBoolean(item.is_sold_unit),
  created_at: item.created_at,
  updated_at: item.updated_at,
  unit_transaction_item: item.unit_transaction_item
    ? {
        id: String(item.unit_transaction_item.id ?? ''),
        unit_transaction_id: String(item.unit_transaction_item.unit_transaction_id ?? ''),
        unit_type_id: String(item.unit_transaction_item.unit_type_id ?? ''),
        price: item.unit_transaction_item.price !== undefined ? toNumber(item.unit_transaction_item.price) : undefined,
        price_usd: item.unit_transaction_item.price_usd !== undefined ? toNumber(item.unit_transaction_item.price_usd) : undefined,
        price_per_unit_usd: item.unit_transaction_item.price_per_unit_usd !== undefined ? toNumber(item.unit_transaction_item.price_per_unit_usd) : undefined,
        unit_type: item.unit_transaction_item.unit_type
          ? {
              id: String(item.unit_transaction_item.unit_type.id ?? ''),
              code: item.unit_transaction_item.unit_type.code ?? '',
              name: item.unit_transaction_item.unit_type.name ?? '',
              unit_type: item.unit_transaction_item.unit_type.unit_type ?? null,
              unit_model: item.unit_transaction_item.unit_type.unit_model ?? null,
              buy_price: toNumber(item.unit_transaction_item.unit_type.buy_price),
              sell_price: toNumber(item.unit_transaction_item.unit_type.sell_price),
            }
          : null,
      }
    : null,
  warehouse_sub_block: item.warehouse_sub_block
    ? {
        id: String(item.warehouse_sub_block.id ?? ''),
        name: item.warehouse_sub_block.name,
      }
    : null,
});

const mapBillingHistoryRow = (row: NonNullable<NonNullable<UnitTransactionApiModel['unit_transaction_billing']>['unit_transaction_billing_histories']>[number]) => ({
  id: String(row.id ?? ''),
  unit_transaction_billing_id: String(row.unit_transaction_billing_id ?? ''),
  payment_proof: row.payment_proof ?? null,
  bca_payment_amount: toNumber(row.bca_payment_amount ?? (row as any).bca_payment),
  cash_payment_amount: toNumber(row.cash_payment_amount ?? (row as any).cash_payment),
  bca_payment_usd_amount: toNumber(row.bca_payment_usd_amount ?? (row as any).bca_payment_2),
  payment_at: row.payment_at ?? '',
  note: row.note,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const readErrorMessage = (error: any): string => {
  const details = error?.details ?? error?.response?.data?.errors;

  if (typeof details === 'string' && details.trim()) {
    return details.toLowerCase();
  }

  if (details && typeof details === 'object') {
    const text = Object.values(details)
      .flatMap((value: any) => (Array.isArray(value) ? value : [value]))
      .map((value: any) => String(value))
      .join(' ')
      .trim();
    if (text) return text.toLowerCase();
  }

  const raw = error?.response?.data?.message ?? error?.message;
  return String(raw ?? '').toLowerCase();
};

const shouldFallback = (error: any): boolean => {
  const statusCode = error?.statusCode ?? error?.response?.status;
  const message = readErrorMessage(error);
  const hasKnownNullRelationBug =
    message.includes('attempt to read property') &&
    (message.includes('"is_paid"') || message.includes("'is_paid'") || message.includes('is_paid'));

  return statusCode === 404 || statusCode === 405 || statusCode === 500 || hasKnownNullRelationBug;
};

const mapUnitTransaction = (item: UnitTransactionApiModel): UnitTransaction => ({
  id: String(item.id ?? ''),
  code: item.code ?? '-',
  created_at: item.created_at ?? '',
  supplier: item.person?.name ?? '-',
  warehouse: item.warehouse?.name ?? '-',
  transaction_bruto_total: toNumber(item.transaction_bruto_total),
  transaction_dpp_total: toNumber(item.transaction_dpp_total),
  transaction_ppn_total: toNumber(item.transaction_ppn_total),
  transaction_bbn_total: toNumber(item.transaction_bbn_total),
  transaction_other_fee: toNumber(item.transaction_other_fee),
  expedition_fee_total: toNumber(item.expedition_fee_total),
  total_operational_fee: toNumber(item.total_operational_fee),
  stock_state: item.stock_state ?? '-',
  unit_transaction_billing: item.unit_transaction_billing
    ? {
      id: String(item.unit_transaction_billing.id ?? ''),
      unit_transaction_id: String(item.unit_transaction_billing.unit_transaction_id ?? item.id ?? ''),
      grand_total: toNumber(item.unit_transaction_billing.grand_total),
      total_paid: toNumber(item.unit_transaction_billing.total_paid),
      remaining_payment: toNumber(item.unit_transaction_billing.remaining_payment),
      is_paid: Boolean(item.unit_transaction_billing?.is_paid),
      payment_at: item.unit_transaction_billing.payment_at ?? null,
      unit_transaction_billing_histories: (item.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map(mapBillingHistoryRow),
    }
    : null,
  isPaid: Boolean(item.unit_transaction_billing?.is_paid || item.billing_summary?.is_paid),
  paymentAt: item.unit_transaction_billing?.payment_at ?? null,
  isRefunded: item?.has_returned_data ?? null,
  remainingPayment: toNumber(item.billing_summary?.remaining_payment),
  isUnitTypeDetailValid: item.is_unit_type_detail_valid === true || item.is_unit_type_detail_valid === 1 || String(item.is_unit_type_detail_valid) === 'true',
  billing_summary: item.billing_summary
    ? {
      grand_total: toNumber(item.billing_summary.grand_total),
      total_cash_payment: toNumber(item.billing_summary.total_cash_payment),
      total_bca_payment: toNumber(item.billing_summary.total_bca_payment),
      total_paid: toNumber(item.billing_summary.total_paid),
      remaining_payment: toNumber(item.billing_summary.remaining_payment),
      is_paid: Boolean(item.billing_summary?.is_paid),
    }
    : null,
  documentTemplateId: item.document_template_id != null ? String(item.document_template_id) : item.document_template?.id != null ? String(item.document_template.id) : item.document_template?.uuid ?? null,
});

const buildUnitTransactionFromRows = (rows: UnitTransactionItemListApiModel[]): UnitTransaction[] => {
  const grouped = new Map<string, UnitTransaction>();

  rows.forEach((row) => {
    const transactionId = String(row.unit_transaction_id ?? row.unit_transaction?.id ?? row.id ?? '');
    if (!transactionId) return;

    const qty = toNumber(row.qty_total || 0);
    const brutoPerUnit = toNumber(row.price);
    const dppPerUnit = toNumber(row.dpp_per_unit_price);
    const ppnPerUnit = toNumber(row.ppn_per_unit_price);
    const dppFallback = toNumber(row.dpp_total_price);
    const ppnFallback = toNumber(row.ppn_total_price);
    const bbnPerUnit = toNumber(row.bbn_price);
    const expeditionFee = toNumber(row.expedition_fee);
    const otherFee = toNumber(row.other_fee);

    const transactionBruto = brutoPerUnit * qty;
    const transactionDpp = dppPerUnit > 0 ? dppPerUnit * qty : dppFallback;
    const transactionPpn = ppnPerUnit > 0 ? ppnPerUnit * qty : ppnFallback;
    const transactionBbn = bbnPerUnit * qty;
    const transactionExpedition = expeditionFee * qty;

    const existing = grouped.get(transactionId);
    if (!existing) {
      const personId = row.unit_transaction?.person_id;
      const warehouseId = row.unit_transaction?.warehouse_id;

      grouped.set(transactionId, {
        id: transactionId,
        code: row.unit_transaction?.code ?? '-',
        created_at: row.unit_transaction?.created_at ?? row.created_at ?? '',
        supplier: row.unit_transaction?.person?.name ?? (personId ? `Supplier #${personId}` : '-'),
        warehouse: row.unit_transaction?.warehouse?.name ?? (warehouseId ? `Warehouse #${warehouseId}` : '-'),
        transaction_bruto_total: transactionBruto,
        transaction_dpp_total: transactionDpp,
        transaction_ppn_total: transactionPpn,
        transaction_bbn_total: transactionBbn,
        transaction_other_fee: otherFee,
        expedition_fee_total: toNumber(row.unit_transaction?.expedition_fee_total) || transactionExpedition,
        total_operational_fee: toNumber(row.unit_transaction?.total_operational_fee),
        stock_state: row.unit_transaction?.stock_state ?? '-',
        unit_transaction_billing: null,
        isPaid: false,
        paymentAt: null,
        isRefunded: row?.has_returned_data ?? false,
        remainingPayment: 0,
        documentTemplateId: row.unit_transaction?.document_template_id != null ? String(row.unit_transaction.document_template_id) : null,
      });
      return;
    }

    existing.transaction_bruto_total += transactionBruto;
    existing.transaction_dpp_total += transactionDpp;
    existing.transaction_ppn_total += transactionPpn;
    existing.transaction_bbn_total += transactionBbn;
    existing.transaction_other_fee += otherFee;
    existing.expedition_fee_total += transactionExpedition;
    if (existing.stock_state === '-' && row.unit_transaction?.stock_state) {
      existing.stock_state = row.unit_transaction.stock_state;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });
};

const mapUnitTransactionsFromItems = (
  rows: UnitTransactionItemListApiModel[],
  params: { page?: number; perPage?: number; search?: string },
): UnitTransactionResponse => {
  const allTransactions = buildUnitTransactionFromRows(rows);

  const filtered = allTransactions;

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;
  const startIndex = (page - 1) * perPage;
  const data = filtered.slice(startIndex, startIndex + perPage);
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return {
    data,
    meta: {
      currentPage: page,
      perPage,
      total,
      lastPage,
    },
  };
};

const fetchAllFallbackItemRows = async (
  activePath: string,
  params: { search?: string },
): Promise<UnitTransactionItemListApiModel[]> => {
  const perPage = 200;
  const requestBaseParams = {
    type: 'purchase',
    sort_order: 'desc',
    search: params.search || undefined,
    per_page: perPage,
  };

  const firstResponse = await apiClient.get<LaravelApiResponse<any>>(activePath, {
    params: {
      ...requestBaseParams,
      page: 1,
    },
  });
  const firstPayload = ensureSuccess(firstResponse.data);
  const firstRows: UnitTransactionItemListApiModel[] = Array.isArray(firstPayload?.data) ? firstPayload.data : [];

  const lastPage = Number(firstPayload?.last_page ?? 1);
  if (!Number.isFinite(lastPage) || lastPage <= 1) {
    return firstRows;
  }

  const pageRequests: Array<Promise<UnitTransactionItemListApiModel[]>> = [];
  for (let page = 2; page <= lastPage; page += 1) {
    pageRequests.push(
      apiClient
        .get<LaravelApiResponse<any>>(activePath, {
          params: {
            ...requestBaseParams,
            page,
          },
        })
        .then((response) => {
          const payload = ensureSuccess(response.data);
          return Array.isArray(payload?.data) ? (payload.data as UnitTransactionItemListApiModel[]) : [];
        })
        .catch(() => []),
    );
  }

  const restRows = await Promise.all(pageRequests);
  return [...firstRows, ...restRows.flat()];
};

const enrichTransactionsFromDetail = async (items: UnitTransaction[]): Promise<UnitTransaction[]> => {
  const enriched = await Promise.all(
    items.map(async (item) => {
      try {
        const payload = await withBaseFallback(
          async (activeBasePath) => {
            const response = await apiClient.get<LaravelApiResponse<UnitTransactionApiModel>>(`${activeBasePath}/${item.id}`);
            return ensureSuccess(response.data);
          },
          async (activeBasePath) => {
            const response = await apiClient.get<LaravelApiResponse<UnitTransactionApiModel>>(`${activeBasePath}/${item.id}`);
            return ensureSuccess(response.data);
          },
        );

        const detailPayload =
          ((payload as any)?.data ? ((payload as any).data as UnitTransactionApiModel) : (payload as UnitTransactionApiModel)) ??
          ({} as UnitTransactionApiModel);

        const supplierName = detailPayload.person?.name ?? (detailPayload.person_id ? `Supplier #${detailPayload.person_id}` : item.supplier);
        const warehouseName = detailPayload.warehouse?.name ?? (detailPayload.warehouse_id ? `Warehouse #${detailPayload.warehouse_id}` : item.warehouse);

        return {
          ...item,
          supplier: supplierName,
          warehouse: warehouseName,
          stock_state: detailPayload.stock_state ?? item.stock_state,
          documentTemplateId: detailPayload.document_template_id != null ? String(detailPayload.document_template_id) : detailPayload.document_template?.id != null ? String(detailPayload.document_template.id) : detailPayload.document_template?.uuid ?? null,
        };
      } catch {
        return item;
      }
    }),
  );

  return enriched;
};

const mapUnitTransactionDetail = (item: UnitTransactionApiModel): UnitTransactionDetail => {
  const itemRows = item.unit_transaction_items ?? [];

  const totalsFromItems = itemRows.reduce(
    (acc, row) => {
      const qty = toNumber(row.qty_total);
      const hpp = toNumber(row.hpp_total_price);
      const dpp = toNumber(row.dpp_total_price);
      const ppn = toNumber(row.ppn_total_price);

      const hppFallback = toNumber(row.price) * qty;
      const itemBruto = hpp + ppn + toNumber(row.bbn_price) + toNumber(row.expedition_fee) + toNumber(row.other_fee);

      return {
        hpp: acc.hpp + (hpp > 0 ? hpp : hppFallback),
        dpp: acc.dpp + dpp,
        ppn: acc.ppn + ppn,
        bruto: acc.bruto + (itemBruto > 0 ? itemBruto : hppFallback),
      };
    },
    { hpp: 0, dpp: 0, ppn: 0, bruto: 0 },
  );

  const mainBruto =
    toNumber(item.unit_transaction_bruto_total ?? item.unit_transaction_item_bruto_total ?? item.transaction_bruto_total) || totalsFromItems.bruto;
  const itemBruto =
    toNumber(item.unit_transaction_item_bruto_total ?? item.unit_transaction_bruto_total ?? item.transaction_bruto_total) || totalsFromItems.bruto;
  const itemHpp = totalsFromItems.hpp;
  const itemDpp = totalsFromItems.dpp;
  const itemPpn = totalsFromItems.ppn;

  return {
    id: String(item.id ?? ''),
    code: item.code ?? '-',
    created_at: item.created_at ?? '',
    stock_state: item.stock_state ?? '-',
    max_capacity: toNumber(item.max_capacity),
    person: {
      id: String(item.person?.id ?? item.person_id ?? ''),
      name: item.person?.name ?? '-',
    },
    warehouse: {
      id: String(item.warehouse?.id ?? item.warehouse_id ?? ''),
      name: item.warehouse?.name ?? '-',
    },
    unit_type_name: item.unit_transaction_items?.[0]?.unit_type?.name ?? '-',
    type: item?.type ?? '-',
    pivot: { unit_transaction_item_detail_id: 0 },
    unit_transaction_bruto_total: mainBruto,
    unit_transaction_item_total_hpp: itemHpp,
    unit_transaction_item_total_dpp: itemDpp || toNumber(item.unit_transaction_item_total_dpp ?? item.transaction_dpp_total),
    unit_transaction_item_total_ppn: itemPpn || toNumber(item.unit_transaction_item_total_ppn ?? item.transaction_ppn_total),
    unit_transaction_item_bruto_total: itemBruto,
    transaction_bbn_total: toNumber(item.transaction_bbn_total),
    transaction_other_fee: toNumber(item.transaction_other_fee),
    expedition_fee_total: toNumber(item.expedition_fee_total),
    total_operational_fee: toNumber(item.total_operational_fee),
    billing_summary: item.billing_summary
      ? {
        grand_total: toNumber(item.billing_summary.grand_total),
        total_cash_payment: toNumber(item.billing_summary.total_cash_payment),
        total_bca_payment: toNumber(item.billing_summary.total_bca_payment),
        total_paid: toNumber(item.billing_summary.total_paid),
        remaining_payment: toNumber(item.billing_summary.remaining_payment),
        is_paid: Boolean(item.billing_summary?.is_paid),
      }
      : null,
    unit_transaction_billing: item.unit_transaction_billing
      ? {
        id: String(item.unit_transaction_billing.id ?? ''),
        unit_transaction_id: String(item.unit_transaction_billing.unit_transaction_id ?? item.id ?? ''),
        grand_total: toNumber(item.unit_transaction_billing.grand_total),
        total_paid: toNumber(item.unit_transaction_billing.total_paid),
        remaining_payment: toNumber(item.unit_transaction_billing.remaining_payment),
        is_paid: Boolean(item.unit_transaction_billing?.is_paid),
        payment_at: item.unit_transaction_billing.payment_at ?? null,
        unit_transaction_billing_histories: (item.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map(mapBillingHistoryRow),
      }
      : null,
    has_refund_transaction: Boolean(item.has_refund_transaction),
    warehouse_activity: item.warehouse_activity
      ? {
        id: toNumber(item.warehouse_activity.id),
        uuid: item.warehouse_activity.uuid ?? '',
        person_id: toNumber(item.warehouse_activity.person_id),
        cash_id: item.warehouse_activity.cash_id ? toNumber(item.warehouse_activity.cash_id) : null,
        warehouse_id: toNumber(item.warehouse_activity.warehouse_id),
        unit_transaction_id: item.warehouse_activity.unit_transaction_id ? toNumber(item.warehouse_activity.unit_transaction_id) : null,
        sparepart_transaction_id: item.warehouse_activity.sparepart_transaction_id ? toNumber(item.warehouse_activity.sparepart_transaction_id) : null,
        activity_number: item.warehouse_activity.activity_number ?? '',
        activity_type: item.warehouse_activity.activity_type ?? '',
        type: item.warehouse_activity.type ?? 'unit-type',
        activity_date: item.warehouse_activity.activity_date ?? '',
        description: item.warehouse_activity.description ?? null,
        state: item.warehouse_activity.state ?? '',
      }
      : null,
    unit_transaction_items: item.unit_transaction_items,
    isUnitTypeDetailValid: item.is_unit_type_detail_valid === true || item.is_unit_type_detail_valid === 1 || String(item.is_unit_type_detail_valid) === 'true',
    documentTemplateId: item.document_template_id != null ? String(item.document_template_id) : item.document_template?.id != null ? String(item.document_template.id) : item.document_template?.uuid ?? null,
  };
};

export const unitTransactionService = {
  async updateDocumentTemplate(id: string, documentTemplateId: string | number | null): Promise<UnitTransactionDetail> {
    const body = new FormData();
    body.append('_method', 'PUT');
    body.append('document_template_id', documentTemplateId == null || documentTemplateId === '' ? '' : String(documentTemplateId));
    const response = await apiClient.post<LaravelApiResponse<UnitTransactionApiModel>>(`${strictBasePath}/${id}`, body);
    return mapUnitTransactionDetail(ensureSuccess(response.data));
  },

  async getUnitTransactions(params: PaginationParams & { company_id?: string | number; status?: string; start_date?: string | null; end_date?: string | null } = {}): Promise<UnitTransactionResponse> {
    const requestParams = {
      company_id: params.company_id,
      page: params.page ?? 1,
      per_page: params.perPage ?? 10,
      search: params.search || undefined,
      status: params.status || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      sort_order: 'desc',
      type: 'purchase',
    };

    for (const path of listBasePaths) {
      try {
        const response = await apiClient.get<LaravelApiResponse<any>>(path, { params: requestParams });
        const payload = ensureSuccess(response.data);

        // `/unit-transaction-item` returns line-items, so we aggregate by transaction.
        if (path.includes('unit-transaction-item')) {
          const rows = await fetchAllFallbackItemRows(path, { search: params.search });
          const normalized = mapUnitTransactionsFromItems(rows, {
            page: params.page,
            perPage: params.perPage,
            search: params.search,
          });
          // Locally filter by status if using fallback, because API might not have filtered it
          let dataToEnrich = normalized.data;
          if (params.status && params.status !== 'All') {
            dataToEnrich = dataToEnrich.filter(item => item.stock_state === params.status);
          }
          const enrichedData = await enrichTransactionsFromDetail(dataToEnrich);
          return {
            ...normalized,
            data: enrichedData,
          };
        }

        let paginatedResult = toPaginatedResult(payload, mapUnitTransaction);
        if (params.status && params.status !== 'All') {
          const filteredData = paginatedResult.data.filter(item => item.stock_state === params.status);
          paginatedResult = { ...paginatedResult, data: filteredData };
        }
        return paginatedResult;
      } catch (error) {
        if (!shouldFallback(error)) throw error;
      }
    }

    return {
      data: [],
      meta: {
        currentPage: 1,
        perPage: params.perPage ?? 10,
        total: 0,
        lastPage: 1,
      },
    };
  },

  async getUnitTransactionDetail(id: string, companyId?: string | number): Promise<UnitTransactionDetail> {
    const response = await apiClient.get<LaravelApiResponse<UnitTransactionApiModel>>(`${strictBasePath}/${id}`, {
      params: companyId ? { company_id: companyId } : undefined,
    });
    const payload = ensureSuccess(response.data);

    const detailPayload = ((payload as any)?.data ? ((payload as any).data as UnitTransactionApiModel) : (payload as UnitTransactionApiModel)) ?? ({} as UnitTransactionApiModel);
    return mapUnitTransactionDetail(detailPayload);
  },

  async getUnitTransactionTypeDetails(
    id: string,
    params: PaginationParams = {},
  ): Promise<UnitTransactionTypeDetailListResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(
      `${strictBasePath}/${id}/get-unit-type-details`,
      {
        params: {
          page: params.page ?? 1,
          per_page: params.perPage ?? 10,
        },
      },
    );
    const payload = ensureSuccess(response.data);

    if (Array.isArray(payload)) {
      return {
        data: payload.map(mapUnitTransactionTypeDetail),
        meta: {
          currentPage: 1,
          perPage: payload.length || params.perPage || 10,
          total: payload.length,
          lastPage: 1,
        },
      };
    }

    return toPaginatedResult(payload, mapUnitTransactionTypeDetail);
  },

  async updateUnitTransactionState(
    id: string,
    statePayload:
      | string
      | {
        stockState?: string;
        unitTransactionDetails?: Array<string | number>;
        cashId?: string | number;
        description?: string;
      },
  ): Promise<UnitTransactionDetail> {
    const normalizedStockState = typeof statePayload === 'string' ? statePayload : statePayload.stockState ?? '';
    const normalizedDetails =
      typeof statePayload === 'string'
        ? []
        : (statePayload.unitTransactionDetails ?? []).map((item) => String(item)).filter((item) => item.length > 0);
    const normalizedCashId = typeof statePayload === 'string' ? '' : String(statePayload.cashId ?? '').trim();
    const normalizedDescription = typeof statePayload === 'string' ? '' : String(statePayload.description ?? '').trim();

    const body = new URLSearchParams();
    if (normalizedStockState) body.append('stock_state', normalizedStockState);
    if (normalizedCashId) body.append('cash_id', normalizedCashId);
    if (normalizedDescription) body.append('description', normalizedDescription);
    if (normalizedDetails.length > 0) {
      normalizedDetails.forEach((item) => body.append('unit_transaction_details[]', item));
      body.append('unit_transaction_details', JSON.stringify(normalizedDetails));
    }

    const response = await apiClient.put<LaravelApiResponse<UnitTransactionApiModel | { data?: UnitTransactionApiModel }>>(
      `${strictBasePath}/${id}/update-state`,
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    const responsePayload = ensureSuccess(response.data);

    const detailPayload =
      ((responsePayload as any)?.data ? ((responsePayload as any).data as UnitTransactionApiModel) : (responsePayload as UnitTransactionApiModel)) ??
      ({} as UnitTransactionApiModel);
    return mapUnitTransactionDetail(detailPayload);
  },

  /**
   * POST transaction-adjustment (Refund Pembelian)
   * Endpoint: POST /wapi/transaction/unit-transaction/unit-transaction/{id}/transaction-adjustment
   * Body (urlencoded): cash_id, amount, description
   */
  async submitTransactionAdjustment(
    id: string,
    payload: { cashId: string; amount: number; description: string; itemDetailIds: string[] },
  ): Promise<void> {
    const body = new URLSearchParams();
    body.append('cash_id', payload.cashId);
    body.append('amount', String(payload.amount));
    body.append('description', payload.description);

    if (payload.itemDetailIds && payload.itemDetailIds.length > 0) {
      payload.itemDetailIds.forEach((detailId) => {
        body.append('unit_transaction_item_details_ids[]', detailId);
      });
    }

    await apiClient.post(`${strictBasePath}/${id}/transaction-adjustment`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  /**
   * GET transaction-adjustment list (History Refund)
   * Endpoint: GET /wapi/transaction/unit-transaction/unit-transaction/{id}/transaction-adjustment
   */
  async getTransactionAdjustments(id: string, companyId?: string | number): Promise<TransactionAdjustmentApiItem[]> {
    try {
      const response = await apiClient.get<LaravelApiResponse<any>>(`${strictBasePath}/${id}/transaction-adjustment`, {
        params: companyId ? { company_id: companyId } : undefined,
      });
      const payload = ensureSuccess(response.data);
      const rows: any[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      return rows.map((row: any) => ({
        id: String(row.id ?? ''),
        unit_transaction_id: String(row.unit_transaction_id ?? id),
        cash_id: row.cash_id ? String(row.cash_id) : undefined,
        amount: Number(row.amount ?? 0),
        description: row.description ?? '-',
        date: row.date ?? row.created_at ?? '',
        created_at: row.created_at ?? '',
      }));
    } catch {
      return [];
    }
  },

  async searchUnitVehicleDetails(params: {
    type?: 'purchase' | 'sales';
    search_of: string;
    search: string;
    page?: number;
    per_page?: number;
  }) {
    const response = await apiClient.get<LaravelApiResponse<any>>(
      `/wapi/transaction/unit-transaction/search-unit-transaction-item-details`,
      { params }
    );
    return ensureSuccess(response.data);
  },
};

export type TransactionAdjustmentApiItem = {
  id: string;
  unit_transaction_id: string;
  cash_id?: string;
  amount: number;
  description: string;
  date?: string;
  created_at?: string;
};
