import type {
  DoEkspedisi,
  ApplyExpeditionClaimPayload,
  DoEkspedisiCustomer,
  DoEkspedisiClaim,
  DoEkspedisiClaimApplication,
  DoEkspedisiClaimDocumentation,
  DoEkspedisiDriverNote,
  DoEkspedisiExpense,
  DoEkspedisiDriver,
  DoEkspedisiItem,
  DoEkspedisiItemDestination,
  DoEkspedisiItemDestinationListParams,
  DoEkspedisiItemDestinationListResponse,
  DoEkspedisiItemDestinationPayload,
  DoEkspedisiItemListParams,
  DoEkspedisiItemListResponse,
  DoEkspedisiItemPayload,
  DoEkspedisiListParams,
  DoEkspedisiListResponse,
  DoEkspedisiPayload,
  DoEkspedisiOrderTarifLoadItem,
  DoEkspedisiVehicle,
  LookupOption,
} from '@/@types/do-ekspedisi.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError, ApiValidationError, ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const expeditionBasePath = '/wapi/transaction/do-expedition';
const expeditionItemBasePath = '/wapi/transaction/do-expedition-item';
const expeditionItemDestinationBasePath = '/wapi/transaction/do-expedition-item-destination';
const customerLookupPath = '/wapi/master-data/customer';
const vehicleLookupPath = '/wapi/master-data/vehicle-fleet';
const driverLookupPath = '/wapi/master-data/driver';
export const driverNotePath = '/wapi/transaction/driver-note';
export const expeditionExpensePath = '/wapi/transaction/expedition-expense';
export const expeditionClaimPath = '/wapi/transaction/expedition-claim';
export const claimDocumentationPath = '/wapi/transaction/expedition-claim-documentation';

const toNumber = (value: unknown) => {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
};

const normalizePagination = <T>(payload: any, fallbackMapper?: (item: any) => T) => {
  if (payload && Array.isArray(payload.data) && typeof payload.current_page !== 'undefined') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return {
      data: payload,
      current_page: 1,
      per_page: payload.length || 10,
      total: payload.length,
      last_page: 1,
    };
  }

  if (payload && typeof payload === 'object') {
    const single = fallbackMapper ? fallbackMapper(payload) : payload;
    return {
      data: [single],
      current_page: 1,
      per_page: 1,
      total: 1,
      last_page: 1,
    };
  }

  return {
    data: [],
    current_page: 1,
    per_page: 25,
    total: 0,
    last_page: 1,
  };
};

const mapVehicle = (item: any): DoEkspedisiVehicle => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  registrationNumber: item?.registration_number ?? '',
  type: item?.type ?? '',
});

const mapDriver = (item: any): DoEkspedisiDriver => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  name: item?.name ?? '',
  phone: item?.phone ?? null,
});

const mapCustomer = (item: any): DoEkspedisiCustomer => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  name: item?.name ?? '',
  address: item?.address ?? null,
  phone: item?.phone ?? null,
  pic: item?.pic ?? item?.pic_name ?? null,
  companyList: item?.company_list ?? null,
});

const mapClaimDocumentation = (item: any): DoEkspedisiClaimDocumentation => ({
  id: Number(item?.id ?? 0), uuid: item?.uuid,
  doExpeditionClaimId: Number(item?.do_expedition_claim_id ?? item?.expedition_claim_id ?? 0),
  image: item?.image ?? null, caption: item?.caption ?? '',
});

const mapDriverNote = (item: any): DoEkspedisiDriverNote => ({
  id: Number(item?.id ?? 0), uuid: item?.uuid,
  doExpeditionsId: Number(item?.do_expeditions_id ?? item?.do_expedition_id ?? 0),
  effectiveDate: item?.effective_date ?? '', subject: item?.subject ?? '',
  image: item?.image ?? null, description: item?.description ?? '',
});

const mapExpense = (item: any): DoEkspedisiExpense => ({
  id: Number(item?.id ?? 0), uuid: item?.uuid,
  doExpeditionsId: Number(item?.do_expeditions_id ?? item?.do_expedition_id ?? 0),
  driverId: item?.driver_id == null ? null : Number(item.driver_id), subject: item?.subject ?? '',
  description: item?.description ?? '', nominal: toNumber(item?.nominal),
});

