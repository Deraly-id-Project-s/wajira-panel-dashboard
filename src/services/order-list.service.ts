import type {
  CreateOrderListPayload,
  CreateOrderListTarifPayload,
  CreateOrderListTarifItemPayload,
  OrderList,
  OrderListCustomer,
  OrderListListParams,
  OrderListListResponse,
  OrderListTarifItemListParams,
  OrderListTarifItemListResponse,
  OrderListTarifItem,
  OrderListTarifLoadItem,
  OrderListTarifListParams,
  OrderListTarifListResponse,
  OrderListTarifReference,
  OrderListVehicle,
  OrderListVehicleType,
  UpdateOrderListTarifItemPayload,
  UpdateOrderListPayload,
  UpdateOrderListTarifPayload,
  UpdateOrderListStatePayload,
} from '@/@types/order-list.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const orderListBasePath = '/wapi/transaction/do-order-list';
const orderListTarifBasePath = '/wapi/transaction/do-order-list-tarif';
const orderListTarifItemBasePath = '/wapi/transaction/do-order-list-tarif-item';

const toNumber = (value: unknown): number => {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringValue = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
};

const normalizeVehicleType = (value: unknown): OrderListVehicleType | null => {
  const normalized = typeof value === 'string' ? value.toLowerCase().trim() : '';
  if (normalized === 'towing' || normalized === 'cdd' || normalized === 'fuso') {
    return normalized;
  }
  return null;
};

const mapOrderListCustomer = (item: any): OrderListCustomer | undefined => {
  if (!item || typeof item !== 'object') return undefined;

  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    code: item.code,
    name: item.name ?? '-',
    address: item.address ?? null,
    phone: item.phone ?? null,
    npwp: item.npwp ?? null,
    pic: item.pic_name ?? item.pic ?? null,
  };
};

const mapOrderListVehicle = (item: any): OrderListVehicle => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  registrationNumber: toStringValue(item?.registration_number, item?.registrationNumber),
  type: toStringValue(item?.type, item?.vehicle_type, item?.vehicleType),
});

const createTarifLoadItemMap = (items: OrderListTarifLoadItem[]) => {
  const idMap = new Map<number, OrderListTarifLoadItem[]>();
  const uuidMap = new Map<string, OrderListTarifLoadItem[]>();

  items.forEach((item) => {
    if (item.doOrderListTarifId) {
      const current = idMap.get(item.doOrderListTarifId) ?? [];
      current.push(item);
      idMap.set(item.doOrderListTarifId, current);
    }
    if (item.doOrderListTarifUuid) {
      const current = uuidMap.get(item.doOrderListTarifUuid) ?? [];
      current.push(item);
      uuidMap.set(item.doOrderListTarifUuid, current);
    }
  });

  return {
    get: (id: number, uuid?: string | null) => {
      if (uuid && uuidMap.has(uuid)) return uuidMap.get(uuid);
      if (id && idMap.has(id)) return idMap.get(id);
      return undefined;
    }
  };
};

const buildDisplayTarifItem = (
  item: OrderListTarifItem,
  tarifItems?: OrderListTarifLoadItem[],
  fallbackVehicleType?: OrderListVehicleType | null,
): OrderListTarifItem => {
  const items = tarifItems?.length ? tarifItems : item.tarifItems ?? [];
  const primaryItem = items[0];
  const vehicleType = item.vehicleType ?? fallbackVehicleType ?? null;

  return {
    ...item,
    vehicleType,
    loadContent: item.loadContent ?? primaryItem?.loadContent,
    qty: item.qty ?? primaryItem?.qty,
    driverFee: item.driverFee ?? resolveDriverFee(vehicleType, item.tarif),
    expeditionInvoice: item.expeditionInvoice ?? resolveInvoiceFee(vehicleType, item.tarif),
    tarifItems: items.length ? items : undefined,
  };
};

export const composeOrderListTarifs = (tarifs: OrderListTarifItem[], tarifItems: OrderListTarifLoadItem[] = []) => {
  const tarifLoadItemMap = createTarifLoadItemMap(tarifItems);

  return tarifs.map((item) => buildDisplayTarifItem(item, tarifLoadItemMap.get(item.id, item.uuid), item.vehicleType));
};

export const composeOrderListWithTarifs = (
  order: OrderList,
  tarifs: OrderListTarifItem[] = [],
  tarifItems: OrderListTarifLoadItem[] = [],
): OrderList => {
  const tarifLoadItemMap = createTarifLoadItemMap(tarifItems);

  return {
    ...order,
    tarifs: tarifs.map((item) => buildDisplayTarifItem(item, tarifLoadItemMap.get(item.id, item.uuid), order.vehicleType)),
  };
};

