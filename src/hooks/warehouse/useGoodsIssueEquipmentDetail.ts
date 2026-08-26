import { useQuery } from '@tanstack/react-query';
import type { PaginationParams } from '@/types/pagination.types';
import { getGoodsTransactionDetails } from '@/services/warehouse/goodsTransactionDetail.service';
import { goodsIssueEquipmentKeys } from './useGoodsIssueEquipment';

export function useGoodsTransactionDetails(
  params: PaginationParams & {
    material_transaction_id?: number | string;
    goods_transaction_id?: number | string;
    in_stock?: boolean;
    is_forecast?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    enabled?: boolean;
  },
) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: goodsIssueEquipmentKeys.details(rest),
    queryFn: () => getGoodsTransactionDetails(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}