const mapClaim = (item: any): DoEkspedisiClaim => ({
  id: Number(item?.id ?? 0), uuid: item?.uuid,
  doExpeditionsId: Number(item?.do_expeditions_id ?? item?.do_expedition_id ?? 0),
  driverId: Number(item?.driver_id ?? 0), subject: item?.subject ?? '', description: item?.description ?? '',
  isClaim: Boolean(item?.is_claim), claimNominal: toNumber(item?.claim_nominal),
  nominal: toNumber(item?.nominal ?? item?.claim_nominal), remainingNominal: toNumber(item?.remaining_nominal),
  appliedNominal: Math.max(0, toNumber(item?.claim_nominal) - toNumber(item?.remaining_nominal)),
  sourceExpeditionCode: toText(item?.expedition?.code, item?.source_expedition_code),
  documentations: (item?.documentations ?? item?.expedition_claim_documentations ?? []).map(mapClaimDocumentation),
});

const mapClaimApplication = (item: any): DoEkspedisiClaimApplication => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  doExpeditionId: Number(item?.do_expedition_id ?? 0),
  doExpeditionClaimId: Number(item?.do_expedition_claim_id ?? 0),
  driverId: Number(item?.driver_id ?? 0),
  nominal: toNumber(item?.nominal),
  type: item?.type === 'transfer' ? 'transfer' : 'cash',
  date: item?.date ?? '',
  claim: item?.claim ? mapClaim(item.claim) : null,
});

const mapDoOrderTarifItem = (entry: any, parent?: any) => {
  const pivot = entry?.pivot ?? entry;
  const tarifItems = Array.isArray(entry?.do_order_list_tarif_items)
    ? entry.do_order_list_tarif_items.map((item: any): DoEkspedisiOrderTarifLoadItem => ({
        id: Number(item?.id ?? 0),
        uuid: item?.uuid,
        loadContent: toText(item?.load_content, item?.muatan, item?.loadContent),
        qty: toNumber(item?.qty),
      }))
    : [];
  const primaryTarifItem = tarifItems[0];

  return {
    id: Number(pivot?.id ?? entry?.id ?? 0),
    uuid: pivot?.uuid ?? entry?.uuid,
    loadingIn: toText(pivot?.loading_in, entry?.loading_in, entry?.tarif?.loading_in, parent?.loading_in),
    loadingOut: toText(pivot?.loading_out, entry?.loading_out, entry?.tarif?.loading_out, parent?.loading_out),
    deliveryDestination: toText(
      pivot?.delivery_destination,
      pivot?.destination,
      entry?.delivery_destination,
      entry?.destination,
    ),
    loadContent: toText(pivot?.load_content, pivot?.muatan, entry?.load_content, entry?.muatan, primaryTarifItem?.loadContent),
    qty: toNumber(pivot?.qty ?? entry?.qty ?? primaryTarifItem?.qty),
    tarifItems: tarifItems.length ? tarifItems : undefined,
  };
};

const mapDoOrderList = (item: any, selectedTarif?: any) => {
  if (!item || typeof item !== 'object') return null;

  const tarifSource = Array.isArray(item.tarifs)
    ? item.tarifs
    : Array.isArray(item.do_order_list_tarifs)
      ? item.do_order_list_tarifs
      : Array.isArray(item.do_orderlist_tarifs)
        ? item.do_orderlist_tarifs
        : selectedTarif
          ? [selectedTarif]
          : [];
  const tarifs = tarifSource.map((entry: any) => mapDoOrderTarifItem(entry, item));
  const firstTarif = tarifs[0];
  const customer = item.customer ? mapCustomer(item.customer) : null;

  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    code: toText(item.code),
    description: toText(item.description, item.note),
    status: String(item.status ?? ''),
    customer,
    customerName: toText(customer?.name, item.customer_name),
    loadingIn: toText(item.loading_in, firstTarif?.loadingIn),
    loadingOut: toText(item.loading_out, firstTarif?.loadingOut),
    destination: toText(firstTarif?.deliveryDestination, item.do_delivery_destination),
    loadContent: toText(firstTarif?.loadContent),
    qty: toNumber(firstTarif?.qty),
    tarifs,
    vehicleType: String(selectedTarif?.vehicle_type ?? item?.vehicle_type ?? item?.vehicleType ?? item?.type ?? '').trim().toLowerCase(),
    billInvoice: toNumber(item.bill_invoice),
    ppn: toNumber(item.ppn),
    pph: toNumber(item.pph),
    ujDriver: toNumber(item.uj_driver),
    ujTowing: item.uj_towing == null ? null : toNumber(item.uj_towing),
    ujCdd: item.uj_cdd == null ? null : toNumber(item.uj_cdd),
    ujFuso: item.uj_fuso == null ? null : toNumber(item.uj_fuso),
    invTowing: item.inv_towing == null ? null : toNumber(item.inv_towing),
    invCdd: item.inv_cdd == null ? null : toNumber(item.inv_cdd),
    invFuso: item.inv_fuso == null ? null : toNumber(item.inv_fuso),
  };
};