const mapTarifReference = (item: any): OrderListTarifReference | undefined => {
  if (!item || typeof item !== 'object') return undefined;

  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    customerId: item.customer_id != null ? Number(item.customer_id) : undefined,
    loadingIn: item.loading_in ?? '',
    loadingOut: item.loading_out ?? '',
    distance: item.distance != null ? toNumber(item.distance) : undefined,
    ujTowing: item.uj_towing != null ? toNumber(item.uj_towing) : null,
    ujCdd: item.uj_cdd != null ? toNumber(item.uj_cdd) : null,
    ujFuso: item.uj_fuso != null ? toNumber(item.uj_fuso) : null,
    invCdd: item.inv_cdd != null ? toNumber(item.inv_cdd) : null,
    invFuso: item.inv_fuso != null ? toNumber(item.inv_fuso) : null,
    invTowing: item.inv_towing != null ? toNumber(item.inv_towing) : null,
    customer: mapOrderListCustomer(item.customer),
  };
};

const resolveDriverFee = (vehicleType: OrderListVehicleType | null, tarif?: OrderListTarifReference, fallback?: unknown) => {
  if (fallback != null && fallback !== '') return toNumber(fallback);
  if (!tarif || !vehicleType) return 0;
  if (vehicleType === 'towing') return toNumber(tarif.ujTowing);
  if (vehicleType === 'cdd') return toNumber(tarif.ujCdd);
  return toNumber(tarif.ujFuso);
};

const resolveInvoiceFee = (vehicleType: OrderListVehicleType | null, tarif?: OrderListTarifReference, fallback?: unknown) => {
  if (fallback != null && fallback !== '') return toNumber(fallback);
  if (!tarif || !vehicleType) return 0;
  if (vehicleType === 'towing') return toNumber(tarif.invTowing);
  if (vehicleType === 'cdd') return toNumber(tarif.invCdd);
  if (vehicleType === 'fuso') return toNumber(tarif.invFuso);
  return 0;
};

const mapOrderListTarifItem = (item: any, parent?: any): OrderListTarifItem => {
  const tarif = mapTarifReference(
    item.tarif ??
      item.tariff ??
      item.master_tarif ??
      item.do_order_list_tarif?.tarif ??
      (item.uj_towing !== undefined || item.uj_cdd !== undefined ? item : undefined)
  );
  const vehicleType = normalizeVehicleType(
    item.vehicle_type ??
      item.vehicleType ??
      item.type ??
      item.armada_type ??
      item.vehicle_armada_type ??
      item.tipe_armada ??
      item.type_armada ??
      item.armada ??
      parent?.vehicle_type ??
      parent?.vehicleType ??
      item.pivot?.vehicle_type ??
      item.pivot?.vehicleType
  );

  const tarifItems = Array.isArray(item?.do_order_list_tarif_items)
    ? item.do_order_list_tarif_items.map((entry: any) => mapOrderListTarifLoadItem(entry, item))
    : Array.isArray(item?.items)
      ? item.items.map((entry: any) => mapOrderListTarifLoadItem(entry, item))
      : [];

  return {
    id: Number(item.id ?? item.pivot?.id ?? 0),
    uuid: item.pivot?.uuid ?? item.uuid,
    doOrderListId: Number(item.do_orderlist_id ?? item.do_order_list_id ?? parent?.id ?? parent?.do_orderlist_id ?? item.pivot?.do_orderlist_id ?? item.pivot?.do_order_list_id ?? 0),
    tarifId: Number(item.tarif_id ?? item.tarif?.id ?? item.tariff?.id ?? item.do_order_list_tarif?.tarif_id ?? item.pivot?.tarif_id ?? item.id ?? 0),
    deliveryDestination: toStringValue(
      item.delivery_destination,
      item.deliveryDestination,
      item.destination,
      item.tujuan_kirim,
      item.delivery_address,
      item.do_order_list_tarif?.delivery_destination,
      item.pivot?.delivery_destination,
      item.pivot?.deliveryDestination,
    ),
    vehicleType,
    vehicleId: item.vehicle_id != null ? Number(item.vehicle_id) : null,
    driverId: item.driver_id != null ? Number(item.driver_id) : null,
    vehicle: item.vehicle ? mapOrderListVehicle(item.vehicle) : undefined,
    driver: item.driver ? {
      id: Number(item.driver.id ?? 0),
      name: item.driver.name ?? '-',
      code: item.driver.code,
    } : undefined,
    loadingIn: toStringValue(item.loading_in, item.loadingIn, tarif?.loadingIn, parent?.loading_in, parent?.loadingIn),
    loadingOut: toStringValue(item.loading_out, item.loadingOut, tarif?.loadingOut, parent?.loading_out, parent?.loadingOut),
    loadContent: toStringValue(item.load_content, item.muatan, item.loadContent, item.pivot?.load_content, item.pivot?.muatan),
    qty: item.qty != null ? toNumber(item.qty) : (item.pivot?.qty != null ? toNumber(item.pivot.qty) : undefined),
    driverFee: resolveDriverFee(
      vehicleType,
      tarif,
      item.uj_driver ?? item.driver_fee ?? item.pivot?.uj_driver ?? item.pivot?.driver_fee ?? item.pivot?.driverFee
    ),
    expeditionInvoice: resolveInvoiceFee(
      vehicleType,
      tarif,
      item.bill_invoice ?? item.invoice_bill ?? item.invoice_fee ?? item.pivot?.bill_invoice ?? item.pivot?.invoice_bill ?? item.pivot?.expeditionInvoice
    ),
    tarifItems: tarifItems.length ? tarifItems : undefined,
    tarif,
    createdAt: item.created_at ?? item.pivot?.created_at,
    updatedAt: item.updated_at ?? item.pivot?.updated_at,
  };
};

