import { useQuery } from '@tanstack/react-query';
import { getStockSpareparts } from '@/services/stock-sparepart.service';
import type { PaginationParams } from '@/@types/pagination.types';

export const useStockSpareparts = (
  companyId: number | string | null,
  params: PaginationParams & {
    stock_state?: string;
    activity_type?: string;
    in_stock?: boolean | string;
    specified?: string;
    search?: string;
  },
) =>
  useQuery({
    queryKey: ['stock-sparepart', companyId, params],
    queryFn: () => getStockSpareparts(companyId!, params),
    enabled: !!companyId,
  });
