import { apiClient } from '@/lib/api/client';
import { getStockUnits } from '@/services/stock-unit.service';

export interface StockItem {
  id: number;
  unit_type: {
    id: number;
    code: string;
    unit_type: string;
    buy_price: number;
    sell_price: number;
    name: string;
    brand: { id: number; name: string };
  };
  color: string;
  machine_number: string;
  chassis_number: string;
  stock_available: number;
  stock_forecast: number;
  purchase_price: number;
  stock_status?: string;
  status?: string | undefined;
  person?: string;
}

export interface OrderOutstandingItem {
  transaction_code: string;
  transaction_date: string;
  transaction_type: string;
  person_name: string;
  unit_type_name: string;
  qty_total: number;
  qty_received: number;
  qty_outstanding: number;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface WarehouseItem {
  id: number;
  name: string;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toString = (value: unknown, fallback = '-'): string => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const toArray = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value : [];
};

const resolvePaginatedPayload = (payload: unknown): {
  rows: unknown[];
  metaSource: Record<string, unknown>;
} => {
  if (!payload || typeof payload !== 'object') {
    return { rows: [], metaSource: {} };
  }

  const source = payload as Record<string, unknown>;
  const directRows = toArray(source.data);

  if (directRows.length > 0 || source.current_page !== undefined || source.total !== undefined) {
    return { rows: directRows, metaSource: source };
  }

  if (source.data && typeof source.data === 'object') {
    const nested = source.data as Record<string, unknown>;
    return {
      rows: toArray(nested.data),
      metaSource: nested,
    };
  }

  return { rows: [], metaSource: source };
};

const buildPaginatedResponse = <T>(
  payload: unknown,
  perPageFallback: number,
  mapper: (item: unknown) => T,
): PaginatedResponse<T> => {
  const { rows, metaSource } = resolvePaginatedPayload(payload);

  const currentPage = toNumber(metaSource.current_page) || 1;
  const perPage = toNumber(metaSource.per_page) || perPageFallback;
  const total = toNumber(metaSource.total) || rows.length;
  const lastPage = toNumber(metaSource.last_page) || (total > 0 ? Math.ceil(total / perPage) : 1);

  return {
    current_page: currentPage,
    data: rows.map(mapper),
    last_page: lastPage,
    per_page: perPage,
    total,
    from: toNumber(metaSource.from),
    to: toNumber(metaSource.to),
  };
};

const mapStockItem = (item: unknown, brandMap?: Map<number, string>): StockItem => {
  const source = (item ?? {}) as Record<string, unknown>;
  const unitType = (source.unit_type ?? {}) as Record<string, unknown>;
  const brand = (unitType.brand ?? {}) as Record<string, unknown>;

  const brandId = toNumber(brand.id) || toNumber(unitType.brand_id) || 0;
  let brandName = toString(brand.name, '');

  if (!brandName && brandId && brandMap) {
    brandName = brandMap.get(brandId) || '';
  }

  if (!brandName) {
    brandName = '-';
  }

  // person/supplier can live in multiple places depending on the API response:
  // 1. source.person (string)
  // 2. source.unit_transaction.person (string or object)
  // 3. source.person.name (object with name)
  const unitTx = (source.unit_transaction ?? {}) as Record<string, unknown>;
  const personRaw =
    source.person ??
    unitTx.person ??
    null;

  let personName = '';
  if (typeof personRaw === 'string' && personRaw.trim().length > 0) {
    personName = personRaw;
  } else if (personRaw && typeof personRaw === 'object') {
    const personObj = personRaw as Record<string, unknown>;
    personName = toString(personObj.name, '');
  }

  return {
    id: toNumber(source.id),
    unit_type: {
      id: toNumber(unitType.id),
      code: toString(unitType.code),
      unit_type: toString(unitType.unit_type),
      buy_price: toNumber(unitType.buy_price),
      sell_price: toNumber(unitType.sell_price),
      name: toString(unitType.name),
      brand: {
        id: brandId,
        name: brandName,
      },
    },
    color: toString(source.color),
    machine_number: toString(source.machine_number),
    chassis_number: toString(source.chassis_number),
    stock_available: toNumber(source.stock_available),
    stock_forecast: toNumber(source.stock_forecast),
    purchase_price: toNumber(source.purchase_price),
    person: personName,
    status: toString(source?.status),
    stock_status: toString(source?.stock_status),
  };
};

const mapOrderItemToRows = (item: unknown): OrderOutstandingItem[] => {
  const source = (item ?? {}) as Record<string, unknown>;
  return [
    {
      transaction_code: toString(source.transaction_code),
      transaction_date: toString(source.transaction_date),
      transaction_type: toString(source.transaction_type),
      person_name: toString(source.person_name),
      unit_type_name: toString(source.unit_type_name),
      qty_total: toNumber(source.qty_total),
      qty_received: toNumber(source.qty_received),
      qty_outstanding: toNumber(source.qty_outstanding),
    },
  ];
};

export const getStockData = async (params: {
  company_id?: number;
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<StockItem>> => {
  const companyId = params.company_id ?? 1;

  const [stockResponse, brandResponse] = await Promise.all([
    apiClient.get(
      `/wapi/warehouse/warehouse-get-stock/${companyId}`,
      {
        params: {
          page: params.page ?? 1,
          per_page: params.per_page ?? 50,
          ...(params.search ? { search: params.search } : {}),
          ...(params.status ? { status: params.status } : {}),
        },
      },
    ),
    apiClient.get('/wapi/master-data/brand', {
      params: { per_page: 1000 },
    }).catch(() => null),
  ]);

  const brandsList = brandResponse?.data?.data?.data || [];
  const brandMap = new Map<number, string>();
  if (Array.isArray(brandsList)) {
    brandsList.forEach((brand: any) => {
      if (brand && typeof brand.id === 'number') {
        brandMap.set(brand.id, brand.name || '');
      }
    });
  }

  const responseData = stockResponse.data?.data ?? stockResponse.data;

  return buildPaginatedResponse(responseData, params.per_page ?? 50, (item) => mapStockItem(item, brandMap));
};

export const getStockDetailData = async (params: {
  warehouse_id?: number;
  company_id?: number | string;
  page?: number;
  per_page?: number;
  search?: string;
  machine_number?: string;
  chassis_number?: string;
  color?: string;
  stock_state?: string;
  in_stock?: boolean | string;
  is_forecast?: boolean | string;
  is_sold_unit?: boolean | string;
  unit_transaction_item_id?: string;
}) => {
  const companyId = params.company_id ?? params.warehouse_id ?? 1;
  const inStockBool = params.in_stock === undefined || params.in_stock === '' ? undefined : (params.in_stock === true || params.in_stock === 'true');
  const isForecastBool = params.is_forecast === undefined || params.is_forecast === '' ? undefined : (params.is_forecast === true || params.is_forecast === 'true');
  const isSoldUnitBool = params.is_sold_unit === undefined || params.is_sold_unit === '' ? undefined : (params.is_sold_unit === true || params.is_sold_unit === 'true');
  const res = await getStockUnits(companyId, {
    page: params.page,
    perPage: params.per_page,
    search: params.search,
    machine_number: params.machine_number,
    chassis_number: params.chassis_number,
    color: params.color,
    stock_state: params.stock_state,
    in_stock: inStockBool,
    is_forecast: isForecastBool,
    is_sold_unit: isSoldUnitBool,
  });

  return {
    current_page: res.meta.currentPage,
    data: res.data,
    last_page: res.meta.lastPage,
    per_page: res.meta.perPage,
    total: res.meta.total,
    from: (res.meta.currentPage - 1) * res.meta.perPage + 1,
    to: Math.min(res.meta.currentPage * res.meta.perPage, res.meta.total),
    meta: res.meta,
  };
};

export const getOrderOutstanding = async (params: {
  warehouse_id?: number;
  type: 'purchase' | 'sales';
  page?: number;
  per_page?: number;
  qty_outstanding?: boolean | string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
}): Promise<PaginatedResponse<OrderOutstandingItem>> => {
  const warehouseId = params.warehouse_id ?? 1;
  const response = await apiClient.get(`/wapi/warehouse/warehouse-unit-transaction-outstanding/${warehouseId}`, {
    params: {
      type: params.type,
      page: params.page ?? 1,
      per_page: params.per_page ?? 50,
      ...(params.qty_outstanding !== undefined ? { qty_outstanding: params.qty_outstanding } : { qty_outstanding: true }),
      ...(params.order_by ? { order_by: params.order_by } : {}),
      ...(params.order_sort ? { order_sort: params.order_sort } : {}),
    },
  });

  const { rows, metaSource } = resolvePaginatedPayload(response.data?.data ?? response.data);
  const flatRows = rows.flatMap((item) => mapOrderItemToRows(item));
  const currentPage = toNumber(metaSource.current_page) || 1;
  const perPage = toNumber(metaSource.per_page) || (params.per_page ?? 50);
  const total = toNumber(metaSource.total) || rows.length;
  const lastPage = toNumber(metaSource.last_page) || (total > 0 ? Math.ceil(total / perPage) : 1);

  return {
    current_page: currentPage,
    data: flatRows,
    last_page: lastPage,
    per_page: perPage,
    total,
    from: toNumber(metaSource.from),
    to: toNumber(metaSource.to),
  };
};

export const getPurchaseOrderOutstanding = async (params: {
  warehouse_id?: number;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<OrderOutstandingItem>> => {
  return getOrderOutstanding({ ...params, type: 'purchase' });
};

export const getSalesOrderOutstanding = async (params: {
  warehouse_id?: number;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<OrderOutstandingItem>> => {
  return getOrderOutstanding({ ...params, type: 'sales' });
};

export const getWarehouses = async (): Promise<WarehouseItem[]> => {
  const response = await apiClient.get('/wapi/warehouse');
  const payload = response.data?.data;

  if (Array.isArray(payload)) {
    return payload.map((item) => {
      const source = item as Record<string, unknown>;
      return {
        id: toNumber(source.id),
        name: toString(source.name),
      };
    });
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data: unknown[] }).data.map((item) => {
      const source = item as Record<string, unknown>;
      return {
        id: toNumber(source.id),
        name: toString(source.name),
      };
    });
  }

  return [];
};
