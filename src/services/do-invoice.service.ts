import type {
  DoInvoice,
  DoInvoiceCreatePayload,
  DoInvoiceDeletePayload,
  DoInvoiceDriver,
  DoInvoiceExpedition,
  DoInvoiceListParams,
  DoInvoiceListResponse,
  DoInvoiceOrderList,
  DoInvoiceProcessPayload,
  DoInvoiceProcessResponse,
  DoInvoiceTarif,
  DoInvoiceVehicle,
  CreateFinanceInvoicePaymentPayload,
} from '@/types/create-invoice.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ApiValidationError, ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/transaction/do-invoice';
const paymentPath = '/wapi/finance/finance-invoice-billing-payment';

const toNumber = (value: unknown) => {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toBool = (value: unknown) => value === true || value === 1 || value === '1';

const normalizePagination = (payload: any) => {
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

  return {
    data: [],
    current_page: 1,
    per_page: 25,
    total: 0,
    last_page: 1,
  };
};

const mapVehicle = (item: any): DoInvoiceVehicle | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    registrationNumber: item.registration_number ?? item.registrationNumber ?? item.no_polisi ?? item.noPolisi ?? '-',
    type: item.type ?? item.vehicle_type ?? item.vehicleType ?? '-',
  };
};

const mapDriver = (item: any): DoInvoiceDriver | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    name: item.name ?? item.driverName ?? '-',
  };
};

const mapOrderList = (item: any): DoInvoiceOrderList | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    code: item.code ?? '-',
    doDeliveryDestination: item.do_delivery_destination ?? item.delivery_destination ?? item.doDeliveryDestination ?? null,
    loadingIn: item.loading_in ?? item.loadingIn ?? null,
    loadingOut: item.loading_out ?? item.loadingOut ?? null,
    vehicleType: item.vehicle_type ?? item.vehicleType ?? null,
    billInvoice: toNumber(item.bill_invoice ?? item.billInvoice),
  };
};

const mapTarif = (item: any): DoInvoiceTarif | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    description: item.description || item.name || null,
    qty: toNumber(item.qty),
    invoicePrice: toNumber(item.invoice || item.invoice_price || item.price),
    ppnPrice: toNumber(item.ppn || item.ppn_price),
    loadingIn: item.loading_in || item.loadingIn || '',
    destination: item.destination || item.tujuan_kirim || item.delivery_destination || item.deliveryDestination || '',
    loadingOut: item.loading_out || item.loadingOut || '',
  };
};

const mapCustomer = (item: any) => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    code: item.code,
    name: item.name ?? '-',
    pic: item.pic ?? item.pic_name ?? null,
  };
};

const findNested = (source: any, ...keys: string[]) => {
  for (const key of keys) {
    if (source?.[key] != null) return source[key];
  }
  return null;
};

const mapExpedition = (item: any): DoInvoiceExpedition => {
  const orderListTarif = findNested(item, 'order_list_tarif', 'orderListTarif') ?? item?.order_list_tarifs?.[0];
  const rawTarifObj = findNested(item, 'tarif', 'price_tarif') ?? orderListTarif?.tarif ?? orderListTarif;
  const tarif = mapTarif(rawTarifObj);
  const vehicle = mapVehicle(findNested(item, 'vehicle', 'vehicle_fleet', 'vehicleFleet', 'armada'));
  const driver = mapDriver(findNested(item, 'driver', 'driver_fleet', 'driverFleet'));
  const orderList = mapOrderList(findNested(item, 'order_list', 'orderList'));
  const customer = mapCustomer(findNested(item, 'customer'));

  let invoiceExpedition = toNumber(
    findNested(item, 'invoice_expedition', 'invoice', 'invoice_fee') ?? tarif?.invoicePrice,
  );

  if (invoiceExpedition === 0 && rawTarifObj && vehicle) {
    const vType = vehicle.type?.toLowerCase();
    if (vType === 'cdd') {
      invoiceExpedition = toNumber(rawTarifObj.inv_cdd ?? rawTarifObj.invCdd);
    } else if (vType === 'fuso') {
      invoiceExpedition = toNumber(rawTarifObj.inv_fuso ?? rawTarifObj.invFuso);
    } else if (vType === 'towing') {
      invoiceExpedition = toNumber(rawTarifObj.inv_towing ?? rawTarifObj.invTowing);
    }
  }

  let ppn = toNumber(findNested(item, 'ppn', 'ppn_fee') ?? tarif?.ppnPrice);
  if (ppn === 0 && invoiceExpedition > 0) {
    ppn = Math.round(invoiceExpedition * 0.011);
  }

  const qty = toNumber(findNested(item, 'qty', 'quantity') ?? tarif?.qty) || 1;

  const destination =
    orderListTarif?.delivery_destination ||
    orderListTarif?.deliveryDestination ||
    item?.destination ||
    item?.tujuan_kirim ||
    item?.delivery_destination ||
    tarif?.destination ||
    '-';

  return {
    id: Number(item?.id ?? 0),
    uuid: item?.uuid,
    date: item?.date ?? item?.created_at ?? '',
    description: item?.description ?? tarif?.description ?? null,
    qty,
    status: item?.status ?? item?.expedition_status ?? '-',
    isAlreadyPrint: toBool(findNested(item, 'is_already_print', 'is_printed', 'status_print')),
    noSuratDo: item?.no_surat_do ?? item?.do_letter_code ?? item?.do_code ?? '-',
    doLetterCode: item?.do_letter_code ?? item?.do_code ?? null,
    doAssignmentCode: item?.do_assignment_code ?? item?.surat_jalan_code ?? null,
    vehicle,
    driver,
    orderList,
    customer,
    tarif,
    invoiceExpedition,
    ppn,
    totalAmount: invoiceExpedition + ppn,
    destination,
  };
};

