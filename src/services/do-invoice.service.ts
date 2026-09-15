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
  DoInvoiceCustomer,
  FinanceBillingPayment,
} from '@/@types/do-invoice.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/transaction/do-invoice';
const billingPath = '/wapi/transaction/do-invoice-billing';
const billingHistoryPath = '/wapi/transaction/do-invoice-billing-history';
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
    companyList: item.company_list ?? item.companyList ?? '',
    company: item.company ?? null,
  };
};

const mapCustomer = (item: any): DoInvoiceCustomer | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    companyId: item.company_id != null ? Number(item.company_id) : undefined,
    code: item.code,
    type: item.type,
    name: item.name ?? '-',
    username: item.username ?? null,
    isActive: toBool(item.is_active ?? item.isActive),
    lastLogin: item.last_login ?? item.lastLogin ?? null,
    pic: item.pic ?? item.pic_name ?? item.picName ?? null,
    picName: item.pic_name ?? item.picName ?? item.pic ?? null,
    address: item.address ?? null,
    mapCoordinate: item.map_coordinate ?? item.mapCoordinate ?? null,
    phone: item.phone ?? null,
    npwp: item.npwp ?? null,
    identityNumber: item.identity_number ?? item.identityNumber ?? null,
    driveLicenseIdentityNumber: item.drive_license_identity_number ?? item.driveLicenseIdentityNumber ?? null,
    image: item.image ?? null,
    mapLink: item.map_link ?? item.mapLink ?? null,
    socialMedia1Link: item.social_media_1_link ?? item.socialMedia1Link ?? null,
    socialMedia2Link: item.social_media_2_link ?? item.socialMedia2Link ?? null,
    socialMedia3Link: item.social_media_3_link ?? item.socialMedia3Link ?? null,
    socialMedia4Link: item.social_media_4_link ?? item.socialMedia4Link ?? null,
    websiteLink: item.website_link ?? item.websiteLink ?? null,
    joinDate: item.join_date ?? item.joinDate ?? null,
    createdAt: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
  };
};

const mapTarif = (item: any): DoInvoiceTarif | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    description: item.description || item.name || null,
    qty: toNumber(item.qty),
    invoicePrice: toNumber(item.invoice || item.invoice_price || item.invoicePrice || item.price),
    ppnPrice: toNumber(item.ppn || item.ppn_price || item.ppnPrice),
    loadingIn: item.loading_in || item.loadingIn || '',
    destination: item.destination || item.tujuan_kirim || item.delivery_destination || item.deliveryDestination || '',
    loadingOut: item.loading_out || item.loadingOut || '',
    distance: item.distance != null ? Number(item.distance) : undefined,
    invCdd: item.inv_cdd != null ? toNumber(item.inv_cdd) : (item.invCdd != null ? toNumber(item.invCdd) : null),
    invFuso: item.inv_fuso != null ? toNumber(item.inv_fuso) : (item.invFuso != null ? toNumber(item.invFuso) : null),
    invTowing: item.inv_towing != null ? toNumber(item.inv_towing) : (item.invTowing != null ? toNumber(item.invTowing) : null),
    ujTowing: item.uj_towing != null ? toNumber(item.uj_towing) : (item.ujTowing != null ? toNumber(item.ujTowing) : null),
    ujCdd: item.uj_cdd != null ? toNumber(item.uj_cdd) : (item.ujCdd != null ? toNumber(item.ujCdd) : null),
    ujFuso: item.uj_fuso != null ? toNumber(item.uj_fuso) : (item.ujFuso != null ? toNumber(item.ujFuso) : null),
    isActive: item.is_active ?? item.isActive,
    createdAt: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
    pivot: item.pivot
      ? {
          doOrderlistId: item.pivot.do_orderlist_id ? Number(item.pivot.do_orderlist_id) : undefined,
          tarifId: item.pivot.tarif_id ? Number(item.pivot.tarif_id) : undefined,
          uuid: item.pivot.uuid,
          deliveryDestination: item.pivot.delivery_destination || item.pivot.deliveryDestination,
          createdAt: item.pivot.created_at || item.pivot.createdAt,
          updatedAt: item.pivot.updated_at || item.pivot.updatedAt,
        }
      : null,
  };
};

