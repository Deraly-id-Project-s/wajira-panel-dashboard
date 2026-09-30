import { useQuery } from '@tanstack/react-query';
import { getStockVehicleEquipments } from '@/services/stock-vehicle-equipment.service';
import type { PaginationParams } from '@/@types/pagination.types';

export const useStockVehicleEquipments = (
  companyId: number | string | null,
  params: PaginationParams & {
    id?: number | string;
    specified?: string;
    in_stock?: boolean | string;
    vehicle_equipment_id?: number | string;
    machine_number?: string;
    chassis_number?: string;
    activity_number?: string;
    code?: string;
    activity_type?: string;
    stock_state?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc' | string;
  },
) =>
  useQuery({
    queryKey: ['stock-vehicle-equipment', companyId, params],
    queryFn: () => getStockVehicleEquipments(companyId!, params),
    enabled: !!companyId,
  });
