import { PaginationMeta } from '@/types/pagination.types';
import { TransformedReceiptUnitData } from '@/types/penerimaan-unit.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';

type PurchaseTransactionApiModel = {
  id?: number | string;
  code?: string;
  person?: {
    id?: number | string;
  } | null;
  billing_summary?: {
    is_paid?: boolean;
  } | null;
};

type UnitTransactionItemApiModel = {
  id?: number | string;
  unit_transaction_id?: number | string;
  unit_type_id?: number | string;
};

type UnitTypeApiModel = {
  id?: number | string;
  name?: string;
};

type UnitTransactionItemDetailApiModel = {
  id?: number | string;
  unit_transaction_item_id?: number | string;
  color?: string;
  status?: string;
  machine_number?: string;
  chassis_number?: string;
  in_stock?: boolean | number | string;
};

type LaravelPaginationLike<T> = {
  data?: T[];
  current_page?: number;
  perPage?: number;
  total?: number;
  last_page?: number;
};

export interface ReceiptTableQueryParams {
  companyId: string;
  personId?: string;
  page: number;
  perPage: number;
  search?: string;
}

export interface ReceiptTableResult {
  rows: TransformedReceiptUnitData[];
  meta: PaginationMeta;
}

const purchaseBasePath = '/wapi/transaction/unit-transaction/unit-transaction';
const itemBasePath = '/wapi/transaction/unit-transaction/unit-transaction-item';
const itemDetailBasePath = '/wapi/transaction/unit-transaction/unit-transaction-item-detail';
const unitTypeBasePath = '/wapi/master-data/unit-type';

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringValue = (value: unknown): string => String(value ?? '');

const toBoolValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }
  return false;
};

const extractPaginatedRows = <T>(payload: unknown): LaravelPaginationLike<T> => {
  if (!payload || typeof payload !== 'object') {
    return { data: [], current_page: 1, perPage: 25, total: 0, last_page: 1 };
  }

  const source = payload as LaravelPaginationLike<T> & { data?: unknown };
  if (Array.isArray(source.data)) {
    return source;
  }

  if (source.data && typeof source.data === 'object') {
    const nested = source.data as LaravelPaginationLike<T>;
    if (Array.isArray(nested.data)) {
      return nested;
    }
  }

  return { data: [], current_page: 1, perPage: 25, total: 0, last_page: 1 };
};

const fetchPurchaseTransactions = async (
  params: ReceiptTableQueryParams,
): Promise<{ rows: PurchaseTransactionApiModel[]; meta: PaginationMeta }> => {
  const response = await apiClient.get<LaravelApiResponse<unknown>>(purchaseBasePath, {
    params: {
      sort_order: 'desc',
      type: 'purchase',
      page: params.page,
      perPage: params.perPage,
      search: params.search || undefined,
    },
  });

  const payload = ensureSuccess(response.data);
  const normalized = extractPaginatedRows<PurchaseTransactionApiModel>(payload);

  return {
    rows: normalized.data ?? [],
    meta: {
      currentPage: normalized.current_page ?? 1,
      perPage: normalized.perPage ?? params.perPage,
      total: normalized.total ?? 0,
      lastPage: normalized.last_page ?? 1,
    },
  };
};

const fetchItemsByTransaction = async (unitTransactionId: number): Promise<UnitTransactionItemApiModel[]> => {
  const response = await apiClient.get<LaravelApiResponse<unknown>>(itemBasePath, {
    params: {
      unit_transaction_id: unitTransactionId,
      perPage: 200,
    },
  });

  const payload = ensureSuccess(response.data);
  const normalized = extractPaginatedRows<UnitTransactionItemApiModel>(payload);
  return normalized.data ?? [];
};

const fetchUnitTypeName = async (unitTypeId: number, companyId: string): Promise<string> => {
  const response = await apiClient.get<LaravelApiResponse<UnitTypeApiModel>>(`${unitTypeBasePath}/${unitTypeId}`, {
    params: {
      company_id: companyId,
    },
  });

  const payload = ensureSuccess(response.data);
  return payload?.name ?? '-';
};

const fetchItemDetails = async (unitTransactionItemId: number): Promise<UnitTransactionItemDetailApiModel[]> => {
  const response = await apiClient.get<LaravelApiResponse<unknown>>(itemDetailBasePath, {
    params: {
      unit_transaction_item_id: unitTransactionItemId,
      perPage: 200,
    },
  });

  const payload = ensureSuccess(response.data);
  const normalized = extractPaginatedRows<UnitTransactionItemDetailApiModel>(payload);
  return normalized.data ?? [];
};

