import {
  CreateWarehouseDataPayload,
  CreateWarehouseActivityPayload,
  ReceiptStockPayload,
  UpdateWarehouseActivityPayload,
  WarehouseActivity,
  WarehouseActivityDetail,
  WarehouseActivityListParams,
  WarehouseActivityListResponse,
  WarehouseActivityUnitDetail,
} from '@/@types/warehouse.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';

const basePath = '/wapi/warehouse/warehouse-activity';

type ApiPerson = {
  id?: string | number;
  name?: string;
};

type ApiUnitType = {
  id?: string | number;
  name?: string;
};

type WarehouseActivityUnitDetailApiModel = {
  id?: string | number;
  unit_transaction_detail_id?: string | number;
  unit_transaction_item_detail_id?: string | number;
  detail_id?: string | number;
  code?: string;
  unit_transaction_code?: string;
  no_pembelian?: string;
  noPembelian?: string;
  tipe_unit?: string;
  tipeUnit?: string;
  unit_type_name?: string;
  color?: string;
  warna?: string;
  machine_number?: string;
  no_mesin?: string;
  chassis_number?: string;
  no_rangka?: string;
  is_received?: boolean | number | string;
  is_receipt?: boolean | number | string;
  received?: boolean | number | string;
  receipt_status?: boolean | number | string;
  in_stock?: boolean | number | string;
  stock_state?: string;
  status?: string;
  is_sold_unit?: boolean | number | string;
  isSoldUnit?: boolean | number | string;
  unit_type?: ApiUnitType;
  unit_transaction?: {
    code?: string;
  };
  warehouse_sub_block?: {
    name?: string;
  };
};

type WarehouseActivityApiModel = {
  id?: string | number;
  activity_number?: string;
  activity_date?: string;
  activity_type?: string;
  type?: string;
  description?: string;
  warehouse?: {
    id?: string | number;
    name?: string;
  } | null;
  person?: ApiPerson | null;
  state?: string;
  is_refund_activity?: boolean | number | string;
  isRefundActivity?: boolean | number | string;
  state_note?: string;
  stateNote?: string;
  unit_transaction_details?: WarehouseActivityUnitDetailApiModel[];
  details?: WarehouseActivityUnitDetailApiModel[];
  data?: WarehouseActivityApiModel;
};

type LaravelPaginationLike<T> = {
  data?: T[];
  current_page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
};

const toStringValue = (value: unknown): string => String(value ?? '');

const toNumberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }
  return false;
};

const isReceivedByState = (state: unknown): boolean => {
  const normalized = String(state ?? '')
    .trim()
    .toLowerCase();

  if (!normalized) return false;

  return ['on_hand', 'on hand', 'received', 'receipt', 'in_stock', 'in stock', 'available'].includes(normalized);
};

const mapActivity = (item: WarehouseActivityApiModel): WarehouseActivity => {
  const id = toStringValue(item.id);
  const noPenerimaan = item.activity_number ?? '-';
  const tanggal = item.activity_date ?? '';
  const supplier = item.person?.name ?? '-';
  const keterangan = item.description ?? '';
  const state = item?.state ?? '-';
  const isRefundActivity = toBoolValue(item.is_refund_activity) || toBoolValue(item.isRefundActivity);
  const state_note = item.state_note ?? item.stateNote;

  return {
    id,
    activity_number: item.activity_number ?? '-',
    activityNumber: item.activity_number ?? '-',
    activity_date: tanggal,
    activityDate: tanggal,
    activity_type: item.activity_type,
    description: item.description,
    warehouse: item.warehouse
      ? {
        id: toStringValue(item.warehouse.id),
        name: item.warehouse.name ?? '-',
      }
      : null,
    person: item.person
      ? {
        id: toStringValue(item.person.id),
        name: item.person.name ?? '-',
      }
      : null,
    noPenerimaan,
    state,
    tanggal,
    supplier,
    keterangan,
    isRefundActivity,
    state_note,
    type: item.type,
  };
};

