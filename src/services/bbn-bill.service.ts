import type {
  BBNBill,
  BBNBillBilling,
  BBNBillBillingDetail,
  BBNBillBillingItem,
  BBNBillBillingItemListResponse,
  BBNBillBillingItemPayload,
  BBNBillBillingListResponse,
  BBNBillBillingPayload,
  BBNBillDetail,
  BBNBillListResponse,
  BBNBillPayload,
  BBNBillVehicleData,
  BBNBillVehicleFeePayload,
  BBNBillVehicleRegistrationFees,
} from '@/types/bbn-bill.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const bbnBillPath = '/wapi/transaction/bbn-bill';
const bbnBillBillingPath = '/wapi/transaction/bbn-bill-billing';
const bbnBillBillingItemPath = '/wapi/transaction/bbn-bill-billing-item';
const bbnBillDetailPath = '/wapi/transaction/bbn-bill-detail';

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const unwrapVehicleData = (payload: any) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (Array.isArray(payload.data)) {
      return payload.data[0] ?? {};
    }
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return payload.data;
    }
  }
  return payload;
};

const mapDealer = (item: any) => {
  if (!item) return null;

  return {
    id: Number(item.id),
    uuid: item.uuid ?? undefined,
    name: String(item.name ?? item.nama_dealer ?? ''),
    code: item.code ?? undefined,
    address: item.address ?? item.alamat ?? undefined,
    phone: item.phone ?? item.handphone ?? undefined,
  };
};

const mapVehicleRegistration = (item: any): BBNBillVehicleRegistrationFees | null => {
  if (!item) return null;

  return {
    id: Number(item.id),
    uuid: item.uuid ?? undefined,
    vendorId: toNullableNumber(item.vendor_id),
    vehicleDataId: toNullableNumber(item.vehicle_data_id),
    processDate: item.process_date ?? null,
    isAlreadyProcessed: item.is_already_processed == null ? undefined : Boolean(item.is_already_processed),
    customerDeliveryDate: item.customer_delivery_date ?? null,
    bpkbNumber: item.bpkb_number ?? null,
    bpkbRegistrationDate: item.bpkb_registration_date ?? null,
    bpkbReceivedDate: item.bpkb_received_date ?? null,
    bpkbPhysicalStatus: item.bpkb_physical_status == null ? undefined : Boolean(item.bpkb_physical_status),
    stnkRegistrationDate: item.stnk_registration_date ?? null,
    stnkReceivedDate: item.stnk_received_date ?? null,
    stnkPhysicalStatus: item.stnk_physical_status == null ? undefined : Boolean(item.stnk_physical_status),
    skpdPaymentDate: item.skpd_payment_date ?? null,
    skpdReceivedDate: item.skpd_received_date ?? null,
    skpdPhysicalStatus: item.skpd_physical_status == null ? undefined : Boolean(item.skpd_physical_status),
    tnkbReceivedDate: item.tnkb_received_date ?? null,
    tnkbNumber: item.tnkb_number ?? null,
    tnkbPhysicalStatus: item.tnkb_physical_status == null ? undefined : Boolean(item.tnkb_physical_status),
    stckFee: toNumber(item.stck_fee),
    bbnRegistrationFee: toNumber(item.bbn_registration_fee),
    noticeFee: toNumber(item.notice_fee),
    pmiFee: toNumber(item.pmi_fee),
    physicalCheckFee: toNumber(item.physical_check_fee),
    nikValidationFee: toNumber(item.nik_validation_fee),
    garwilFee: toNumber(item.garwil_fee),
    builtUpFee: toNumber(item.built_up_fee),
    accelerationFee: toNumber(item.acceleration_fee),
    plateRecommendationFee: toNumber(item.plate_recommendation_fee),
    serviceFee: toNumber(item.service_fee),
    skpdFee: toNumber(item.skpd_fee),
    stampFee: toNumber(item.stamp_fee),
    pnbpBpkb: toNumber(item.pnbp_bpkb),
    createdAt: item.created_at ?? undefined,
    updatedAt: item.updated_at ?? undefined,
  };
};
const mapBill = (item: any): BBNBill => {
  const ditlantasProcessRaw = item.ditlantas_process || item.ditlantasProcess;
  const vendorRaw = ditlantasProcessRaw?.vendor || item.vendor;
  return {
    id: Number(item.id),
    uuid: item.uuid ?? undefined,
    code: item.code ?? undefined,
    dealerId: Number(item.dealer_id ?? ditlantasProcessRaw?.vendor_id ?? 0),
    billDate: item.bill_date ?? null,
    paidDate: item.paid_date ?? null,
    createdAt: item.created_at ?? undefined,
    updatedAt: item.updated_at ?? undefined,
    bruttoAmount: toNumber(item.brutto_amount),
    paidAmount: toNumber(item.paid_amount),
    remainingAmount: toNullableNumber(item.remaining_amount) ?? undefined,
    pph23Amount: toNullableNumber(item.pph23_amount) ?? undefined,
    isPaid: Boolean(item.is_paid),
    dealer: mapDealer(item.dealer || vendorRaw),
    ditlantasProcess: ditlantasProcessRaw
      ? {
          id: Number(ditlantasProcessRaw.id),
          uuid: ditlantasProcessRaw.uuid ?? undefined,
          code: String(ditlantasProcessRaw.code ?? ditlantasProcessRaw.kode ?? ''),
          processDate: ditlantasProcessRaw.process_date ?? undefined,
          vendorId: toNullableNumber(ditlantasProcessRaw.vendor_id),
          vendor: vendorRaw
            ? {
                id: Number(vendorRaw.id),
                name: String(vendorRaw.name ?? vendorRaw.nama_vendor ?? vendorRaw.nama_dealer ?? ''),
              }
            : null,
        }
      : (item.ditlantas_process_code || item.ditlantas_code || item.kode_ditlantas
        ? {
            id: 0,
            code: String(item.ditlantas_process_code ?? item.ditlantas_code ?? item.kode_ditlantas ?? ''),
            vendor: null,
          }
        : null),
  };
};

