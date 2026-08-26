import type { Driver } from '@/types/driver.types';
import type { Armada } from '@/types/armada.types';
import type {
  MaintenanceItem,
  MaintenanceDetail,
  MaintenanceVehicleEquipment,
  MaintenanceListParams,
  MaintenanceResponse,
} from '@/types/maintenance.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { type LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/warehouse/good-transaction-maintenance';

const toNumber = (value: string | number | undefined | null) => Number(value ?? 0) || 0;

const mapDriver = (item: any): Driver | null => {
  if (!item) return null;
  return {
    id: toNumber(item.id),
    uuid: item.uuid,
    code: item.code || '',
    name: item.name || '',
    type: item.type || '',
  };
};

const mapVehicleFleet = (item: any): Armada | null => {
  if (!item) return null;
  return {
    id: toNumber(item.id),
    uuid: item.uuid,
    registrationNumber: item.registration_number || '',
    type: item.type || '',
    machineNumber: item.machine_number || '',
    chassisNumber: item.chassis_number || '',
    stnkAge: item.stnk_age || null,
    kirAge: item.kir_age || null,
    stnkNumber: item.stnk_number || null,
    kirBook: item.kir_book || null,
    equipment: {},
  };
};

const mapVehicleEquipment = (item: any): MaintenanceVehicleEquipment | null => {
  if (!item) return null;
  return {
    id: toNumber(item.id),
    uuid: item.uuid || '',
    code: item.code || '',
    name: item.name || '',
  };
};

const mapDetailItem = (item: any): MaintenanceDetail => ({
  id: toNumber(item.id),
  uuid: item.uuid || '',
  qty: toNumber(item.qty),
  type: item.type || null,
  price: toNumber(item.price),
  goodsTransactionId: toNumber(item.goods_transaction_id),
  materialId: item.material_id ? toNumber(item.material_id) : null,
  vehicleEquipmentId: item.vehicle_equipment_id ? toNumber(item.vehicle_equipment_id) : null,
  total: toNumber(item.total) || toNumber(item.qty) * toNumber(item.price),
  material: item.material || null,
  vehicleEquipment: mapVehicleEquipment(item.vehicle_equipment),
});

const mapMaintenanceItem = (item: any): MaintenanceItem => ({
  id: toNumber(item.id),
  uuid: item.uuid || '',
  code: item.code || '',
  companyId: toNumber(item.company_id),
  supplierId: item.supplier_id ? toNumber(item.supplier_id) : null,
  driverId: item.driver_id ? toNumber(item.driver_id) : null,
  vehicleFleetId: item.vehicle_fleet_id ? toNumber(item.vehicle_fleet_id) : null,
  category: item.category || 'maintenance',
  type: item.type || 'issue',
  transactionDate: item.transaction_date || '',
  location: item.location || null,
  description: item.description || null,
  invoiceFile: item.invoice_file || null,
  createdAt: item.created_at || '',
  totalBrutto: toNumber(item.total_brutto),
  goodsTransactionDetails: (item.goods_transaction_details ?? []).map(mapDetailItem),
  goodsTransactionBillings: item.goods_transaction_billings || null,
  company: item.company
    ? {
        id: toNumber(item.company.id),
        uuid: item.company.uuid || '',
        code: item.company.code || '',
        name: item.company.name || '',
        type: item.company.type || '',
      }
    : null,
  supplier: item.supplier || null,
  driver: mapDriver(item.driver),
  vehicleFleet: mapVehicleFleet(item.vehicle_fleet),
});

export const getMaintenanceList = async (params: MaintenanceListParams): Promise<MaintenanceResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      company_id: params.company_id,
      search: params.search?.trim() ? params.search.trim() : undefined,
      code: params.code?.trim() ? params.code.trim() : undefined,
      registration_number: params.registration_number?.trim() ? params.registration_number.trim() : undefined,
      driver_name: params.driver_name?.trim() ? params.driver_name.trim() : undefined,
    },
  });

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page ?? 10,
      total: data.total,
      last_page: data.last_page,
    },
    mapMaintenanceItem,
  );
};
