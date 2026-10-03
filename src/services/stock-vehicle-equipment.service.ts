import type { PaginationParams } from '@/@types/pagination.types';
import type { StockVehicleEquipment } from '@/@types/stock-vehicle-equipment.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

interface StockVehicleEquipmentApiModel {
  vehicle_equipment_code?: string;
  vehicle_equipment_name?: string;
  stock_available?: number;
  stock_used?: number;
  total_stock?: number;
  kode_perlengkapan?: string;
  nama_perlengkapan?: string;
  stok_tersedia?: number;
  stok_terpakai?: number;
  total_stok?: number;
}

const mapStockVehicleEquipment = (
  payload: StockVehicleEquipmentApiModel,
  index = 0,
): StockVehicleEquipment => ({
  id: String(index),
  vehicleEquipmentCode: payload.vehicle_equipment_code ?? payload.kode_perlengkapan ?? '-',
  vehicleEquipmentName: payload.vehicle_equipment_name ?? payload.nama_perlengkapan ?? '-',
  stockAvailable: Number(payload.stock_available ?? payload.stok_tersedia ?? 0),
  stockUsed: Number(payload.stock_used ?? payload.stok_terpakai ?? 0),
  totalStock: Number(payload.total_stock ?? payload.total_stok ?? 0),
});

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
    search?: string;
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
