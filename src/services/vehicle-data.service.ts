import type {
  VehicleData,
  VehicleDataAssignPayload,
  VehicleDataFilters,
  VehicleDataListResponse,
  VehicleDataLookupItem,
  VehicleDataPayload,
  VendorLookupItem,
} from '@/types/vehicle-data.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';
import type { PaginationParams } from '@/types/pagination.types';
import { getVendors } from '@/services/vendor.service';

const basePath = '/wapi/transaction/vehicle-data';
const vehicleLookupPath = '/wapi/master-data/vehicle-data';

const toStringValue = (value: unknown) => String(value ?? '').trim();
const unwrapVehicleDataPayload = (payload: any) => {
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

const mapVehicleData = (item: any): VehicleData => ({
  id: Number(item.id),
  uuid: toStringValue(item.uuid),
  dealerId: Number(item.dealer_id ?? 0),
  regionId: Number(item.region_id ?? 0),
  invoiceNumber: toStringValue(item.invoice_number),
  invoiceDate: item.invoice_date ?? null,
  invoiceReceiveDate: item.invoice_receive_date ?? null,
  vehicleType: (item.vehicle_type ?? 'r2') as VehicleData['vehicleType'],
  ktpNumber: toStringValue(item.ktp_number),
  phoneNumber: toStringValue(item.phone_number),
  occupation: toStringValue(item.occupation),
  stnkName: toStringValue(item.stnk_name),
  stnkAddress: toStringValue(item.stnk_address),
  village: toStringValue(item.village),
  district: toStringValue(item.district),
  subVillage: toStringValue(item.sub_village),
  subDistrict: toStringValue(item.sub_district),
  regency: toStringValue(item.regency),
  postalCode: toStringValue(item.postal_code),
  motorcycleBrand: toStringValue(item.motorcycle_brand),
  motorcycleType: toStringValue(item.motorcycle_type),
  motorcycleCategory: toStringValue(item.motorcycle_category),
  motorcycleModel: toStringValue(item.motorcycle_model),
  manufactureYear: item.manufacture_year == null ? null : Number(item.manufacture_year),
  engineCapacity: item.engine_capacity == null ? null : Number(item.engine_capacity),
  color: toStringValue(item.color),
  price: item.price == null ? null : Number(item.price),
  chassisNumber: toStringValue(item.chassis_number),
  machineNumber: toStringValue(item.machine_number ?? item.engine_number),
  formAb: toStringValue(item.form_ab),
  pib: toStringValue(item.pib),
  tptNumber: toStringValue(item.tpt_number),
  sutNumber: toStringValue(item.sut_number),
  srutNumber: toStringValue(item.srut_number),
  fuelType: toStringValue(item.fuel_type),
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  vehicleRegistration: item.vehicle_registration
    ? {
        id: Number(item.vehicle_registration.id),
        vendorId: item.vehicle_registration.vendor_id == null ? null : Number(item.vehicle_registration.vendor_id),
        vehicleDataId: item.vehicle_registration.vehicle_data_id == null ? null : Number(item.vehicle_registration.vehicle_data_id),
        processDate: item.vehicle_registration.process_date ?? null,
        isAlreadyProcessed: Boolean(item.vehicle_registration.is_already_processed),
      }
    : null,
  dealer: item.dealer
    ? {
        id: Number(item.dealer.id),
        code: toStringValue(item.dealer.code),
        namaDealer: toStringValue(item.dealer.nama_dealer ?? item.dealer.name),
      }
    : undefined,
  region: item.region
    ? {
        id: Number(item.region.id),
        name: toStringValue(item.region.name),
      }
    : undefined,
  ditlantasProcess: Array.isArray(item.ditlantas_process)
    ? item.ditlantas_process.map((p: any) => ({
        id: Number(p.id),
        uuid: toStringValue(p.uuid),
        code: toStringValue(p.code),
        vendorId: Number(p.vendor_id),
        processDate: p.process_date ?? '',
      }))
    : undefined,
});

const buildVehiclePayload = (data: Partial<VehicleDataPayload>, withMethodSpoof = false) => {
  const params = new URLSearchParams();

  if (withMethodSpoof) params.append('_method', 'PUT');

  if (data.dealerId) params.append('dealer_id', String(data.dealerId));
  if (data.regionId) params.append('region_id', String(data.regionId));
  if (data.invoiceDate) params.append('invoice_date', data.invoiceDate);
  if (data.invoiceNumber) params.append('invoice_number', data.invoiceNumber);
  if (data.invoiceReceiveDate) params.append('invoice_receive_date', data.invoiceReceiveDate);
  if (data.vehicleType) params.append('vehicle_type', data.vehicleType);
  if (data.ktpNumber) params.append('ktp_number', data.ktpNumber);
  if (data.phoneNumber) params.append('phone_number', data.phoneNumber);
  if (data.occupation) params.append('occupation', data.occupation);
  if (data.stnkName) params.append('stnk_name', data.stnkName);
  if (data.stnkAddress) params.append('stnk_address', data.stnkAddress);
  if (data.village) params.append('village', data.village);
  if (data.district) params.append('district', data.district);
  if (data.subVillage) params.append('sub_village', data.subVillage);
  if (data.subDistrict) params.append('sub_district', data.subDistrict);
  if (data.regency) params.append('regency', data.regency);
  if (data.postalCode) params.append('postal_code', data.postalCode);
  if (data.motorcycleBrand) params.append('motorcycle_brand', data.motorcycleBrand);
  if (data.motorcycleType) params.append('motorcycle_type', data.motorcycleType);
  if (data.motorcycleCategory) params.append('motorcycle_category', data.motorcycleCategory);
  if (data.motorcycleModel) params.append('motorcycle_model', data.motorcycleModel);
  if (data.manufactureYear) params.append('manufacture_year', data.manufactureYear);
  if (data.engineCapacity) params.append('engine_capacity', data.engineCapacity);
  if (data.color) params.append('color', data.color);
  if (data.price) params.append('price', data.price);
  if (data.chassisNumber) params.append('chassis_number', data.chassisNumber);
  if (data.machineNumber) {
    params.append('machine_number', data.machineNumber);
    params.append('machine-number', data.machineNumber);
    params.append('engine_number', data.machineNumber);
  }
  if (data.formAb) params.append('form_ab', data.formAb);
  if (data.pib) params.append('pib', data.pib);
  if (data.tptNumber) params.append('tpt_number', data.tptNumber);
  if (data.sutNumber) params.append('sut_number', data.sutNumber);
  if (data.srutNumber) params.append('srut_number', data.srutNumber);
  if (data.fuelType) params.append('fuel_type', data.fuelType);

  return params;
};

export const getVehicleDataList = async (
  params: PaginationParams & VehicleDataFilters = { page: 1, perPage: 25 },
): Promise<VehicleDataListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      dealer_id: params.dealerId || undefined,
      invoice_date: params.invoiceDate || undefined,
    },
  });

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page,
      total: data.total,
      last_page: data.last_page,
    },
    mapVehicleData,
  );
};

