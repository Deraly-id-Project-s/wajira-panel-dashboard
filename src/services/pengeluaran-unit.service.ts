import { z } from 'zod';
import {
  DispatchUnitTableParams,
  DispatchUnitTableResult,
  DispatchUnitTableRow,
  PengeluaranUnit,
  PengeluaranUnitListParams,
  PengeluaranUnitListResult,
  PersonOption,
  SavePengeluaranUnitPayload,
  WarehouseOption,
} from '@/types/pengeluaran-unit.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';
import {
  pengeluaranUnitListDataSchema,
  pengeluaranUnitSchema,
  savePengeluaranUnitSchema,
} from '@/schemas/pengeluaran-unit.schema';

const basePath = '/wapi/warehouse/warehouse-activity';
const warehouseDataPath = '/wapi/warehouse/warehouse-data';
const customerPath = '/wapi/master-data/customer';
const salesTransactionPath = '/wapi/transaction/unit-transaction/unit-transaction';
const salesTransactionLegacyPath = '/wapi/transaction/unit-transaction';
const unitTransactionItemPath = '/wapi/transaction/unit-transaction/unit-transaction-item';
const unitTransactionItemLegacyPath = '/wapi/transaction/unit-transaction-item';
const unitTransactionItemDetailPath = '/wapi/transaction/unit-transaction/unit-transaction-item-detail';
const unitTransactionItemDetailLegacyPath = '/wapi/transaction/unit-transaction-item-detail';
const unitTypePath = '/wapi/master-data/unit-type';

type SalesTransactionInfoApiModel = {
  id?: number | string;
  code?: string;
  stock_state?: string;
  warehouse_id?: number | string;
};

type SalesUnitItemApiModel = {
  id?: number | string;
  unit_transaction_id?: number | string;
  unit_type_id?: number | string;
  warehouse_id?: number | string;
  unit_transaction?: SalesTransactionInfoApiModel;
  code?: string;
  stock_state?: string;
};

type SalesItemDetailApiModel = {
  id?: number | string;
  color?: string;
  machine_number?: string;
  chassis_number?: string;
  in_stock?: boolean | number | string | null;
};

type SalesItemDetailResponseApiModel = {
  id?: number | string;
  unit_type_id?: number | string;
  unit_transaction?: SalesTransactionInfoApiModel;
  unit_transaction_item_details?: SalesItemDetailApiModel[];
  unit_transaction_item_sales?: Array<{
    id?: number | string;
    unit_transaction_item_detail_id?: number | string;
  }>;
};

type UnitTypeApiModel = {
  id?: number | string;
  name?: string;
};

type PaginationLike<T> = {
  data?: T[];
  current_page?: number;
  perPage?: number;
  total?: number;
  last_page?: number;
};

const shouldFallback = (error: unknown): boolean => {
  const statusCode = (error as { statusCode?: number; response?: { status?: number } })?.statusCode ?? (error as { response?: { status?: number } })?.response?.status;
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

const formatYmdDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toIsoDate = (raw: string): string => {
  const [datePart] = raw.split(' ');
  return datePart;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBooleanOrNull = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') return true;
    if (normalized === '0' || normalized === 'false') return false;
  }

  return null;
};

const inferDispatchedFromStockState = (stockState: string): boolean => {
  const normalized = stockState.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes('issued') ||
    normalized.includes('issue') ||
    normalized.includes('dikeluarkan') ||
    normalized.includes('keluar') ||
    normalized.includes('out')
  );
};

const resolveApiPayload = <T>(payload: unknown): T => {
  if (!payload || typeof payload !== 'object') {
    return payload as T;
  }

  const source = payload as {
    status?: boolean;
    success?: boolean;
    data?: unknown;
    message?: string;
  };

  if (source.status === true || source.success === true) {
    return source.data as T;
  }

  if (source.status === false || source.success === false) {
    throw new Error(source.message || 'Request gagal diproses oleh server');
  }

  return payload as T;
};

const unwrapPayload = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: T }).data;
    if (nested !== undefined) {
      return nested;
    }
  }

  return payload as T;
};