const mapDoEkspedisiItemDestination = (item: any): DoEkspedisiItemDestination => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  doExpeditionItemId: Number(item?.do_expedition_item_id ?? item?.do_expedition_item?.id ?? 0),
  destination: item?.destination ?? '',
  driverNote: item?.driver_note ?? '',
  orderNumber: Number(item?.order_number ?? 0),
  mapsUrl: item?.maps_url ?? '',
  createdAt: item?.created_at,
  updatedAt: item?.updated_at,
});

const mapDoEkspedisiItem = (item: any): DoEkspedisiItem => {
  const destinations = Array.isArray(item?.destinations)
    ? item.destinations.map(mapDoEkspedisiItemDestination)
    : Array.isArray(item?.do_expedition_item_destinations)
      ? item.do_expedition_item_destinations.map(mapDoEkspedisiItemDestination)
      : Array.isArray(item?.expedition_destinations)
        ? item.expedition_destinations.map(mapDoEkspedisiItemDestination)
        : [];
  const primaryDestination = destinations.find((destination: DoEkspedisiItemDestination) => destination.orderNumber === 1) ?? destinations[0];

  return {
    id: Number(item?.id ?? 0),
    uuid: item?.uuid,
    doExpeditionId: Number(item?.do_expedition_id ?? item?.expedition?.id ?? 0),
    customerId: Number(item?.customer_id ?? item?.customer?.id ?? 0),
    customerName: item?.customer?.name ?? '',
    loadingIn: item?.loading_in ?? '',
    loadingOut: item?.loading_out ?? '',
    destination: item?.destination ?? primaryDestination?.destination ?? '',
    invoiceFee: toNumber(item?.invoice_fee),
    additionalCostFee: toNumber(item?.additional_cost_fee),
    otherFee: toNumber(item?.other_fee),
    driverFee: toNumber(item?.driver_fee),
    driverNote: item?.driver_note ?? primaryDestination?.driverNote ?? '',
    mapsUrl: item?.maps_url ?? primaryDestination?.mapsUrl ?? '',
    ppnFee: toNumber(item?.ppn_fee),
    serviceFee: toNumber(item?.service_fee),
    pphFee: toNumber(item?.pph_fee),
    destinations: destinations.length > 0 ? destinations : undefined,
    customer: item?.customer ? mapCustomer(item.customer) : undefined,
    createdAt: item?.created_at,
    updatedAt: item?.updated_at,
  };
};