const mapDetail = (activityId: string, detail: WarehouseActivityUnitDetailApiModel): WarehouseActivityUnitDetail => {
  const detailId =
    toNumberValue(detail.unit_transaction_detail_id) ||
    toNumberValue(detail.unit_transaction_item_detail_id) ||
    toNumberValue(detail.id) ||
    toNumberValue(detail.detail_id);

  const noPembelian =
    detail.noPembelian ?? detail.no_pembelian ?? detail.unit_transaction?.code ?? detail.unit_transaction_code ?? detail.code ?? '-';

  const tipeUnit = detail.tipeUnit ?? detail.tipe_unit ?? detail.unit_type?.name ?? detail.unit_type_name ?? '-';

  const warna = detail.warna ?? detail.color ?? '-';
  const noMesin = detail.no_mesin ?? detail.machine_number ?? '-';
  const noRangka = detail.no_rangka ?? detail.chassis_number ?? '-';
  const status = detail.status ?? '-';
  const in_stock = toBoolValue(detail.in_stock);
  const diterima =
    toBoolValue(detail.is_received) ||
    toBoolValue(detail.is_receipt) ||
    toBoolValue(detail.received) ||
    toBoolValue(detail.receipt_status) ||
    toBoolValue(detail.in_stock) ||
    isReceivedByState(detail.stock_state);
  const stockState = detail.stock_state ?? '-';
  const warehouseSubBlock = detail.warehouse_sub_block?.name;
  const isSoldUnit = toBoolValue(detail.is_sold_unit) || toBoolValue(detail.isSoldUnit);

  return {
    id: detailId,
    penerimaanId: activityId,
    noPembelian,
    tipeUnit,
    warna,
    noMesin,
    in_stock,
    status,
    stockState,
    noRangka,
    warehouseSubBlock,
    diterima,
    isSoldUnit,
  };
};

const extractRows = (payload: unknown): WarehouseActivityApiModel[] => {
  if (Array.isArray(payload)) return payload as WarehouseActivityApiModel[];

  if (payload && typeof payload === 'object') {
    const source = payload as { data?: unknown };

    if (Array.isArray(source.data)) {
      return source.data as WarehouseActivityApiModel[];
    }

    if (source.data && typeof source.data === 'object') {
      const nested = source.data as { data?: unknown };
      if (Array.isArray(nested.data)) {
        return nested.data as WarehouseActivityApiModel[];
      }
    }
  }

  return [];
};

const extractMeta = (payload: unknown, dataCount: number) => {
  const fallback = {
    currentPage: 1,
    perPage: dataCount > 0 ? dataCount : 10,
    total: dataCount,
    lastPage: 1,
  };

  if (!payload || typeof payload !== 'object') return fallback;

  const primary = payload as LaravelPaginationLike<WarehouseActivityApiModel>;
  if (typeof primary.current_page === 'number') {
    return {
      currentPage: primary.current_page,
      perPage: primary.per_page ?? fallback.perPage,
      total: primary.total ?? dataCount,
      lastPage: primary.last_page ?? 1,
    };
  }

  const nested = (payload as { data?: LaravelPaginationLike<WarehouseActivityApiModel> }).data;
  if (nested && typeof nested.current_page === 'number') {
    return {
      currentPage: nested.current_page,
      perPage: nested.per_page ?? fallback.perPage,
      total: nested.total ?? dataCount,
      lastPage: nested.last_page ?? 1,
    };
  }

  return fallback;
};

const extractActivityObject = (payload: unknown): WarehouseActivityApiModel => {
  if (!payload || typeof payload !== 'object') return {};

  const source = payload as WarehouseActivityApiModel;
  if (source.id !== undefined || source.activity_number !== undefined || source.activity_date !== undefined) {
    return source;
  }

  if (source.data && typeof source.data === 'object') {
    const nested = source.data;
    if (nested.id !== undefined || nested.activity_number !== undefined || nested.activity_date !== undefined) {
      return nested;
    }
  }

  return source;
};