const mapBilling = (item: any): BBNBillBilling => ({
  id: Number(item.id),
  uuid: item.uuid ?? undefined,
  bbnBillId: Number(item.bbn_bill_id ?? 0),
  totalPayment: toNumber(item.total_payment),
  createdAt: item.created_at ?? undefined,
  updatedAt: item.updated_at ?? undefined,
  bbnBill: item.bbn_bill ? mapBill(item.bbn_bill) : null,
});

const mapBillingItem = (item: any): BBNBillBillingItem => ({
  id: Number(item.id),
  uuid: item.uuid ?? undefined,
  bbnBillBillingId: Number(item.bbn_bill_billing_id ?? item.bbn_bill_billing?.id ?? 0),
  paidDate: item.paid_date ?? null,
  cashId: toNullableNumber(item.cash_id),
  amount: toNumber(item.amount),
  createdAt: item.created_at ?? undefined,
  updatedAt: item.updated_at ?? undefined,
  cashLabel: item.cash?.description ?? item.cash?.code ?? undefined,
});

const buildBillFormData = (payload: Partial<BBNBillPayload>, options?: { asUpdate?: boolean }) => {
  const formData = new FormData();
  if (options?.asUpdate) formData.append('_method', 'PUT');

  if (payload.ditlantasProcessId !== undefined && payload.ditlantasProcessId !== null) {
    formData.append('ditlantas_process_id', String(payload.ditlantasProcessId));
  } else if (payload.dealerId !== undefined && payload.dealerId !== null) {
    formData.append('ditlantas_process_id', String(payload.dealerId));
  }

  if (payload.billDate) formData.append('bill_date', payload.billDate);
  if (payload.paidDate) formData.append('paid_date', payload.paidDate);

  return formData;
};