const mapDoEkspedisi = (item: any): DoEkspedisi => {
  const orderListTarif = item?.orderListTarif ?? item?.order_list_tarif;
  const rawVehicle = item?.vehicle ?? orderListTarif?.vehicle;
  const rawDriver = item?.driver ?? orderListTarif?.driver;
  const rawOrderList = item?.do_order_list ?? item?.do_orderlist ?? item?.order_list ?? orderListTarif?.doOrderList ?? orderListTarif?.do_order_list;
  
  return {
    id: Number(item?.id ?? 0),
    uuid: item?.uuid,
    doCode: toText(item?.do_code, item?.code),
    orderCode: toText(rawOrderList?.code, item?.orderCode, item?.order_code),
    date: item?.date ?? '',
    vehicleId: item?.vehicle_id == null ? (orderListTarif?.vehicle_id == null ? null : Number(orderListTarif.vehicle_id)) : Number(item.vehicle_id),
    driverId: item?.driver_id == null ? (orderListTarif?.driver_id == null ? null : Number(orderListTarif.driver_id)) : Number(item.driver_id),
    driverNote: toText(item?.driver_note, item?.note),
    itemsCount: Number(item?.items_count ?? item?.items?.length ?? 0),
    bruttoValue: toNumber(item?.brutto_value),
    totalPpn: toNumber(item?.total_ppn),
    totalPph: toNumber(item?.total_pph),
    totalServiceFee: toNumber(item?.total_service_fee),
    totalAdditionalCost: toNumber(item?.total_additional_cost),
    totalOtherFee: toNumber(item?.total_other_fee),
    totalDriverFee: toNumber(item?.total_driver_fee),
    vehicle: rawVehicle ? mapVehicle(rawVehicle) : null,
    driver: rawDriver ? mapDriver(rawDriver) : null,
    orderList: mapDoOrderList(rawOrderList, orderListTarif),
    items: Array.isArray(item?.items) ? item.items.map(mapDoEkspedisiItem) : undefined,
    createdAt: item?.created_at,
    updatedAt: item?.updated_at,
    status: String(item?.status ?? 'draft'),
    ujNominal: toNumber(item?.uj_nominal ?? item?.ujNominal),
    ujNominalBeforeClaim: toNumber(item?.uj_nominal_before_claim ?? item?.uj_nominal ?? item?.ujNominal),
    claimDeductionNominal: toNumber(item?.claim_deduction_nominal),
    startDate: item?.start_date ?? null,
    endDate: item?.end_date ?? null,
    doOrderListTarifId: Number(item?.do_order_list_tarif_id ?? item?.doOrderListTarifId ?? 0),
    targetStartDate: item?.target_start_date ?? item?.targetStartDate ?? null,
    targetEndDate: item?.target_end_date ?? item?.targetEndDate ?? null,
    driverNotes: (item?.driver_notes ?? []).map(mapDriverNote),
    expeditionExpenses: (item?.expedition_expenses ?? []).map(mapExpense),
    expeditionClaims: (item?.expedition_claims ?? []).map(mapClaim),
    driverExpeditionClaims: (item?.driver_expedition_claims ?? []).map(mapClaimApplication),
  };
};

const enrichVehiclesWithType = async (items: DoEkspedisi[]): Promise<DoEkspedisi[]> => {
  const missingVehicleIds = Array.from(
    new Set(
      items
        .filter((item) => item.vehicleId && (!item.vehicle?.type || !item.vehicle.type.trim()))
        .map((item) => Number(item.vehicleId)),
    ),
  );

  if (missingVehicleIds.length === 0) {
    return items;
  }

  const vehicleEntries = await Promise.all(
    missingVehicleIds.map(async (vehicleId) => {
      try {
        const response = await apiClient.get<LaravelApiResponse<any>>(`${vehicleLookupPath}/${vehicleId}`);
        const vehicle = mapVehicle(ensureSuccess(response.data));
        return [vehicleId, vehicle] as const;
      } catch {
        return [vehicleId, null] as const;
      }
    }),
  );

  const vehicleMap = new Map<number, DoEkspedisiVehicle | null>(vehicleEntries);

  return items.map((item) => {
    if (!item.vehicleId) return item;

    const enrichedVehicle = vehicleMap.get(Number(item.vehicleId));
    if (!enrichedVehicle) return item;

    return {
      ...item,
      vehicle: {
        ...enrichedVehicle,
        registrationNumber: item.vehicle?.registrationNumber || enrichedVehicle.registrationNumber,
      },
    };
  });
};