const normalizeCreateUpdatePayload = (payload: CreateWarehouseActivityPayload | UpdateWarehouseActivityPayload): URLSearchParams => {
  const body = new URLSearchParams();

  if ('warehouse_id' in payload && payload.warehouse_id) {
    body.append('warehouse_id', payload.warehouse_id);
  }

  if ('activity_type' in payload && payload.activity_type) {
    body.append('activity_type', payload.activity_type);
  }

  if ('activity_date' in payload && payload.activity_date) {
    body.append('activity_date', payload.activity_date);
  }

  if (payload.description !== undefined) {
    body.append('description', payload.description ?? '');
  }

  if (payload.person_id) {
    body.append('person_id', payload.person_id);
  }

  if ('sparepart_transaction_id' in payload && payload.sparepart_transaction_id) {
    body.append('sparepart_transaction_id', payload.sparepart_transaction_id);
  }

  if ('state' in payload && payload.state) {
    body.append('state', payload.state);
  }

  if (payload.supplier_name) {
    // Compatibility fallback: some backend variants accept one of these aliases.
    body.append('supplier_name', payload.supplier_name);
    body.append('person_name', payload.supplier_name);
    body.append('supplier', payload.supplier_name);
  }

  if ('type' in payload && payload.type) {
    body.append('type', payload.type);
  }

  return body;
};

export const getWarehouseActivities = async (params: WarehouseActivityListParams = {}): Promise<WarehouseActivityListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<unknown>>(basePath, {
    params: {
      activity_type: params.activityType ?? 'receipt',
      type: params.type || undefined,
      page: params.page,
      per_page: params.perPage,
      search: params.search || undefined,
      company_id: params.company_id || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
  });

  const payload = ensureSuccess(response.data);
  const rows = extractRows(payload);
  const mapped = rows.map(mapActivity);

  return {
    data: mapped,
    meta: extractMeta(payload, mapped.length),
  };
};

export const getWarehouseActivityById = async (id: string): Promise<WarehouseActivityDetail> => {
  const response = await apiClient.get<LaravelApiResponse<unknown>>(`${basePath}/${id}`);
  const payload = ensureSuccess(response.data);

  const activity = extractActivityObject(payload);
  const mapped = mapActivity(activity);

  let mappedDetails: WarehouseActivityUnitDetail[] = [];
  if (activity && Array.isArray((activity as any).warehouse_movements)) {
    mappedDetails = (activity as any).warehouse_movements.map((movement: any) => {
      const detail = movement.unit_transaction_item_detail ?? {};
      const item = detail.unit_transaction_item ?? {};
      const type = item.unit_type ?? {};

      const detailId = toNumberValue(detail.id) || toNumberValue(movement.unit_transaction_item_detail_id);
      const noPembelian = movement.unit_transaction?.code ?? item.unit_transaction?.code ?? detail.unit_transaction_code ?? '-';
      const tipeUnit = type.name ?? detail.unit_type_name ?? '-';
      const warna = detail.color ?? '-';
      const noMesin = detail.machine_number ?? '-';
      const noRangka = detail.chassis_number ?? '-';
      const status = detail.status ?? '-';
      const in_stock = toBoolValue(detail.in_stock);
      const stockStatus = detail.in_stock ?? '-';
      const isSoldUnit = detail.is_sold_unit ?? '-';
      const stockState = detail?.stock_state ?? detail?.state ?? '-';
      const warehouseSubBlock = detail?.warehouse_sub_block?.name;
      const diterima = movement.status === 'in' || toBoolValue(detail.in_stock);

      return {
        id: detailId,
        penerimaanId: mapped.id,
        noPembelian,
        tipeUnit,
        warna,
        noMesin,
        status,
        in_stock,
        stockStatus,
        noRangka,
        stockState,
        warehouseSubBlock,
        isSoldUnit,
        diterima,
      };
    });
  } else {
    const details = Array.isArray(activity.unit_transaction_details)
      ? activity.unit_transaction_details
      : Array.isArray(activity.details)
        ? activity.details
        : [];
    mappedDetails = details.map((item) => mapDetail(mapped.id, item));
  }

  return {
    ...mapped,
    unit_transaction_details: mappedDetails,
    sparepart_transaction: (activity as any).sparepart_transaction || null,
  };
};

