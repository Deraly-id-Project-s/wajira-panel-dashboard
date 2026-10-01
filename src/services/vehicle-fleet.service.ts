import type { VehicleEquipmentAssigned, Armada, ArmadaListResponse } from '@/@types/armada.types';
import type { PaginationParams } from '@/@types/pagination.types';
import type { CreateAssignDispatchPayload } from '@/@types/warehouse.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/master-data/vehicle-fleet';
const warehouseActivityPath = '/wapi/warehouse/warehouse-activity';

const mapVehicleEquipmentAssigned = (item: any): VehicleEquipmentAssigned => ({
  id: item.id,
  uuid: item.uuid || '',
  code: item.code || '',
  name: item.name || '',
  description: item.description ?? null,
  stock: item.stock !== undefined && item.stock !== null ? Number(item.stock) : 0,
  buy_price: item.buy_price !== undefined && item.buy_price !== null ? Number(item.buy_price) : 0,
  sell_price: item.sell_price !== undefined && item.sell_price !== null ? Number(item.sell_price) : 0,
});

const mapVehicleFleet = (item: any): Armada => ({
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
  equipment: {},
  vehicleEquipmentAssigned: Array.isArray(item.vehicle_equipment_assigned)
    ? item.vehicle_equipment_assigned.map(mapVehicleEquipmentAssigned)
    : [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

export const getVehicleFleets = async (
  params: PaginationParams & { search?: string },
): Promise<ArmadaListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      search: params.search,
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
    mapVehicleFleet,
  );
};

export const getVehicleFleetById = async (id: string | number): Promise<Armada> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapVehicleFleet(data);
};

export const createAssignDispatchActivity = async (payload: CreateAssignDispatchPayload): Promise<any> => {
  const body = new URLSearchParams();
  body.append('warehouse_id', String(payload.warehouse_id));
  body.append('type', 'vehicle-equipment');
  body.append('activity_type', payload.activity_type);
  body.append('activity_date', payload.activity_date);
  body.append('vehicle_equipment_id', String(payload.vehicle_equipment_id));
  body.append('vehicle_fleet_id', String(payload.vehicle_fleet_id));
  body.append('qty', String(payload.qty));
  if (payload.description) body.append('description', payload.description);
  if (payload.state_note) body.append('state_note', payload.state_note);

  const response = await apiClient.post<LaravelApiResponse<any>>(warehouseActivityPath, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return ensureSuccess(response.data);
};

export const updateAssignDispatchActivityState = async (
  activityId: string | number,
  state: 'draft' | 'process' | 'done',
  state_note?: string,
): Promise<any> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(
    `${warehouseActivityPath}/${activityId}/update-state`,
    { state, state_note },
  );
  return ensureSuccess(response.data);
};