const buildMainPayload = (payload: DoEkspedisiPayload, asUpdate = false) => {
  if (!asUpdate) {
    const formData = new FormData();
    if (payload.date != null) formData.append('date', payload.date);
    if (payload.vehicle_id != null) formData.append('vehicle_id', String(payload.vehicle_id));
    if (payload.driver_id != null) formData.append('driver_id', String(payload.driver_id));
    if (payload.driver_note != null) {
      formData.append('driver_note', payload.driver_note);
      formData.append('note', payload.driver_note);
    }
    if (payload.status != null) {
      formData.append('status', payload.status);
    }
    if (payload.do_order_list_tarif_id != null) {
      formData.append('do_order_list_tarif_id', String(payload.do_order_list_tarif_id));
    }
    if (payload.uj_nominal != null) {
      formData.append('uj_nominal', String(payload.uj_nominal));
    }
    if (payload.target_start_date !== undefined) {
      formData.append('target_start_date', payload.target_start_date ?? '');
    }
    if (payload.target_end_date !== undefined) {
      formData.append('target_end_date', payload.target_end_date ?? '');
    }
    return formData;
  }

  const params = new URLSearchParams();
  if (payload.date != null) params.append('date', payload.date);
  if (payload.vehicle_id != null) params.append('vehicle_id', String(payload.vehicle_id));
  if (payload.driver_id != null) params.append('driver_id', String(payload.driver_id));
  if (payload.driver_note != null) {
    params.append('driver_note', payload.driver_note);
    params.append('note', payload.driver_note);
  }
  if (payload.status != null) {
    params.append('status', payload.status);
  }
  if (payload.start_date !== undefined) {
    params.append('start_date', payload.start_date ?? '');
  }
  if (payload.end_date !== undefined) {
    params.append('end_date', payload.end_date ?? '');
  }
  if (payload.do_order_list_tarif_id != null) {
    params.append('do_order_list_tarif_id', String(payload.do_order_list_tarif_id));
  }
  if (payload.uj_nominal != null) {
    params.append('uj_nominal', String(payload.uj_nominal));
  }
  if (payload.target_start_date !== undefined) {
    params.append('target_start_date', payload.target_start_date ?? '');
  }
  if (payload.target_end_date !== undefined) {
    params.append('target_end_date', payload.target_end_date ?? '');
  }
  return params;
};

const buildItemPayload = (payload: DoEkspedisiItemPayload, asUpdate = false) => {
  if (!asUpdate) {
    const formData = new FormData();
    formData.append('do_expedition_id', String(payload.do_expedition_id));
    formData.append('customer_id', String(payload.customer_id));
    formData.append('loading_in', payload.loading_in);
    formData.append('loading_out', payload.loading_out);
    formData.append('destination', payload.destination);
    formData.append('invoice_fee', String(payload.invoice_fee));
    formData.append('additional_cost_fee', String(payload.additional_cost_fee));
    formData.append('other_fee', String(payload.other_fee));
    formData.append('driver_fee', String(payload.driver_fee));
    formData.append('driver_note', payload.driver_note);
    formData.append('maps_url', payload.maps_url);
    return formData;
  }

  const params = new URLSearchParams();
  params.append('do_expedition_id', String(payload.do_expedition_id));
  params.append('customer_id', String(payload.customer_id));
  params.append('loading_in', payload.loading_in);
  params.append('loading_out', payload.loading_out);
  params.append('destination', payload.destination);
  params.append('invoice_fee', String(payload.invoice_fee));
  params.append('additional_cost_fee', String(payload.additional_cost_fee));
  params.append('other_fee', String(payload.other_fee));
  params.append('driver_fee', String(payload.driver_fee));
  params.append('driver_note', payload.driver_note);
  params.append('maps_url', payload.maps_url);
  return params;
};

const buildDestinationPayload = (payload: DoEkspedisiItemDestinationPayload, asUpdate = false) => {
  if (!asUpdate) {
    const formData = new FormData();
    formData.append('destination', payload.destination);
    formData.append('driver_note', payload.driver_note);
    formData.append('order_number', String(payload.order_number));
    formData.append('do_expedition_item_id', String(payload.do_expedition_item_id));
    formData.append('maps_url', payload.maps_url);
    return formData;
  }

  const params = new URLSearchParams();
  params.append('destination', payload.destination);
  params.append('driver_note', payload.driver_note);
  params.append('order_number', String(payload.order_number));
  params.append('do_expedition_item_id', String(payload.do_expedition_item_id));
  params.append('maps_url', payload.maps_url);
  return params;
};

export const getDoEkspedisis = async (
  params: PaginationParams & DoEkspedisiListParams,
): Promise<DoEkspedisiListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(expeditionBasePath, {
    params: {
      search: params.search?.trim() || undefined,
      order_by: params.order_by ?? 'created_at',
      order_sort: params.order_sort ?? 'desc',
      page: params.page ?? 1,
      per_page: params.perPage ?? 10,
      do_order_list_id: params.do_order_list_id,
    },
  });

  const payload = ensureSuccess(response.data);
  const normalized = normalizePagination(payload);
  const mappedItems = (normalized.data ?? []).map(mapDoEkspedisi);
  const enrichedItems = await enrichVehiclesWithType(mappedItems);

  return toPaginatedResult(
    {
      ...normalized,
      data: enrichedItems,
    },
    (item) => item as DoEkspedisi,
  );
};