const mapOrderListTarifLoadItem = (item: any, parentTarif?: any): OrderListTarifLoadItem => {
  const parent = item?.do_order_list_tarif ?? parentTarif;
  return {
    id: Number(item?.id ?? 0),
    uuid: item?.uuid,
    doOrderListTarifId: Number(item?.do_order_list_tarif_id ?? parent?.id ?? parent?.pivot?.id ?? 0),
    doOrderListTarifUuid: item?.do_order_list_tarif?.uuid ?? parent?.uuid ?? parent?.pivot?.uuid ?? undefined,
    doOrderListId: Number(parent?.do_orderlist_id ?? parent?.do_order_list_id ?? parent?.pivot?.do_orderlist_id ?? parent?.pivot?.do_order_list_id ?? 0) || undefined,
    loadContent: toStringValue(item?.load_content, item?.muatan, item?.loadContent),
    qty: toNumber(item?.qty),
    createdAt: item?.created_at,
    updatedAt: item?.updated_at,
  };
};

const mapOrderList = (item: any): OrderList => {
  const dataItem = item?.do_order_list ?? item;
  
  const tarifSource = Array.isArray(dataItem?.do_order_list_tarifs)
    ? dataItem.do_order_list_tarifs
    : Array.isArray(dataItem?.tarifs)
      ? dataItem.tarifs
      : Array.isArray(dataItem?.do_orderlist_tarifs)
        ? dataItem.do_orderlist_tarifs
        : [];
  const tarifItemSource = Array.isArray(dataItem?.do_order_list_tarif_items)
    ? dataItem.do_order_list_tarif_items
    : Array.isArray(dataItem?.order_list_tarif_items)
      ? dataItem.order_list_tarif_items
      : [];
  const tarifs = composeOrderListTarifs(tarifSource.map((entry: any) => mapOrderListTarifItem(entry, dataItem)), tarifItemSource.map((entry: any) => mapOrderListTarifLoadItem(entry)));
  const firstTarif = tarifs[0];

  return {
    id: Number(dataItem?.id ?? 0),
    uuid: dataItem?.uuid,
    code: dataItem?.code ?? '-',
    customerId: Number(dataItem?.customer_id ?? dataItem?.customer?.id ?? 0),
    status: (dataItem?.status ?? 'draft') as OrderList['status'],
    vehicleType: normalizeVehicleType(dataItem?.vehicle_type ?? dataItem?.vehicleType ?? firstTarif?.vehicleType),
    billInvoice: toNumber(dataItem?.bill_invoice ?? dataItem?.invoice_bill),
    ppn: toNumber(dataItem?.ppn),
    pph: toNumber(dataItem?.pph),
    note: toStringValue(dataItem?.note, dataItem?.notes, dataItem?.keterangan, dataItem?.description, dataItem?.remark),
    ujDriver: toNumber(dataItem?.uj_driver ?? firstTarif?.driverFee),
    loadingIn: toStringValue(dataItem?.loading_in, dataItem?.loadingIn, firstTarif?.loadingIn),
    loadingOut: toStringValue(dataItem?.loading_out, dataItem?.loadingOut, firstTarif?.loadingOut),
    deliveryDestination: toStringValue(dataItem?.do_delivery_destination, firstTarif?.deliveryDestination),
    ujTowing: dataItem?.uj_towing != null ? toNumber(dataItem.uj_towing) : null,
    ujCdd: dataItem?.uj_cdd != null ? toNumber(dataItem.uj_cdd) : null,
    ujFuso: dataItem?.uj_fuso != null ? toNumber(dataItem.uj_fuso) : null,
    invTowing: dataItem?.inv_towing != null ? toNumber(dataItem.inv_towing) : null,
    invCdd: dataItem?.inv_cdd != null ? toNumber(dataItem.inv_cdd) : null,
    invFuso: dataItem?.inv_fuso != null ? toNumber(dataItem.inv_fuso) : null,
    vehicles: Array.isArray(dataItem?.vehicles) ? dataItem.vehicles.map(mapOrderListVehicle) : [],
    customer: mapOrderListCustomer(dataItem?.customer),
    tarifs,
    expeditions: Array.isArray(dataItem?.expeditions) ? dataItem.expeditions : [],
    createdAt: dataItem?.created_at,
    updatedAt: dataItem?.updated_at,
  };
};

