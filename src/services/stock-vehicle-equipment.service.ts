import type { PaginationParams } from '@/@types/pagination.types';
import type { StockVehicleEquipment } from '@/@types/stock-vehicle-equipment.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface StockVehicleEquipmentApiModel {
  id: number | string;
  vehicle_equipment_id?: number;
  vehicle_equipment?: {
    id: number;
    code: string;
    name: string;
    buy_price?: number | string;
    sell_price?: number | string;
  };
  unit_type?: {
    id: number;
    code: string;
    name: string;
    buy_price?: number | string;
    sell_price?: number | string;
  };
  code?: string;
  name?: string;
  stock_available?: number | string | boolean;
  stock_forecast?: number | string;
  purchase_price?: number | string;
  status?: string;
  stock_state?: string;
  is_sold_unit?: boolean | number | string;
}

const toBool = (value: unknown) => value === true || value === 1 || value === '1' || value === 'true';

const mapStockVehicleEquipment = (payload: StockVehicleEquipmentApiModel): StockVehicleEquipment => {
  const equipment = payload.vehicle_equipment ?? payload.unit_type;

  return {
    id: String(payload.id),
    vehicleEquipmentId: equipment?.id ?? payload.vehicle_equipment_id ?? 0,
    vehicleEquipmentCode: equipment?.code ?? payload.code ?? '-',
    vehicleEquipmentName: equipment?.name ?? payload.name ?? '-',
    qty: Number(payload.stock_available ?? 0),
    forecastQty: Number(payload.stock_forecast ?? 0),
    price: Number(payload.purchase_price ?? equipment?.buy_price ?? equipment?.sell_price ?? 0),
    status: payload.status ?? '-',
    stockStatus: payload.stock_state ?? '-',
    stockState: payload.stock_state ?? '-',
    isSoldUnit: toBool(payload.is_sold_unit),
  };
};

type PaginatedStockVehicleEquipmentResponse = LaravelApiResponse<{
  data: StockVehicleEquipmentApiModel[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}>;

export const getStockVehicleEquipments = async (
  companyId: number | string,
  params: PaginationParams & {
    id?: number | string;
    specified?: 'purchase_outstanding' | 'sales_outstanding' | string;
    in_stock?: boolean | string;
    vehicle_equipment_id?: number | string;
    machine_number?: string;
    chassis_number?: string;
    activity_number?: string;
    code?: string;
    activity_type?: 'receipt' | 'issue' | string;
    stock_state?: string;
    sort_by?: 'id' | 'created_at' | 'activity_number' | 'activity_date' | string;
    sort_dir?: 'asc' | 'desc' | string;
  },
) => {
  const response = await apiClient.get<PaginatedStockVehicleEquipmentResponse>(
    `/wapi/warehouse/warehouse-get-vehicle-equipment/${companyId}`,
    {
      params: {
        ...buildLaravelPaginationQuery(params),
        page: params.page,
        per_page: params.perPage,
        search: params.search || undefined,
        id: params.id || undefined,
        specified: params.specified || undefined,
        in_stock: params.in_stock ?? undefined,
        vehicle_equipment_id: params.vehicle_equipment_id || undefined,
        machine_number: params.machine_number || undefined,
        chassis_number: params.chassis_number || undefined,
        activity_number: params.activity_number || undefined,
        code: params.code || undefined,
        activity_type: params.activity_type || undefined,
        stock_state: params.stock_state || undefined,
        sort_by: params.sort_by || undefined,
        sort_dir: params.sort_dir || undefined,
      },
    },
  );

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page,
      total: data.total,
      last_page: data.last_page,
    },
    mapStockVehicleEquipment,
  );
};