export const getReceiptUnitTableRows = async (params: ReceiptTableQueryParams): Promise<ReceiptTableResult> => {
  const purchaseResponse = await fetchPurchaseTransactions({
    ...params,
    page: 1,
    perPage: 500,
  });
  const purchaseRows = purchaseResponse.rows;

  if (purchaseRows.length === 0) {
    return {
      rows: [],
      meta: purchaseResponse.meta,
    };
  }

  const filteredPurchaseRows =
    params.personId && String(params.personId).trim().length > 0
      ? purchaseRows.filter((row) => String(row.person?.id ?? '') === String(params.personId))
      : purchaseRows;

  const purchaseById = new Map<number, PurchaseTransactionApiModel>();
  filteredPurchaseRows.forEach((row) => {
    const id = toNumber(row.id);
    if (id > 0) {
      purchaseById.set(id, row);
    }
  });

  const transactionIds = Array.from(purchaseById.keys());

  const itemResponses = await Promise.all(
    transactionIds.map(async (transactionId) => {
      const items = await fetchItemsByTransaction(transactionId);
      return { transactionId, items };
    }),
  );

  const flatItems = itemResponses.flatMap((entry) => entry.items);
  if (flatItems.length === 0) {
    return {
      rows: [],
      meta: purchaseResponse.meta,
    };
  }

  const unitTypeIds = Array.from(new Set(flatItems.map((item) => toNumber(item.unit_type_id)).filter((id) => id > 0)));
  const itemIds = Array.from(new Set(flatItems.map((item) => toNumber(item.id)).filter((id) => id > 0)));

  const [unitTypePairs, detailPairs] = await Promise.all([
    Promise.all(
      unitTypeIds.map(async (unitTypeId) => ({
        unitTypeId,
        name: await fetchUnitTypeName(unitTypeId, params.companyId),
      })),
    ),
    Promise.all(
      itemIds.map(async (itemId) => ({
        itemId,
        details: await fetchItemDetails(itemId),
      })),
    ),
  ]);

  const unitTypeNameById = new Map<number, string>();
  unitTypePairs.forEach((pair) => unitTypeNameById.set(pair.unitTypeId, pair.name));

  const detailByItemId = new Map<number, UnitTransactionItemDetailApiModel[]>();
  detailPairs.forEach((pair) => detailByItemId.set(pair.itemId, pair.details));

  const transformedRows: TransformedReceiptUnitData[] = [];

  flatItems.forEach((item) => {
    const itemId = toNumber(item.id);
    const unitTransactionId = toNumber(item.unit_transaction_id);
    if (itemId <= 0 || unitTransactionId <= 0) return;

    const purchase = purchaseById.get(unitTransactionId);
    if (!purchase) return;

    const purchaseCode = purchase.code ?? '-';
    const unitTypeName = unitTypeNameById.get(toNumber(item.unit_type_id)) ?? '-';

    const details = detailByItemId.get(itemId) ?? [];
    details.forEach((detail) => {
      const received = toBoolValue(detail.in_stock);

      transformedRows.push({
        id: toNumber(detail.id),
        purchaseCode,
        unitTypeName,
        color: toStringValue(detail.color || '-'),
        machineNumber: toStringValue(detail.machine_number || '-'),
        chassisNumber: toStringValue(detail.chassis_number || '-'),
        status: toStringValue(detail?.status),
        in_stock: toBoolValue(detail.in_stock),
        unitTransactionId,
        received,
      });
    });
  });

  const normalizedSearch = String(params.search ?? '')
    .trim()
    .toLowerCase();

  const searchedRows =
    normalizedSearch.length === 0
      ? transformedRows
      : transformedRows.filter((item) =>
        [item.purchaseCode, item.unitTypeName, item.color, item.machineNumber, item.chassisNumber, item.status]
          .map((value) => String(value ?? '').toLowerCase())
          .some((value) => value.includes(normalizedSearch)),
      );

  const page = Math.max(1, params.page);
  const perPage = Math.max(1, params.perPage);
  const total = searchedRows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, lastPage);
  const startIndex = (safePage - 1) * perPage;
  const pagedRows = searchedRows.slice(startIndex, startIndex + perPage);

  return {
    rows: pagedRows,
    meta: {
      currentPage: safePage,
      perPage,
      total,
      lastPage,
    },
  };
};