const buildBillingPayload = (payload: BBNBillBillingPayload) => {
  const formData = new FormData();
  formData.append('bbn_bill_id', String(payload.bbnBillId));
  return formData;
};

const buildBillingItemPayload = (payload: BBNBillBillingItemPayload, options?: { asUpdate?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.asUpdate) params.append('_method', 'PUT');

  params.append('bbn_bill_billing_id', String(payload.bbnBillBillingId));
  params.append('paid_date', payload.paidDate);
  params.append('cash_id', String(payload.cashId));
  params.append('amount', String(payload.amount));

  return params;
};

const buildVehicleFeePayload = (payload: BBNBillVehicleFeePayload) => {
  const params = new URLSearchParams();
  params.append('_method', 'PUT');
  params.append('bbn_registration_fee', String(payload.bbnRegistrationFee));
  params.append('garwil_fee', String(payload.garwilFee));
  params.append('nik_validation_fee', String(payload.nikValidationFee));
  params.append('acceleration_fee', String(payload.accelerationFee));
  params.append('stamp_fee', String(payload.stampFee));
  params.append('pnbp_bpkb', String(payload.pnbpBpkb));
  params.append('skpd_fee', String(payload.skpdFee));
  return params;
};

export const getBBNBills = async (params: PaginationParams = { page: 1, perPage: 25 }): Promise<BBNBillListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(bbnBillPath, {
    params: buildLaravelPaginationQuery(params),
  });

  return toPaginatedResult(ensureSuccess(response.data), mapBill);
};

export const getBBNBillDetail = async (id: string | number): Promise<BBNBillDetail> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${bbnBillPath}/${id}`);
  const data = ensureSuccess(response.data);
  const base = mapBill(data);

  // Extract vehicle registrations raw list
  const vehicleRegistrationsRaw = data.ditlantas_process?.vehicle_registrations ??
                                  data.ditlantas_processes?.flatMap((dp: any) => dp.vehicle_registrations ?? []) ??
                                  data.vehicle_registrations ??
                                  [];

  // Fetch missing vehicle details if vehicle_data is missing or incomplete
  const uniqueVehicleIds = Array.from(
    new Set<number>(
      vehicleRegistrationsRaw
        .map((reg: any) => reg.vehicle_data_id)
        .filter(Boolean)
        .map(Number)
    )
  );

  const vehicleMap = new Map<number, any>();
  if (uniqueVehicleIds.length > 0) {
    try {
      await Promise.all(
        uniqueVehicleIds.map(async (vId) => {
          try {
            const vehicleResponse = await apiClient.get<LaravelApiResponse<any>>(`/wapi/transaction/vehicle-data/${vId}`);
            const vehicleData = unwrapVehicleData(ensureSuccess(vehicleResponse.data));
            if (vehicleData && vehicleData.id) {
              vehicleMap.set(Number(vehicleData.id), vehicleData);
            }
          } catch (err) {
            console.warn(`Failed to pre-fetch vehicle data for ID ${vId} in getBBNBillDetail:`, err);
          }
        })
      );
    } catch (err) {
      console.error('Error pre-fetching vehicle data list for BBN bill:', err);
    }
  }

  // Map registrations to BBNBillVehicleData
  const mappedVehicleDatas = vehicleRegistrationsRaw.map((reg: any): BBNBillVehicleData => {
    const vDetail = vehicleMap.get(Number(reg.vehicle_data_id)) || reg.vehicle_data;
    return {
      id: Number(reg.vehicle_data_id ?? vDetail?.id ?? 0),
      uuid: reg.uuid ?? vDetail?.uuid,
      dealerId: toNullableNumber(vDetail?.dealer_id ?? data.dealer_id),
      invoiceNumber: String(vDetail?.invoice_number ?? ''),
      stnkName: String(vDetail?.stnk_name ?? vDetail?.stnkName ?? ''),
      ktpNumber: String(vDetail?.ktp_number ?? vDetail?.ktpNumber ?? ''),
      chassisNumber: String(vDetail?.chassis_number ?? vDetail?.chassisNumber ?? ''),
      machineNumber: String(vDetail?.machine_number ?? vDetail?.machineNumber ?? vDetail?.engine_number ?? ''),
      vehicleRegistration: mapVehicleRegistration(reg),
    };
  });

  const dealer = data.dealer
    ? {
        ...(mapDealer(data.dealer) ?? { id: Number(data.dealer.id), name: String(data.dealer.name ?? '') }),
        vehicleDatas: mappedVehicleDatas,
      }
    : {
        id: Number(data.dealer_id ?? 0),
        name: String(data.dealer?.name ?? ''),
        vehicleDatas: mappedVehicleDatas,
      };

  return {
    ...base,
    dealerDetail: dealer,
    billings: Array.isArray(data.bbn_bill_billings)
      ? data.bbn_bill_billings.map((item: any) => ({
          id: Number(item.id),
          uuid: item.uuid ?? undefined,
          bbnBillId: Number(item.bbn_bill_id ?? base.id),
          totalPayment: toNumber(item.total_payment),
          createdAt: item.created_at ?? undefined,
          updatedAt: item.updated_at ?? undefined,
        }))
      : [],
  };
};

export const createBBNBill = async (payload: BBNBillPayload): Promise<BBNBill> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(bbnBillPath, buildBillFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapBill(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateBBNBill = async (id: string | number, payload: BBNBillPayload): Promise<BBNBill> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${bbnBillPath}/${id}`, buildBillFormData(payload, { asUpdate: true }), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapBill(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteBBNBill = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${bbnBillPath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete BBN bill');
  }
};

