import { useQuery } from '@tanstack/react-query';
import { getStockVehicleEquipments } from '@/services/stock-vehicle-equipment.service';
import type { PaginationParams } from '@/@types/pagination.types';

export const useStockVehicleEquipments = (
  companyId: number | string | null,
  params: PaginationParams & { search?: string },
) =>
  useQuery({
    queryKey: ['stock-vehicle-equipment', companyId, params],
    queryFn: () => getStockVehicleEquipments(companyId!, params),
    enabled: !!companyId,
  });
