import { useQuery } from '@tanstack/react-query';
import type { GoodsStockMaterialParams } from '@/types/goods-stock-material.types';
import { getGoodsTransactionStockMaterial } from '@/services/warehouse/goodsTransactionStock.service';

export const warehouseStockMaterialKeys = {
  all: ['warehouse-stock-material'] as const,
  list: (params: GoodsStockMaterialParams) => [...warehouseStockMaterialKeys.all, params.company_id, params.in_stock ?? null, params.search ?? '', params.code ?? '', params.name ?? '', params.page ?? 1, params.per_page ?? 10] as const,
};

export function useGoodsTransactionStockMaterial(params: GoodsStockMaterialParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: warehouseStockMaterialKeys.list(params),
    queryFn: () => getGoodsTransactionStockMaterial(params),
    enabled: options?.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}