const buildCreateOrderListBody = (payload: CreateOrderListPayload) => {
  const body = new FormData();
  body.append('customer_id', String(payload.customer_id));
  body.append('company_id', String(payload.company_id));
  if (payload.description != null) body.append('description', payload.description);
  return body;
};

const buildUpdateOrderListBody = (payload: UpdateOrderListPayload) => {
  const body = new URLSearchParams();
  body.append('customer_id', String(payload.customer_id));
  body.append('status', payload.status);
  body.append('invoice_bill', String(payload.invoice_bill));
  body.append('bill_invoice', String(payload.bill_invoice ?? payload.invoice_bill));
  if (payload.vehicle_type) body.append('vehicle_type', payload.vehicle_type);
  if (payload.description != null) body.append('description', payload.description);
  else if (payload.note != null) body.append('description', payload.note);
  if (payload.uj_driver != null) body.append('uj_driver', String(payload.uj_driver));
  if (payload.loading_in != null) body.append('loading_in', payload.loading_in);
  if (payload.loading_out != null) body.append('loading_out', payload.loading_out);
  return body;
};

const buildCreateOrderListTarifBody = (payload: CreateOrderListTarifPayload) => {
  const body = new FormData();
  body.append('do_orderlist_id', String(payload.do_orderlist_id));
  body.append('tarif_id', String(payload.tarif_id));
  body.append('vehicle_type', payload.vehicle_type);
  body.append('delivery_destination', payload.delivery_destination);
  body.append('vehicle_id', String(payload.vehicle_id));
  body.append('driver_id', String(payload.driver_id));
  return body;
};

const buildUpdateOrderListTarifBody = (payload: UpdateOrderListTarifPayload) => {
  const body = new URLSearchParams();
  body.append('delivery_destination', payload.delivery_destination);
  if (payload.tarif_id != null) body.append('tarif_id', String(payload.tarif_id));
  if (payload.vehicle_type != null) body.append('vehicle_type', payload.vehicle_type);
  if (payload.vehicle_id != null) body.append('vehicle_id', String(payload.vehicle_id));
  if (payload.driver_id != null) body.append('driver_id', String(payload.driver_id));
  return body;
};

const buildCreateOrderListTarifItemBody = (payload: CreateOrderListTarifItemPayload) => {
  const body = new FormData();
  body.append('do_order_list_tarif_id', String(payload.do_order_list_tarif_id));
  body.append('load_content', payload.load_content);
  body.append('qty', String(payload.qty));
  return body;
};

const buildUpdateOrderListTarifItemBody = (payload: UpdateOrderListTarifItemPayload) => {
  const body = new URLSearchParams();
  body.append('do_order_list_tarif_id', String(payload.do_order_list_tarif_id));
  body.append('load_content', payload.load_content);
  body.append('qty', String(payload.qty));
  return body;
};

export const getOrderLists = async (params: OrderListListParams): Promise<OrderListListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(orderListBasePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      order_by: params.order_by ?? 'created_at',
      order_sort: params.order_sort ?? 'desc',
      company_id: params.company_id,
      start_date: params.start_date,
      end_date: params.end_date,
    },
  });

  const payload = ensureSuccess(response.data);
  return toPaginatedResult(payload, mapOrderList);
};