const extractPagination = <T>(payload: unknown): PaginationLike<T> => {
  if (!payload || typeof payload !== 'object') {
    return {
      data: [],
      current_page: 1,
      perPage: 25,
      total: 0,
      last_page: 1,
    };
  }

  const source = payload as PaginationLike<T> & { data?: unknown };
  if (Array.isArray(source.data)) {
    return source;
  }

  if (source.data && typeof source.data === 'object') {
    const nested = source.data as PaginationLike<T>;
    if (Array.isArray(nested.data)) {
      return nested;
    }
  }

  return {
    data: [],
    current_page: 1,
    perPage: 25,
    total: 0,
    last_page: 1,
  };
};

const extractList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const source = payload as { data?: unknown };

    if (Array.isArray(source.data)) {
      return source.data as T[];
    }

    if (source.data && typeof source.data === 'object') {
      const nested = source.data as { data?: unknown };
      if (Array.isArray(nested.data)) {
        return nested.data as T[];
      }
    }
  }

  return [];
};

const extractDetailsFromItemPayload = (payload: unknown): SalesItemDetailResponseApiModel => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const source = payload as SalesItemDetailResponseApiModel & { data?: SalesItemDetailResponseApiModel };
  if (Array.isArray(source.unit_transaction_item_details)) {
    return source;
  }

  if (source.data && Array.isArray(source.data.unit_transaction_item_details)) {
    return source.data;
  }

  return source;
};

const fetchItemDetails = async (itemId: number): Promise<SalesItemDetailApiModel[]> => {
  const directResponse = await withPathFallback(
    () => apiClient.get<unknown>(`${unitTransactionItemPath}/${itemId}`),
    () => apiClient.get<unknown>(`${unitTransactionItemLegacyPath}/${itemId}`),
  );
  const directPayload = resolveApiPayload<unknown>(directResponse.data);
  const directNormalized = extractDetailsFromItemPayload(directPayload);
  const directDetails = directNormalized.unit_transaction_item_details ?? [];
  if (directDetails.length > 0) {
    return directDetails;
  }

  // Some backend variants return empty `unit_transaction_item_details`,
  // but provide relation rows in `unit_transaction_item_sales` that point to detail IDs.
  const relationDetailIds = Array.from(
    new Set(
      (directNormalized.unit_transaction_item_sales ?? [])
        .map((item) => toNumber(item.unit_transaction_item_detail_id))
        .filter((id) => id > 0),
    ),
  );

  if (relationDetailIds.length > 0) {
    const relationDetails = await Promise.all(
      relationDetailIds.map(async (detailId) => {
        try {
          const detailResponse = await withPathFallback(
            () => apiClient.get<unknown>(`${unitTransactionItemDetailPath}/${detailId}`),
            () => apiClient.get<unknown>(`${unitTransactionItemDetailLegacyPath}/${detailId}`),
          );
          const detailPayload = resolveApiPayload<unknown>(detailResponse.data);
          const detailRecord = unwrapPayload<SalesItemDetailApiModel>(detailPayload);
          return detailRecord;
        } catch {
          return null;
        }
      }),
    );

    const normalizedDetails = relationDetails.filter((item): item is SalesItemDetailApiModel => item !== null);
    if (normalizedDetails.length > 0) {
      return normalizedDetails;
    }
  }

  const listResponse = await withPathFallback(
    () =>
      apiClient.get<unknown>(unitTransactionItemDetailPath, {
        params: {
          unit_transaction_item_id: itemId,
          page: 1,
          perPage: 200,
        },
      }),
    () =>
      apiClient.get<unknown>(unitTransactionItemDetailLegacyPath, {
        params: {
          unit_transaction_item_id: itemId,
          page: 1,
          perPage: 200,
        },
      }),
  );
  const listPayload = resolveApiPayload<unknown>(listResponse.data);
  const listPaginated = extractPagination<SalesItemDetailApiModel>(listPayload);
  return listPaginated.data ?? [];
};

const mapPengeluaranUnit = (raw: z.infer<typeof pengeluaranUnitSchema>): PengeluaranUnit => ({
  id: raw.id,
  uuid: raw.uuid,
  personId: raw.person_id ?? 0,
  warehouseId: raw.warehouse_id ?? 0,
  activityNumber: raw.activity_number,
  activityType: raw.activity_type,
  activityDate: toIsoDate(raw.activity_date),
  description: raw.description ?? null,
  createdAt: raw.created_at,
  warehouse: raw.warehouse ?? null,
  person: raw.person ?? null,
  state: raw.state,
});

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'Terjadi kesalahan saat memproses request';
};

