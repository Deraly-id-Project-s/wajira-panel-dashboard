import { ARMADA_EQUIPMENT_FIELDS } from '@/@types/armada.types';
import type { Armada, ArmadaEquipment, ArmadaListParams, ArmadaListResponse, ArmadaPayload } from '@/@types/armada.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/master-data/vehicle-fleet';

const mapEquipment = (item: any): ArmadaEquipment => {
  const source = item?.vehicle_fleet_equipment && typeof item.vehicle_fleet_equipment === 'object'
    ? item.vehicle_fleet_equipment
    : item;

  return ARMADA_EQUIPMENT_FIELDS.reduce<ArmadaEquipment>((accumulator, field) => {
    const value = source?.[field];
    accumulator[field] = value == null || value === '' ? null : Number(value);
    return accumulator;
  }, {});
};

const mapArmada = (item: any): Armada => ({
  id: item.id,
  uuid: item.uuid,
  registrationNumber: item.registration_number || '',
  type: item.type || '',
  machineNumber: item.machine_number || '',
  chassisNumber: item.chassis_number || '',
  stnkAge: item.stnk_age ?? null,
  kirAge: item.kir_age ?? null,
  stnkNumber: item.stnk_number ?? null,
  kirBook: item.kir_book ?? null,
  equipment: mapEquipment(item),
  vehicleEquipmentAssigned: Array.isArray(item.vehicle_equipment_assigned)
    ? item.vehicle_equipment_assigned.map((eq: any) => ({
        id: eq.id,
        uuid: eq.uuid || '',
        code: eq.code || '',
        name: eq.name || '',
        description: eq.description ?? null,
        stock: eq.stock !== undefined && eq.stock !== null ? Number(eq.stock) : 0,
        buy_price: eq.buy_price !== undefined && eq.buy_price !== null ? Number(eq.buy_price) : 0,
        sell_price: eq.sell_price !== undefined && eq.sell_price !== null ? Number(eq.sell_price) : 0,
      }))
    : [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});


export const getArmadas = async (
  params: PaginationParams & ArmadaListParams,
): Promise<ArmadaListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      search: params.search,
      registration_number: params.registration_number ?? params.search?.trim() ?? undefined,
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
    mapArmada,
  );
};

export const getArmadaById = async (id: string | number): Promise<Armada> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapArmada(data);
};

const appendValue = (payload: FormData | URLSearchParams, key: string, value: string | number | null | undefined) => {
  if (value == null) return;
  payload.append(key, String(value));
};

const buildCreatePayload = (data: ArmadaPayload) => {
  const formData = new FormData();

  formData.append('registration_number', data.registration_number);
  formData.append('type', data.type);
  formData.append('machine_number', data.machine_number);
  formData.append('chassis_number', data.chassis_number);
  appendValue(formData, 'stnk_age', data.stnk_age);
  appendValue(formData, 'kir_age', data.kir_age);
  appendValue(formData, 'stnk_number', data.stnk_number);
  appendValue(formData, 'kir_book', data.kir_book);

  ARMADA_EQUIPMENT_FIELDS.forEach((field) => {
    appendValue(formData, field, data[field]);
  });

  return formData;
};

const buildUpdatePayload = (data: ArmadaPayload) => {
  const params = new URLSearchParams();

  params.append('registration_number', data.registration_number);
  params.append('type', data.type);
  params.append('machine_number', data.machine_number);
  params.append('chassis_number', data.chassis_number);
  appendValue(params, 'stnk_age', data.stnk_age);
  appendValue(params, 'kir_age', data.kir_age);
  appendValue(params, 'stnk_number', data.stnk_number);
  appendValue(params, 'kir_book', data.kir_book);
  appendValue(params, 'vehicle_fleet_id', data.vehicle_fleet_id);

  ARMADA_EQUIPMENT_FIELDS.forEach((field) => {
    appendValue(params, field, data[field]);
  });

  return params;
};

export const createArmada = async (payload: ArmadaPayload): Promise<Armada> => {
  const formData = buildCreatePayload(payload);

  try {
    const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const dataRes = ensureSuccess(response.data);
    return dataRes ? mapArmada(dataRes) : ({} as Armada);
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateArmada = async (id: string | number, payload: ArmadaPayload): Promise<void> => {
  const params = buildUpdatePayload(payload);

  try {
    const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.data.status) {
      throw new ApiResponseError(response.data.message ?? 'Failed to update vehicle fleet');
    }
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteArmada = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete vehicle fleet');
  }
};

export const importArmada = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<LaravelApiResponse<null>>(`${basePath}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to import vehicle fleet');
  }
};