export const getDoEkspedisiById = async (id: string | number): Promise<DoEkspedisi> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${expeditionBasePath}/${id}`);
  return mapDoEkspedisi(ensureSuccess(response.data));
};

export const createDoEkspedisi = async (payload: DoEkspedisiPayload): Promise<DoEkspedisi> => {
  try {
    const body = buildMainPayload(payload);
    const response = await apiClient.post<LaravelApiResponse<any>>(expeditionBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return mapDoEkspedisi(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateDoEkspedisi = async (id: string | number, payload: DoEkspedisiPayload): Promise<DoEkspedisi> => {
  try {
    const body = buildMainPayload(payload, true);
    const response = await apiClient.put<LaravelApiResponse<any>>(`${expeditionBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return mapDoEkspedisi(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteDoEkspedisi = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${expeditionBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete DO expedition');
  }
};

export const getNextDoEkspedisiCode = async (): Promise<string> => {
  const response = await apiClient.get<LaravelApiResponse<{ next_code?: string }>>('/wapi/transaction/check-do-expedition-code');
  const payload = ensureSuccess(response.data);
  return payload.next_code ?? '';
};

export const getDoEkspedisiItems = async (
  params: PaginationParams & DoEkspedisiItemListParams,
): Promise<DoEkspedisiItemListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(expeditionItemBasePath, {
    params: {
      order_by: params.order_by ?? 'created_at',
      order_sort: params.order_sort ?? 'desc',
      page: params.page ?? 1,
      per_page: params.perPage ?? 10,
      loading_in: params.loading_in?.trim() || undefined,
      loading_out: params.loading_out?.trim() || undefined,
      destination: params.destination?.trim() || undefined,
      do_expedition_id: params.do_expedition_id,
      customer_id: params.customer_id,
    },
  });

  const payload = ensureSuccess(response.data);
  const normalized = normalizePagination(payload);

  return toPaginatedResult(normalized, mapDoEkspedisiItem);
};

export const getDoEkspedisiItemById = async (id: string | number): Promise<DoEkspedisiItem> => {
  try {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${expeditionItemBasePath}/${id}`);
    return mapDoEkspedisiItem(ensureSuccess(response.data));
  } catch {
    const fallback = await apiClient.get<LaravelApiResponse<any>>(`${expeditionBasePath}/${id}`);
    return mapDoEkspedisiItem(ensureSuccess(fallback.data));
  }
};

export const getDoEkspedisiItemDestinations = async (
  params: PaginationParams & DoEkspedisiItemDestinationListParams,
): Promise<DoEkspedisiItemDestinationListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(expeditionItemDestinationBasePath, {
    params: {
      order_by: params.order_by ?? 'order_number',
      order_sort: params.order_sort ?? 'asc',
      page: params.page ?? 1,
      per_page: params.perPage ?? 50,
      destination: params.destination?.trim() || undefined,
      do_expedition_item_id: params.do_expedition_item_id,
    },
  });

  const payload = ensureSuccess(response.data);
  const normalized = normalizePagination(payload);

  return toPaginatedResult(normalized, mapDoEkspedisiItemDestination);
};

export const getDoEkspedisiItemDestinationById = async (id: string | number): Promise<DoEkspedisiItemDestination> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${expeditionItemDestinationBasePath}/${id}`);
  return mapDoEkspedisiItemDestination(ensureSuccess(response.data));
};