export const updateBBNBillVehicleData = async (vehicleRegistrationId: string | number, payload: BBNBillVehicleFeePayload): Promise<BBNBillVehicleRegistrationFees> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${bbnBillDetailPath}/${vehicleRegistrationId}`, buildVehicleFeePayload(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapVehicleRegistration(ensureSuccess(response.data)) as BBNBillVehicleRegistrationFees;
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const getBBNBillBillings = async (params: PaginationParams = { page: 1, perPage: 25 }): Promise<BBNBillBillingListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(bbnBillBillingPath, {
    params: buildLaravelPaginationQuery(params),
  });

  return toPaginatedResult(ensureSuccess(response.data), mapBilling);
};

export const getBBNBillBillingDetail = async (id: string | number): Promise<BBNBillBillingDetail> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${bbnBillBillingPath}/${id}`);
  const data = ensureSuccess(response.data);
  const base = mapBilling(data);

  return {
    ...base,
    items: Array.isArray(data.bbn_bill_billing_items) ? data.bbn_bill_billing_items.map(mapBillingItem) : [],
  };
};

export const createBBNBillBilling = async (payload: BBNBillBillingPayload): Promise<BBNBillBilling> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(bbnBillBillingPath, buildBillingPayload(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapBilling(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteBBNBillBilling = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${bbnBillBillingPath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete BBN bill billing');
  }
};

export const getBBNBillBillingItems = async (params: PaginationParams = { page: 1, perPage: 25 }): Promise<BBNBillBillingItemListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(bbnBillBillingItemPath, {
    params: buildLaravelPaginationQuery(params),
  });

  return toPaginatedResult(ensureSuccess(response.data), mapBillingItem);
};

export const createBBNBillBillingItem = async (payload: BBNBillBillingItemPayload): Promise<BBNBillBillingItem> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(bbnBillBillingItemPath, buildBillingItemPayload(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapBillingItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateBBNBillBillingItem = async (id: string | number, payload: BBNBillBillingItemPayload): Promise<BBNBillBillingItem> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${bbnBillBillingItemPath}/${id}`, buildBillingItemPayload(payload, { asUpdate: true }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapBillingItem(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteBBNBillBillingItem = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${bbnBillBillingItemPath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete BBN bill billing item');
  }
};