export const getPengeluaranUnits = async (params: PengeluaranUnitListParams = {}): Promise<PengeluaranUnitListResult> => {
  const response = await apiClient.get<LaravelApiResponse<unknown>>(basePath, {
    params: {
      activity_type: 'issue',
      page: params.page ?? 1,
      perPage: params.perPage ?? 10,
      search: params.search?.trim() || undefined,
      sort_by: params.sortBy ?? 'created_at',
      sort_direction: params.sortDirection ?? 'desc',
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      company_id: params.company_id || undefined,
    },
  });

  const payload = ensureSuccess(response.data);
  const parsed = pengeluaranUnitListDataSchema.parse(payload);

  return {
    data: parsed.data.map((item) => mapPengeluaranUnit(item)),
    meta: {
      currentPage: parsed.current_page,
      perPage: parsed.per_page,
      total: parsed.total,
      lastPage: parsed.last_page,
    },
  };
};

export const getPengeluaranUnitById = async (id: string | number): Promise<PengeluaranUnit> => {
  const response = await apiClient.get<LaravelApiResponse<unknown>>(`${basePath}/${id}`);
  const payload = ensureSuccess(response.data);
  const parsed = pengeluaranUnitSchema.parse(payload);
  return mapPengeluaranUnit(parsed);
};

const toFormData = (payload: SavePengeluaranUnitPayload): FormData => {
  const parsed = savePengeluaranUnitSchema.parse(payload);
  const formData = new FormData();

  formData.append('person_id', String(parsed.personId));
  formData.append('warehouse_id', String(parsed.warehouseId));
  formData.append('activity_type', 'issue');
  formData.append('activity_date', parsed.activityDate);

  if (parsed.description && parsed.description.trim().length > 0) {
    formData.append('description', parsed.description.trim());
  }

  return formData;
};

const toUrlEncodedBody = (payload: SavePengeluaranUnitPayload): URLSearchParams => {
  const parsed = savePengeluaranUnitSchema.parse(payload);
  const body = new URLSearchParams();

  body.append('person_id', String(parsed.personId));
  body.append('warehouse_id', String(parsed.warehouseId));
  body.append('activity_type', 'issue');
  body.append('activity_date', parsed.activityDate);
  body.append('description', parsed.description?.trim() ?? '');

  return body;
};