export const createDoEkspedisiItem = async (payload: DoEkspedisiItemPayload): Promise<DoEkspedisiItem> => {
  try {
    const body = buildItemPayload(payload);
    const response = await apiClient.post<LaravelApiResponse<any>>(expeditionItemBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return mapDoEkspedisiItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const createDoEkspedisiItemDestination = async (payload: DoEkspedisiItemDestinationPayload): Promise<DoEkspedisiItemDestination> => {
  try {
    const body = buildDestinationPayload(payload);
    const response = await apiClient.post<LaravelApiResponse<any>>(expeditionItemDestinationBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return mapDoEkspedisiItemDestination(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateDoEkspedisiItem = async (id: string | number, payload: DoEkspedisiItemPayload): Promise<DoEkspedisiItem> => {
  try {
    const body = buildItemPayload(payload, true);
    const response = await apiClient.put<LaravelApiResponse<any>>(`${expeditionItemBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return mapDoEkspedisiItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateDoEkspedisiItemDestination = async (
  id: string | number,
  payload: DoEkspedisiItemDestinationPayload,
): Promise<DoEkspedisiItemDestination> => {
  try {
    const body = buildDestinationPayload(payload, true);
    const response = await apiClient.put<LaravelApiResponse<any>>(`${expeditionItemDestinationBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return mapDoEkspedisiItemDestination(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteDoEkspedisiItem = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${expeditionItemBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete DO expedition item');
  }
};

export const deleteDoEkspedisiItemDestination = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${expeditionItemDestinationBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete DO expedition item destination');
  }
};

const mapLookupResult = (data: any[], mapper: (item: any) => LookupOption) => data.map(mapper);

export const lookupDoEkspedisiCustomers = async (search = ''): Promise<LookupOption[]> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(customerLookupPath, {
    params: {
      search: search.trim() || undefined,
      page: 1,
      per_page: 20,
    },
  });

  const payload = ensureSuccess(response.data);
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return mapLookupResult(list, (item) => ({
    id: Number(item.id),
    label: item.name ?? '',
    subtitle: item.code ?? item.phone ?? undefined,
  }));
};

export const lookupDoEkspedisiVehicles = async (search = ''): Promise<LookupOption[]> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(vehicleLookupPath, {
    params: {
      search: search.trim() || undefined,
      page: 1,
      per_page: 100,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
  });

  const payload = ensureSuccess(response.data);
  const list = Array.isArray(payload?.data) ? payload.data : [];
  const mapped = mapLookupResult(list, (item) => ({
    id: Number(item.id),
    label: item.registration_number ?? '',
    subtitle: item.type ?? undefined,
  }));

  if (!search.trim()) {
    return mapped;
  }

  const normalizedSearch = search.trim().toLowerCase();
  return mapped.filter((item) => `${item.label} ${item.subtitle ?? ''}`.toLowerCase().includes(normalizedSearch));
};

export const lookupDoEkspedisiDrivers = async (search = ''): Promise<LookupOption[]> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(driverLookupPath, {
    params: {
      search: search.trim() || undefined,
      page: 1,
      per_page: 20,
    },
  });

  const payload = ensureSuccess(response.data);
  const normalized = normalizePagination(payload);
  const list = Array.isArray(normalized?.data) ? normalized.data : [];

  return mapLookupResult(list, (item) => ({
    id: Number(item.id),
    label: item.name ?? '',
    subtitle: item.code ?? item.phone ?? undefined,
  }));
};

export type DetailResource = 'note' | 'expense' | 'claim' | 'documentation';
const detailPaths: Record<DetailResource, string> = {
  note: driverNotePath, expense: expeditionExpensePath, claim: expeditionClaimPath, documentation: claimDocumentationPath,
};

const detailResponse = async (response: { data: LaravelApiResponse<any> }) => ensureSuccess(response.data);

export const createDoDetailResource = async (resource: DetailResource, payload: Record<string, unknown> | FormData) => {
  const response = await apiClient.post<LaravelApiResponse<any>>(detailPaths[resource], payload);
  return detailResponse(response);
};

export const updateDoDetailResource = async (resource: DetailResource, id: string | number, payload: Record<string, unknown> | FormData) => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${detailPaths[resource]}/${id}`, payload);
  return detailResponse(response);
};

export const deleteDoDetailResource = async (resource: DetailResource, id: string | number) => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${detailPaths[resource]}/${id}`);
  ensureSuccess(response.data);
};

export const getAvailableExpeditionClaims = async (driverId: number): Promise<DoEkspedisiClaim[]> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(expeditionClaimPath, {
    params: { driver_id: driverId, page: 1, per_page: 100 },
  });
  const normalized = normalizePagination(ensureSuccess(response.data));

  return (normalized.data ?? []).map(mapClaim).filter((claim: DoEkspedisiClaim) => claim.remainingNominal > 0);
};

export const applyExpeditionClaim = async (payload: ApplyExpeditionClaimPayload): Promise<DoEkspedisiClaimApplication> => {
  const response = await apiClient.post<LaravelApiResponse<any>>(`${expeditionClaimPath}/apply`, payload);
  return mapClaimApplication(ensureSuccess(response.data));
};

export const updateDoExpeditionStatus = async (id: string | number, status: string): Promise<DoEkspedisi> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(
    `${expeditionBasePath}/${id}/update-status`,
    { status },
  );
  return mapDoEkspedisi(ensureSuccess(response.data));
};