const mapOrderList = (item: any): DoInvoiceOrderList | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    code: item.code ?? '-',
    companyId: item.company_id != null ? Number(item.company_id) : undefined,
    customerId: item.customer_id != null ? Number(item.customer_id) : undefined,
    description: item.description ?? null,
    doDeliveryDestination: item.do_delivery_destination ?? item.delivery_destination ?? item.doDeliveryDestination ?? null,
    loadingIn: item.loading_in ?? item.loadingIn ?? null,
    loadingOut: item.loading_out ?? item.loadingOut ?? null,
    vehicleType: item.vehicle_type ?? item.vehicleType ?? null,
    billInvoice: toNumber(item.bill_invoice ?? item.billInvoice),
    isHasInvoice: toBool(item.is_has_invoice ?? item.isHasInvoice),
    canMarkDone: toBool(item.can_mark_done ?? item.canMarkDone),
    status: item.status,
    ujDriver: item.uj_driver != null ? toNumber(item.uj_driver) : null,
    ppn: item.ppn != null ? toNumber(item.ppn) : null,
    pph: item.pph != null ? toNumber(item.pph) : null,
    ujTowing: item.uj_towing != null ? toNumber(item.uj_towing) : null,
    ujCdd: item.uj_cdd != null ? toNumber(item.uj_cdd) : null,
    ujFuso: item.uj_fuso != null ? toNumber(item.uj_fuso) : null,
    invTowing: item.inv_towing != null ? toNumber(item.inv_towing) : null,
    invCdd: item.inv_cdd != null ? toNumber(item.inv_cdd) : null,
    invFuso: item.inv_fuso != null ? toNumber(item.inv_fuso) : null,
    driver: typeof item.driver === 'object' ? mapDriver(item.driver) : item.driver ?? null,
    customer: mapCustomer(item.customer),
    tarifs: Array.isArray(item.tarifs) ? item.tarifs.map(mapTarif).filter((t: any): t is DoInvoiceTarif => t !== null) : [],
    expeditions: Array.isArray(item.expeditions) ? item.expeditions.map(mapExpedition) : [],
    createdAt: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
  };
};

const mapBillingHistory = (item: any): DoInvoiceBillingHistory => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid,
  doInvoiceBillingId: Number(item?.do_invoice_billing_id ?? item?.doInvoiceBillingId ?? 0),
  paymentAt: item?.payment_at ?? item?.paymentAt ?? '',
  paymentProof: item?.payment_proof ?? item?.paymentProof ?? null,
  note: item?.note ?? null,
  cashPaymentAmount: toNumber(item?.cash_payment_amount ?? item?.cashPaymentAmount),
  bcaPaymentAmount: toNumber(item?.bca_payment_amount ?? item?.bcaPaymentAmount),
  bcaPaymentUsdAmount: toNumber(item?.bca_payment_usd_amount ?? item?.bcaPaymentUsdAmount),
  nominal: toNumber(item?.nominal),
  remainingPayment: item?.remaining_payment == null && item?.remainingPayment == null ? undefined : toNumber(item?.remaining_payment ?? item?.remainingPayment),
  cashes: Array.isArray(item?.cashes)
    ? item.cashes.map((cash: any) => ({
        id: Number(cash?.id ?? 0),
        uuid: cash?.uuid,
        code: cash?.code ?? '',
        currencyType: cash?.currency_type ?? cash?.currencyType ?? '',
        cashName: cash?.cash_name ?? cash?.cashName ?? '-',
      }))
    : [],
  createdAt: item?.created_at ?? item?.createdAt,
  updatedAt: item?.updated_at ?? item?.updatedAt,
});