export const getVehicleDataDetail = async (id: string | number): Promise<VehicleData> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  return mapVehicleData(unwrapVehicleDataPayload(ensureSuccess(response.data)));
};

export const createVehicleData = async (data: Partial<VehicleDataPayload>): Promise<VehicleData> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(basePath, buildVehiclePayload(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return mapVehicleData(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateVehicleData = async (id: string | number, data: Partial<VehicleDataPayload>): Promise<VehicleData> => {
  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, buildVehiclePayload(data, true), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return mapVehicleData(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteVehicleData = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const payload = response.data;

  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete vehicle data');
  }
};

export const importVehicleData = async (file: File): Promise<void> => {
  const body = new FormData();
  body.append('file', file);

  const response = await apiClient.post<LaravelApiResponse<null>>(`${basePath}/import`, body, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to import vehicle data');
  }
};

export const exportVehicleData = async (): Promise<void> => {
  const response = await apiClient.get(`${basePath}/export`, {
    responseType: 'blob',
  });

  const contentType = response.headers['content-type'];
  const isJson = typeof contentType === 'string' && contentType.includes('application/json');

  if (isJson) {
    const textData = await (response.data as Blob).text();
    const jsonResponse = JSON.parse(textData);
    throw new ApiResponseError(jsonResponse.message ?? 'Failed to export vehicle data');
  }

  const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Vehicle_Data_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const assignVehicleDataToDitlantas = async (payload: VehicleDataAssignPayload): Promise<void> => {
  const params = new URLSearchParams();
  payload.vehicleDataIds.forEach((id) => {
    params.append('vehicle_data_ids[]', String(id));
  });
  params.append('vendor_id', String(payload.vendorId));
  params.append('process_date', payload.processDate);

  const response = await apiClient.post<LaravelApiResponse<any>>('/wapi/transaction/ditlantas-process', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to assign vehicle data');
  }
};

export const getVehicleDataLookup = async (search = ''): Promise<VehicleDataLookupItem[]> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(vehicleLookupPath, {
    params: {
      page: 1,
      per_page: 100,
      search: search.trim() || undefined,
    },
  });

  const data = ensureSuccess(response.data);
  const items = Array.isArray(data) ? data : data?.data ?? [];

  return items.map((item: any) => {
    const invoiceNumber = toStringValue(item.invoice_number);
    const stnkName = toStringValue(item.stnk_name);
    const chassisNumber = toStringValue(item.chassis_number);
    const machineNumber = toStringValue(item.machine_number ?? item.engine_number);

    return {
      id: Number(item.id),
      label: [invoiceNumber || `ID ${item.id}`, stnkName].filter(Boolean).join(' - '),
      invoiceNumber,
      stnkName,
      chassisNumber,
      machineNumber,
    };
  });
};

export const getVendorLookup = async (search = ''): Promise<VendorLookupItem[]> => {
  const response = await getVendors({ page: 1, perPage: 100, search });

  return response.data.map((vendor) => ({
    id: vendor.id,
    label: vendor.name,
    vendor,
  }));
};