export const createPengeluaranUnit = async (payload: SavePengeluaranUnitPayload): Promise<PengeluaranUnit> => {
  try {
    const formData = toFormData(payload);
    const response = await apiClient.post<LaravelApiResponse<unknown>>(basePath, formData);
    const data = ensureSuccess(response.data);
    return mapPengeluaranUnit(pengeluaranUnitSchema.parse(data));
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updatePengeluaranUnit = async (id: string | number, payload: SavePengeluaranUnitPayload): Promise<PengeluaranUnit> => {
  try {
    const path = `${basePath}/${id}`;

    let response: { data: unknown };
    try {
      const urlEncodedBody = toUrlEncodedBody(payload);
      response = await apiClient.put<LaravelApiResponse<unknown>>(path, urlEncodedBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error) {
      if (!shouldFallback(error)) throw error;

      const fallbackBody = toUrlEncodedBody(payload);
      fallbackBody.append('_method', 'PUT');
      response = await apiClient.post<LaravelApiResponse<unknown>>(path, fallbackBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    }

    const data = ensureSuccess(response.data as LaravelApiResponse<unknown>);
    return mapPengeluaranUnit(pengeluaranUnitSchema.parse(data));
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getWarehouseOptions = async (): Promise<WarehouseOption[]> => {
  const response = await apiClient.get<unknown>(warehouseDataPath, {
    params: {
      page: 1,
      perPage: 200,
    },
  });

  const payload = resolveApiPayload<unknown>(response.data);
  const paginated = extractPagination<{ id?: number | string; name?: string }>(payload);
  const list = (paginated.data ?? []).length > 0 ? paginated.data ?? [] : extractList<{ id?: number | string; name?: string }>(payload);

  return list
    .map((item) => ({
      id: toNumber(item.id),
      name: String(item.name ?? '-'),
    }))
    .filter((item) => item.id > 0);
};

export const getCustomerOptions = async (): Promise<PersonOption[]> => {
  const response = await apiClient.get<unknown>(customerPath, {
    params: {
      page: 1,
      perPage: 200,
    },
  });

  const payload = resolveApiPayload<unknown>(response.data);
  const paginated = extractPagination<{ id?: number | string; name?: string }>(payload);
  const list = (paginated.data ?? []).length > 0 ? paginated.data ?? [] : extractList<{ id?: number | string; name?: string }>(payload);

  return list
    .map((item) => ({
      id: toNumber(item.id),
      name: String(item.name ?? '-'),
    }))
    .filter((item) => item.id > 0);
};

export const getSupplierOptions = async (): Promise<PersonOption[]> => {
  const response = await apiClient.get<unknown>(customerPath, {
    params: {
      page: 1,
      perPage: 200,
    },
  });

  const payload = resolveApiPayload<unknown>(response.data);
  const paginated = extractPagination<{ id?: number | string; name?: string }>(payload);
  const list = (paginated.data ?? []).length > 0 ? paginated.data ?? [] : extractList<{ id?: number | string; name?: string }>(payload);

  return list
    .map((item) => ({
      id: toNumber(item.id),
      name: String(item.name ?? '-'),
    }))
    .filter((item) => item.id > 0);
};

export const getDispatchUnitRows = async (params: DispatchUnitTableParams = {}): Promise<DispatchUnitTableResult> => {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.max(1, params.perPage ?? 10);
  const normalizedSearch = String(params.search ?? '')
    .trim()
    .toLowerCase();
  const warehouseId = toNumber(params.warehouseId);

  if (warehouseId <= 0) {
    return {
      data: [],
      meta: {
        currentPage: page,
        perPage,
        total: 0,
        lastPage: 1,
      },
    };
  }

  const response = await withPathFallback(
    () =>
      apiClient.get<unknown>(salesTransactionPath, {
        params: {
          type: 'sales',
          page: 1,
          perPage: 500,
          search: params.search?.trim() || undefined,
          sort_order: 'desc',
        },
      }),
    () =>
      apiClient.get<unknown>(salesTransactionLegacyPath, {
        params: {
          type: 'sales',
          page: 1,
          perPage: 500,
          search: params.search?.trim() || undefined,
          sort_order: 'desc',
        },
      }),
  );

  const payload = resolveApiPayload<unknown>(response.data);
  const paginatedTransactions = extractPagination<SalesTransactionInfoApiModel>(payload);
  const transactions = paginatedTransactions.data ?? [];
  const transactionById = new Map<number, SalesTransactionInfoApiModel>();
  transactions.forEach((transaction) => {
    const transactionId = toNumber(transaction.id);
    if (transactionId > 0) {
      transactionById.set(transactionId, transaction);
    }
  });
  const salesItemsResponse = await withPathFallback(
    () =>
      apiClient.get<unknown>(unitTransactionItemPath, {
        params: {
          warehouse_id: warehouseId,
          type: 'sales',
          page: 1,
          perPage: 500,
        },
      }),
    () =>
      apiClient.get<unknown>(unitTransactionItemLegacyPath, {
        params: {
          warehouse_id: warehouseId,
          type: 'sales',
          page: 1,
          perPage: 500,
        },
      }),
  );

  const salesItemsPayload = resolveApiPayload<unknown>(salesItemsResponse.data);
  const salesItemsPaginated = extractPagination<SalesUnitItemApiModel>(salesItemsPayload);
  const items = (salesItemsPaginated.data ?? [])
    .map((item) => {
      const transactionId = toNumber(item.unit_transaction_id);
      const transaction = transactionById.get(transactionId);

      return {
        ...item,
        unit_transaction: item.unit_transaction ?? transaction,
      };
    });

  if (items.length === 0) {
    return {
      data: [],
      meta: {
        currentPage: page,
        perPage,
        total: 0,
        lastPage: 1,
      },
    };
  }

  const uniqueTypeIds = Array.from(new Set(items.map((item) => toNumber(item.unit_type_id)).filter((id) => id > 0)));
  const typeNameEntries = await Promise.all(
    uniqueTypeIds.map(async (id) => {
      try {
        const typeResponse = await apiClient.get<unknown>(`${unitTypePath}/${id}`, {
          params: {
            company_id: 1,
          },
        });
        const typePayload = resolveApiPayload<unknown>(typeResponse.data);
        const typeData = unwrapPayload<UnitTypeApiModel>(typePayload);
        return [id, typeData.name ?? '-'] as const;
      } catch {
        return [id, '-'] as const;
      }
    }),
  );
  const typeNameMap = new Map<number, string>(typeNameEntries);

  const detailRowsCollection = await Promise.all(
    items.map(async (item) => {
      const itemId = toNumber(item.id);
      if (itemId <= 0) return [] as DispatchUnitTableRow[];

      try {
        const unitDetails = await fetchItemDetails(itemId);
        const unitTypeId = toNumber(item.unit_type_id);
        const unitTypeName = typeNameMap.get(unitTypeId) ?? '-';
        const transactionId = toNumber(item.unit_transaction_id);
        const transaction = transactionById.get(transactionId);
        const salesCode = item.unit_transaction?.code ?? transaction?.code ?? item.code ?? '-';
        const stockState = item.unit_transaction?.stock_state ?? transaction?.stock_state ?? item.stock_state ?? '-';
        const warehouseId = toNumber(item.warehouse_id ?? item.unit_transaction?.warehouse_id);

        return unitDetails.map((detail) => {
          const detailId = toNumber(detail.id);
          const inStock = toBooleanOrNull(detail.in_stock);
          const isDispatched = inStock === null ? inferDispatchedFromStockState(stockState) : !inStock;

          return {
            id: detailId,
            salesCode,
            unitTypeName,
            color: detail.color ?? '-',
            machineNumber: detail.machine_number ?? '-',
            chassisNumber: detail.chassis_number ?? '-',
            stockState: isDispatched ? 'Dikeluarkan' : 'Belum Dikeluarkan',
            inStock,
            isDispatched,
            warehouseId,
            unitTransactionItemDetailId: detailId,
          } satisfies DispatchUnitTableRow;
        });
      } catch {
        return [] as DispatchUnitTableRow[];
      }
    }),
  );

  const rows = detailRowsCollection.flat();
  const filteredRows =
    normalizedSearch.length === 0
      ? rows
      : rows.filter((row) =>
          [row.salesCode, row.unitTypeName, row.color, row.machineNumber, row.chassisNumber, row.stockState]
            .map((value) => String(value ?? '').toLowerCase())
            .some((value) => value.includes(normalizedSearch)),
        );
  const total = filteredRows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, lastPage);
  const startIndex = (safePage - 1) * perPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + perPage);

  return {
    data: paginatedRows,
    meta: {
      currentPage: safePage,
      perPage,
      total,
      lastPage,
    },
  };
};

export const dispatchPengeluaranStock = async (warehouseActivityId: number | string, detailIds: number[]): Promise<void> => {
  if (!warehouseActivityId) {
    throw new Error('ID warehouse activity tidak valid');
  }

  if (!Array.isArray(detailIds) || detailIds.length === 0) {
    throw new Error('Pilih minimal satu unit untuk dikirim');
  }

  const path = `${basePath}/${warehouseActivityId}/dispatch-stock`;
  const urlEncodedBody = new URLSearchParams();
  detailIds.forEach((id) => {
    urlEncodedBody.append('unit_transaction_details[]', String(id));
  });
  urlEncodedBody.append('unit_transaction_details', JSON.stringify(detailIds));

  const jsonBody = {
    unit_transaction_details: detailIds,
  };

  try {
    await apiClient.put<LaravelApiResponse<unknown>>(path, jsonBody);
    return;
  } catch (error) {
    if (!shouldFallback(error)) throw error;
  }

  try {
    await apiClient.put<LaravelApiResponse<unknown>>(path, urlEncodedBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return;
  } catch (error) {
    if (!shouldFallback(error)) throw error;
  }

  const formData = new FormData();
  detailIds.forEach((id) => {
    formData.append('unit_transaction_details[]', String(id));
  });
  formData.append('unit_transaction_details', JSON.stringify(detailIds));
  formData.append('_method', 'PUT');

  await apiClient.post<LaravelApiResponse<unknown>>(path, formData);
};

export const toSavePayload = (payload: {
  personId: number;
  warehouseId: number;
  activityDate: Date;
  description?: string;
}): SavePengeluaranUnitPayload => ({
  personId: payload.personId,
  warehouseId: payload.warehouseId,
  activityDate: formatYmdDate(payload.activityDate),
  description: payload.description?.trim() || undefined,
});

