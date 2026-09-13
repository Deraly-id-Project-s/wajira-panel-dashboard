import type {
  DoInvoice,
  DoInvoiceDriver,
  DoInvoiceExpedition,
  DoInvoiceListParams,
  DoInvoiceListResponse,
  DoInvoiceOrderList,
  DoInvoiceTarif,
  DoInvoiceVehicle,
  CreateFinanceInvoicePaymentPayload,
  DoInvoiceBilling,
  DoInvoiceBillingHistory,
  DoInvoiceBillingHistoryPayload,
  UpdateDoInvoiceBillingPayload,
} from '@/@types/do-invoice.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/do-invoice';
const billingPath = '/wapi/do-invoice-billing';
const billingHistoryPath = '/wapi/do-invoice-billing-history';
const paymentPath = '/wapi/finance/finance-invoice-billing-payment';

const toNumber = (value: unknown) => {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toBool = (value: unknown) => value === true || value === 1 || value === '1' || value === 'true';

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
    isHasInvoice: toBool(item.is_has_invoice),
    canMarkDone: toBool(item.can_mark_done),
    status: item.status,
    customer: mapCustomer(item.customer),
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
    address: item.address ?? null,
    phone: item.phone ?? null,
    npwp: item.npwp ?? null,
  };
};

const mapBillingHistory = (item: any): DoInvoiceBillingHistory => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  doInvoiceBillingId: Number(item?.do_invoice_billing_id ?? 0),
  paymentAt: item?.payment_at ?? '',
  paymentProof: item?.payment_proof ?? null,
  note: item?.note ?? null,
  cashPaymentAmount: toNumber(item?.cash_payment_amount),
  bcaPaymentAmount: toNumber(item?.bca_payment_amount),
  bcaPaymentUsdAmount: toNumber(item?.bca_payment_usd_amount),
  nominal: toNumber(item?.nominal),
  remainingPayment: item?.remaining_payment == null ? undefined : toNumber(item.remaining_payment),
  cashes: Array.isArray(item?.cashes)
    ? item.cashes.map((cash: any) => ({
        id: Number(cash?.id ?? 0),
        uuid: cash?.uuid,
        code: cash?.code ?? '',
        currencyType: cash?.currency_type ?? '',
        cashName: cash?.cash_name ?? '-',
      }))
    : [],
  createdAt: item?.created_at,
  updatedAt: item?.updated_at,
});

const mapBilling = (item: any): DoInvoiceBilling | null => {
  if (!item || typeof item !== 'object') return null;
  const histories = item.do_invoice_billing_histories ?? item.histories ?? [];
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    doInvoiceId: Number(item.do_invoice_id ?? 0),
    grandTotal: toNumber(item.grand_total),
    lastPaymentAt: item.last_payment_at ?? null,
    isPaid: toBool(item.is_paid),
    totalCashPayment: toNumber(item.total_cash_payment),
    totalBcaPayment: toNumber(item.total_bca_cash_payment ?? item.total_bca_payment),
    totalUsdPayment: toNumber(item.total_usd_payment),
    totalPaid: toNumber(item.total_paid),
    remainingPayment: toNumber(item.remaining_payment),
    totalPaymentCount: toNumber(item.total_payment_count),
    histories: Array.isArray(histories) ? histories.map(mapBillingHistory) : [],
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
  const rawBilling = findNested(item, 'do_invoice_billing', 'doInvoiceBilling');
  const billing = mapBilling(rawBilling);
  const topLevelHistories = findNested(item, 'do_invoice_billing_histories', 'doInvoiceBillingHistories');
  if (billing && billing.histories.length === 0 && Array.isArray(topLevelHistories)) {
    billing.histories = topLevelHistories.map(mapBillingHistory);
    billing.totalPaymentCount = billing.totalPaymentCount || billing.histories.length;
  }

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
    nominal: toNumber(item?.nominal),
    paidNominal: toNumber(item?.paid_nominal),
    billingRemainingNominal: toNumber(item?.billing_remaining_nominal ?? rawBilling?.remaining_payment),
    isPaid: toBool(item?.is_paid ?? rawBilling?.is_paid),
    billing,
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
      is_already_print: params.is_already_print ?? (params.is_printed === '' ? undefined : params.is_printed),
      is_paid: params.is_paid,
      customer_id: params.customer_id,
      company_id: params.company_id,
      do_order_list_id: params.do_order_list_id,
      start_date: params.start_date,
      end_date: params.end_date,
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
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${encodeURIComponent(String(id))}`);
  return mapDoInvoice(ensureSuccess(response.data));
};

export const createFinanceInvoiceBillingPayment = async (payload: CreateFinanceInvoicePaymentPayload): Promise<any> => {
  const formData = new FormData();
  formData.append('do_invoice_id', String(payload.do_invoice_id));
  formData.append('cash_id', String(payload.cash_id));
  formData.append('amount', String(payload.amount));
  const response = await apiClient.post<LaravelApiResponse<any>>(paymentPath, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return ensureSuccess(response.data);
};

const buildBillingHistoryBody = (payload: DoInvoiceBillingHistoryPayload, method?: 'PUT') => {
  const body = new FormData();
  if (method) body.append('_method', method);
  appendFormData(body, 'do_invoice_billing_id', payload.do_invoice_billing_id);
  appendFormData(body, 'cash_payment_amount', payload.cash_payment_amount ?? 0);
  appendFormData(body, 'bca_payment_amount', payload.bca_payment_amount ?? 0);
  appendFormData(body, 'bca_payment_usd_amount', payload.bca_payment_usd_amount ?? 0);
  appendFormData(body, 'payment_at', payload.payment_at);
  appendFormData(body, 'note', payload.note ?? '', { allowEmptyString: true });
  appendFormData(body, 'payment_proof', payload.payment_proof);
  return body;
};

export const createDoInvoiceBillingHistory = async (payload: DoInvoiceBillingHistoryPayload) => {
  const response = await apiClient.post<LaravelApiResponse<any>>(billingHistoryPath, buildBillingHistoryBody(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapBillingHistory(ensureSuccess(response.data));
};

export const updateDoInvoiceBillingHistory = async (id: string | number, payload: DoInvoiceBillingHistoryPayload) => {
  const response = await apiClient.post<LaravelApiResponse<any>>(
    `${billingHistoryPath}/${encodeURIComponent(String(id))}`,
    buildBillingHistoryBody(payload, 'PUT'),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return mapBillingHistory(ensureSuccess(response.data));
};

export const deleteDoInvoiceBillingHistory = async (id: string | number) => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${billingHistoryPath}/${encodeURIComponent(String(id))}`);
  return ensureSuccess(response.data);
};

export const updateDoInvoiceBilling = async (id: string | number, payload: UpdateDoInvoiceBillingPayload) => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${billingPath}/${encodeURIComponent(String(id))}`, payload);
  return mapBilling(ensureSuccess(response.data));
};