const mapBilling = (item: any): DoInvoiceBilling | null => {
  if (!item || typeof item !== 'object') return null;
  const histories = item.do_invoice_billing_histories ?? item.doInvoiceBillingHistories ?? item.histories ?? [];
  const mappedHistories = Array.isArray(histories) ? histories.map(mapBillingHistory) : [];
  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid,
    doInvoiceId: Number(item.do_invoice_id ?? item.doInvoiceId ?? 0),
    grandTotal: toNumber(item.grand_total ?? item.grandTotal),
    lastPaymentAt: item.last_payment_at ?? item.lastPaymentAt ?? null,
    isPaid: toBool(item.is_paid ?? item.isPaid),
    totalCashPayment: toNumber(item.total_cash_payment ?? item.totalCashPayment),
    totalBcaPayment: toNumber(item.total_bca_cash_payment ?? item.total_bca_payment ?? item.totalBcaPayment),
    totalUsdPayment: toNumber(item.total_usd_payment ?? item.totalUsdPayment),
    totalPaid: toNumber(item.total_paid ?? item.totalPaid),
    remainingPayment: toNumber(item.remaining_payment ?? item.remainingPayment),
    totalPaymentCount: toNumber(item.total_payment_count ?? item.totalPaymentCount),
    doInvoiceBillingHistories: mappedHistories,
    histories: mappedHistories,
    createdAt: item.created_at ?? item.createdAt,
    updatedAt: item.updated_at ?? item.updatedAt,
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
    code: item?.code,
    date: item?.date ?? item?.created_at ?? item?.createdAt ?? '',
    description: item?.description ?? tarif?.description ?? null,
    qty,
    status: item?.status ?? item?.expedition_status ?? '-',
    isAlreadyPrint: toBool(findNested(item, 'is_already_print', 'is_printed', 'status_print', 'isAlreadyPrint')),
    noSuratDo: item?.no_surat_do ?? item?.do_letter_code ?? item?.do_code ?? item?.noSuratDo ?? '-',
    doLetterCode: item?.do_letter_code ?? item?.do_code ?? item?.doLetterCode ?? null,
    doAssignmentCode: item?.do_assignment_code ?? item?.surat_jalan_code ?? item?.doAssignmentCode ?? null,
    doOrderListTarifId: item?.do_order_list_tarif_id != null ? Number(item.do_order_list_tarif_id) : undefined,
    startDate: item?.start_date ?? item?.startDate,
    endDate: item?.end_date ?? item?.endDate,
    targetStartDate: item?.target_start_date ?? item?.targetStartDate,
    targetEndDate: item?.target_end_date ?? item?.targetEndDate,
    ujNominal: toNumber(item?.uj_nominal ?? item?.ujNominal),
    ujNominalBeforeClaim: toNumber(item?.uj_nominal_before_claim ?? item?.ujNominalBeforeClaim),
    claimDeductionNominal: toNumber(item?.claim_deduction_nominal ?? item?.claimDeductionNominal),
    cashAdvanceDeductionNominal: toNumber(item?.cash_advance_deduction_nominal ?? item?.cashAdvanceDeductionNominal),
    laravelThroughKey: item?.laravel_through_key != null ? Number(item.laravel_through_key) : undefined,
    vehicle,
    driver,
    orderList,
    customer,
    tarif,
    invoiceExpedition,
    ppn,
    totalAmount: invoiceExpedition + ppn,
    destination,
    createdAt: item?.created_at ?? item?.createdAt,
    updatedAt: item?.updated_at ?? item?.updatedAt,
  };
};

const mapFinanceBillingPayment = (item: any): FinanceBillingPayment | null => {
  if (!item || typeof item !== 'object') return null;
  return {
    id: item.id != null ? Number(item.id) : undefined,
    uuid: item.uuid ?? null,
    amount: item.amount != null ? toNumber(item.amount) : null,
    totalPaid: item.total_paid != null ? toNumber(item.total_paid) : (item.totalPaid != null ? toNumber(item.totalPaid) : null),
    cashId: item.cash_id != null ? Number(item.cash_id) : (item.cashId != null ? Number(item.cashId) : null),
    createdAt: item.created_at ?? item.createdAt ?? null,
    updatedAt: item.updated_at ?? item.updatedAt ?? null,
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
    billing.doInvoiceBillingHistories = billing.histories;
    billing.totalPaymentCount = billing.totalPaymentCount || billing.histories.length;
  }

  return {
    id: Number(item?.id ?? 0),
    uuid: item?.uuid,
    code: item?.code ?? `INV-${item?.id ?? '-'}`,
    customerId: item?.customer_id == null ? customer?.id ?? null : Number(item.customer_id),
    doOrderListId: item?.do_order_list_id == null ? orderList?.id ?? null : Number(item.do_order_list_id),
    date: item?.date ?? item?.created_at ?? item?.createdAt ?? '',
    subject: item?.subject ?? 'Invoice Ekspedisi',
    letterContent: item?.letter_content ?? item?.letterContent ?? '',
    description: item?.description ?? null,
    isAlreadyPrint: toBool(item?.is_already_print ?? item?.is_printed ?? item?.isAlreadyPrint),
    otherFee: toNumber(item?.other_fee ?? item?.otherFee),
    additionalFee: toNumber(item?.additional_fee ?? item?.additionalFee),
    nominal: toNumber(item?.nominal),
    paidNominal: toNumber(item?.paid_nominal ?? item?.paidNominal),
    billingRemainingNominal: toNumber(item?.billing_remaining_nominal ?? item?.billingRemainingNominal ?? rawBilling?.remaining_payment ?? rawBilling?.remainingPayment),
    isPaid: toBool(item?.is_paid ?? item?.isPaid ?? rawBilling?.is_paid ?? rawBilling?.isPaid),
    doInvoiceBilling: billing,
    billing,
    financeBillingPayment: mapFinanceBillingPayment(item?.finance_billing_payment ?? item?.financeBillingPayment),
    createdAt: item?.created_at ?? item?.createdAt,
    updatedAt: item?.updated_at ?? item?.updatedAt,
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