export const createWarehouseActivity = async (payload: CreateWarehouseActivityPayload): Promise<WarehouseActivity> => {
  const body = normalizeCreateUpdatePayload({
    activity_type: payload.activity_type ?? 'receipt',
    activity_date: payload.activity_date,
    description: payload.description,
    person_id: payload.person_id,
    supplier_name: payload.supplier_name,
    type: payload.type,
  });

  const response = await apiClient.post<LaravelApiResponse<unknown>>(basePath, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = ensureSuccess(response.data);
  const mapped = mapActivity(extractActivityObject(data));
  return mapped;
};

export const updateWarehouseActivity = async (id: string, payload: UpdateWarehouseActivityPayload): Promise<WarehouseActivity> => {
  const body = normalizeCreateUpdatePayload(payload);

  const response = await apiClient.put<LaravelApiResponse<unknown>>(`${basePath}/${id}`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = ensureSuccess(response.data);
  return mapActivity(extractActivityObject(data));
};

export const receiptStock = async (activityId: string, payload: ReceiptStockPayload): Promise<void> => {
  const body = new URLSearchParams();
  const normalizedIds = (payload.unit_transaction_details ?? []).map((item) => Number(item)).filter((item) => Number.isFinite(item));
  body.append('unit_transaction_details', JSON.stringify(normalizedIds));

  await apiClient.put<LaravelApiResponse<unknown>>(`${basePath}/${activityId}/receipt-stock`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

export const createWarehouseData = async (payload: CreateWarehouseDataPayload): Promise<void> => {
  const form = new FormData();
  form.append('person_id', String(payload.person_id));
  form.append('warehouse_id', String(payload.warehouse_id));
  form.append('activity_type', payload.activity_type);
  form.append('activity_date', payload.activity_date);
  if (payload.type) {
    form.append('type', payload.type);
  }
  if (payload.description) {
    form.append('description', payload.description);
  }

  const response = await apiClient.post<LaravelApiResponse<unknown>>(basePath, form, {
    timeout: 20000,
  });

  ensureSuccess(response.data);
};

export const deleteWarehouseActivity = async (id: string): Promise<void> => {
  await apiClient.delete<LaravelApiResponse<unknown>>(`${basePath}/${id}`);
};

export const updateWarehouseActivityState = async (
  activityId: string | number,
  state: 'draft' | 'process' | 'done',
  state_note?: string
): Promise<any> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(
    `${basePath}/${activityId}/update-state`,
    { state, state_note }
  );
  return ensureSuccess(response.data);
};

export interface ProcessSparepartStockPayload {
  person_id: number | null;
  cash_id: number | null;
  warehouse_id: number | null;
  type: string | null;
  unit_transaction_id: number | null;
  sparepart_transaction_id: number | null;
  activity_type: string;
  activity_date: string;
  description: string | null;
  state: string | null;
}

export const processSparepartStock = async (
  activityId: string | number,
  activityType: 'receipt' | 'issue' | string,
  payload: ProcessSparepartStockPayload
): Promise<void> => {
  const endpoint = activityType === 'receipt' ? 'receipt-stock' : 'dispatch-stock';
  const body = new URLSearchParams();

  if (payload.person_id !== null && payload.person_id !== undefined) body.append('person_id', String(payload.person_id));
  if (payload.cash_id !== null && payload.cash_id !== undefined) body.append('cash_id', String(payload.cash_id));
  if (payload.warehouse_id !== null && payload.warehouse_id !== undefined) body.append('warehouse_id', String(payload.warehouse_id));
  if (payload.type !== null && payload.type !== undefined) body.append('type', String(payload.type));
  if (payload.unit_transaction_id !== null && payload.unit_transaction_id !== undefined) body.append('unit_transaction_id', String(payload.unit_transaction_id));
  if (payload.sparepart_transaction_id !== null && payload.sparepart_transaction_id !== undefined) body.append('sparepart_transaction_id', String(payload.sparepart_transaction_id));
  body.append('activity_type', payload.activity_type);
  body.append('activity_date', payload.activity_date);
  if (payload.description !== null && payload.description !== undefined) body.append('description', payload.description);
  if (payload.state !== null && payload.state !== undefined) body.append('state', payload.state);

  await apiClient.put<LaravelApiResponse<unknown>>(`${basePath}/${activityId}/${endpoint}`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};