const mapDoInvoice = (item: any): DoInvoice => {
  const expeditionsRaw =
    findNested(item, 'expeditions', 'do_expeditions') ??
    findNested(item?.order_list ?? item?.orderList, 'expeditions', 'do_expeditions') ??
    [];
  const expeditions = Array.isArray(expeditionsRaw) ? expeditionsRaw.map(mapExpedition) : [];
  const firstExpedition = expeditions[0];
  const orderList = mapOrderList(findNested(item, 'order_list', 'orderList')) ?? firstExpedition?.orderList ?? null;
  const customer = mapCustomer(findNested(item, 'customer')) ?? firstExpedition?.customer ?? null;

  return {
    id: Number(item?.id ?? 0),
    uuid: item?.uuid,
    code: item?.code ?? `INV-${item?.id ?? '-'}`,
    customerId: item?.customer_id == null ? customer?.id ?? null : Number(item.customer_id),
    date: item?.date ?? item?.created_at ?? '',
    subject: item?.subject ?? 'Invoice Ekspedisi',
    letterContent: item?.letter_content ?? '',
    description: item?.description ?? null,
    isAlreadyPrint: toBool(item?.is_already_print ?? item?.is_printed),
    other_fee: toNumber(item?.other_fee),
    additional_fee: toNumber(item?.additional_fee),
    finance_billing_payment: item?.finance_billing_payment || null,
    createdAt: item?.created_at,
    updatedAt: item?.updated_at,
    customer,
    orderList,
    vehicle: mapVehicle(item?.vehicle),
    driver: mapDriver(item?.driver),
    expeditions,
    raw: item,
  };
};

const appendFormData = (body: FormData, key: string, value: unknown, options?: { allowEmptyString?: boolean }) => {
  if (value == null) return;
  if (value === '' && !options?.allowEmptyString) return;

  if (value instanceof File) {
    body.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendFormData(body, `${key}[]`, item));
    return;
  }

  body.append(key, String(value));
};

export const createDoInvoice = async (payload: DoInvoiceCreatePayload): Promise<DoInvoice> => {
  const body = new FormData();
  appendFormData(body, 'customer_id', payload.customer_id);
  appendFormData(body, 'date', payload.date);
  appendFormData(body, 'subject', payload.subject);
  appendFormData(body, 'letter_content', payload.letter_content);
  appendFormData(body, 'description', payload.description ?? '', { allowEmptyString: true });

  const response = await apiClient.post<LaravelApiResponse<any>>(basePath, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return mapDoInvoice(ensureSuccess(response.data));
};

export const getDoInvoicesList = async (
  params: PaginationParams & DoInvoiceListParams,
): Promise<DoInvoiceListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      search: params.search?.trim() || undefined,
      order_sort: params.order_sort ?? 'desc',
      order_by: params.order_by ?? 'created_at',
      per_page: params.perPage ?? 10,
      page: params.page ?? 1,
      date: params.date || undefined,
      is_printed: params.is_printed || undefined,
    },
  });

  const payload = normalizePagination(ensureSuccess(response.data));
  return toPaginatedResult(
    {
      ...payload,
      data: (payload.data ?? []).map(mapDoInvoice),
    },
    (item) => item as DoInvoice,
  );
};

export const getDoInvoiceById = async (id: string | number): Promise<DoInvoice> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  return mapDoInvoice(ensureSuccess(response.data));
};

export const deleteDoInvoice = async (
  id: string | number,
  payload?: DoInvoiceDeletePayload,
) => {
  const body = new FormData();
  appendFormData(body, 'do_code', payload?.do_code);

  const response = await apiClient.request<LaravelApiResponse<any>>({
    url: `${basePath}/${id}`,
    method: 'DELETE',
    data: body,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return ensureSuccess(response.data);
};

export const processInvoiceById = async (
  id: string | number,
  payload: DoInvoiceProcessPayload = {},
): Promise<DoInvoiceProcessResponse> => {
  const body = new FormData();
  appendFormData(body, 'date', payload.date);
  appendFormData(body, 'subject', payload.subject);
  appendFormData(body, 'attachment', payload.attachment);
  appendFormData(body, 'letter_content', payload.letter_content);
  appendFormData(body, 'customer_name', payload.customer_name);
  appendFormData(body, 'do_expedition_invoice_ids', payload.do_expedition_invoice_ids);

  const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/process-invoice/${id}`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return ensureSuccess(response.data);
};

export const processExpeditionById = async (
  id: string | number,
  payload: DoInvoiceProcessPayload = {},
): Promise<DoInvoiceProcessResponse> => {
  const body = new FormData();
  appendFormData(body, 'date', payload.date);
  appendFormData(body, 'subject', payload.subject);
  appendFormData(body, 'attachment', payload.attachment);
  appendFormData(body, 'letter_content', payload.letter_content);
  appendFormData(body, 'customer_name', payload.customer_name);
  appendFormData(body, 'do_expedition_invoice_ids', payload.do_expedition_invoice_ids);

  const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/process-expedition/${id}`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return ensureSuccess(response.data);
};

export const createFinanceInvoiceBillingPayment = async (payload: CreateFinanceInvoicePaymentPayload): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('do_invoice_id', String(payload.do_invoice_id));
    formData.append('cash_id', String(payload.cash_id));
    formData.append('amount', String(payload.amount));

    const response = await apiClient.post<LaravelApiResponse<any>>(paymentPath, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return ensureSuccess(response.data);
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};
