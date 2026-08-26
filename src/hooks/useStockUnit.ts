import { useQuery } from '@tanstack/react-query';
import { getStockUnits } from '@/services/stock-unit.service';
import type { PaginationParams } from '@/types/pagination.types';

export const useStockUnits = (
  companyId: number | string | null,
  params: PaginationParams & {
    stock_state?: string;
    machine_number?: string;
    chassis_number?: string;
    color?: string;
    in_stock?: boolean | string;
    is_forecast?: boolean | string;
    is_sold_unit?: boolean | string;
    status?: string;
    specified?: string;
    activity_type?: string;
    unit_transaction_item_id?: number | string;
  },
) =>
  useQuery({
    queryKey: ['stock-unit', companyId, params],
    queryFn: () => getStockUnits(companyId!, params),
    enabled: !!companyId,
  });