export const getOrderListById = async (id: string | number): Promise<OrderList> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${orderListBasePath}/${id}`);
  return mapOrderList(ensureSuccess(response.data));
};

export const createOrderList = async (payload: CreateOrderListPayload): Promise<OrderList> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(orderListBasePath, buildCreateOrderListBody(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapOrderList(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateOrderList = async (id: string | number, payload: UpdateOrderListPayload): Promise<OrderList> => {
  try {
    const response = await apiClient.put<LaravelApiResponse<any>>(`${orderListBasePath}/${id}`, buildUpdateOrderListBody(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapOrderList(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateOrderListState = async (id: string | number, payload: UpdateOrderListStatePayload): Promise<OrderList> => {
  const body = new URLSearchParams();
  body.append('status', payload.status);
  const response = await apiClient.put<LaravelApiResponse<any>>(`${orderListBasePath}/${id}/update-state`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return mapOrderList(ensureSuccess(response.data));
};

export const deleteOrderList = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${orderListBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete order list');
  }
};

export const getOrderListTarifs = async (params: OrderListTarifListParams): Promise<OrderListTarifListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(orderListTarifBasePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      order_by: params.order_by ?? 'created_at',
      order_sort: params.order_sort ?? 'desc',
      do_orderlist_id: params.do_orderlist_id,
    },
  });

  const payload = ensureSuccess(response.data);
  return toPaginatedResult(payload, (item) => mapOrderListTarifItem(item));
};

export const getOrderListTarifById = async (id: string | number): Promise<OrderListTarifItem> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${orderListTarifBasePath}/${id}`);
  return mapOrderListTarifItem(ensureSuccess(response.data));
};

export const createOrderListTarif = async (payload: CreateOrderListTarifPayload): Promise<OrderListTarifItem> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(orderListTarifBasePath, buildCreateOrderListTarifBody(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapOrderListTarifItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateOrderListTarif = async (id: string | number, payload: UpdateOrderListTarifPayload): Promise<OrderListTarifItem> => {
  try {
    const response = await apiClient.put<LaravelApiResponse<any>>(`${orderListTarifBasePath}/${id}`, buildUpdateOrderListTarifBody(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapOrderListTarifItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteOrderListTarif = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${orderListTarifBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete order list tarif');
  }
};

export const getOrderListTarifItems = async (params: OrderListTarifItemListParams): Promise<OrderListTarifItemListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(orderListTarifItemBasePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      search: params.search,
      order_by: params.order_by ?? 'created_at',
      order_sort: params.order_sort ?? 'desc',
      do_order_list_tarif_id: params.do_order_list_tarif_id,
      do_orderlist_id: params.do_orderlist_id,
    },
  });

  const payload = ensureSuccess(response.data);
  return toPaginatedResult(payload, (item) => mapOrderListTarifLoadItem(item));
};

export const getOrderListTarifItemById = async (id: string | number): Promise<OrderListTarifLoadItem> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${orderListTarifItemBasePath}/${id}`);
  return mapOrderListTarifLoadItem(ensureSuccess(response.data));
};

export const createOrderListTarifItem = async (payload: CreateOrderListTarifItemPayload): Promise<OrderListTarifLoadItem> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(orderListTarifItemBasePath, buildCreateOrderListTarifItemBody(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapOrderListTarifLoadItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateOrderListTarifItem = async (id: string | number, payload: UpdateOrderListTarifItemPayload): Promise<OrderListTarifLoadItem> => {
  try {
    const response = await apiClient.put<LaravelApiResponse<any>>(`${orderListTarifItemBasePath}/${id}`, buildUpdateOrderListTarifItemBody(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapOrderListTarifLoadItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteOrderListTarifItem = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${orderListTarifItemBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete order list tarif item');
  }
};

export interface OrderListFormulaResponse {
  vehicle_type: OrderListVehicleType;
  bill_invoice: number;
  uj_driver: number;
  ppn: {
    name: string;
    rate: number;
    value: number;
  };
  pph: {
    name: string;
    rate: number;
    value: number;
  };
  grand_total: number;
  total_billing: number;
}

export const getOrderListFormula = async (params: {
  vehicle_type: OrderListVehicleType;
  tarif_ids: number[];
  bill_invoice: number;
}): Promise<OrderListFormulaResponse> => {
  const response = await apiClient.get<LaravelApiResponse<OrderListFormulaResponse>>(
    `${orderListBasePath}/get-formula`,
    {
      params: {
        vehicle_type: params.vehicle_type,
        tarif_ids: JSON.stringify(params.tarif_ids),
        bill_invoice: params.bill_invoice,
      },
    }
  );
  return ensureSuccess(response.data);
};
