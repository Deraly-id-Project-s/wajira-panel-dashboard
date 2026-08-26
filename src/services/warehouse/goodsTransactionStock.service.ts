import type { GoodsStockMaterial, GoodsStockMaterialParams, GoodsStockMaterialResponse } from '@/types/goods-stock-material.types';
import { apiClient } from '@/lib/api/client';
import { type LaravelApiResponse, ensureSuccess } from '@/lib/api/response';

interface GoodsStockMaterialApiModel {
  id: number | string;
  uuid?: string;
  code?: string;
  name?: string;
  price?: number | string;
  type?: string;
  stock_in?: number | string | null;
  stock_out?: number | string | null;
  total_stock?: number | string | null;
  created_at?: string;
  updated_at?: string;
  customer_name?: string | null;
}

interface GoodsStockMaterialPaginationApiModel {
  current_page: number;
  data?: GoodsStockMaterialApiModel[];
  from?: number | null;
  to?: number | null;
  per_page?: number | string;
  total?: number | string;
  last_page?: number | string;
}

const basePath = '/wapi/warehouse/goods-transaction-stock';

const toNumber = (value: string | number | null | undefined) => Number(value ?? 0) || 0;

const mapGoodsStockMaterial = (payload: GoodsStockMaterialApiModel): GoodsStockMaterial => ({
  id: toNumber(payload.id),
  uuid: payload.uuid ?? '',
  code: payload.code ?? '',
  name: payload.name ?? '',
  price: toNumber(payload.price),
  type: payload.type ?? '',
  stockIn: toNumber(payload.stock_in),
  stockOut: toNumber(payload.stock_out),
  totalStock: toNumber(payload.total_stock),
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
  customerName: payload.customer_name ?? null,
});

export async function getGoodsTransactionStockMaterial(params: GoodsStockMaterialParams): Promise<GoodsStockMaterialResponse> {
  const response = await apiClient.get<LaravelApiResponse<GoodsStockMaterialPaginationApiModel>>(basePath, {
    params: {
      company_id: params.company_id,
      in_stock: (params.in_stock === true || String(params.in_stock) === 'true') ? 'true' : (params.in_stock === false || String(params.in_stock) === 'false') ? 'false' : undefined,
      code: params.code?.trim() ? params.code.trim() : undefined,
      name: params.name?.trim() ? params.name.trim() : undefined,
      search: params.search?.trim() ? params.search.trim() : undefined,
      page: params.page ?? 1,
      per_page: params.per_page ?? 10,
    },
  });

  const payload = ensureSuccess(response.data);
  const currentPage = toNumber(payload.current_page) || 1;
  const perPage = toNumber(payload.per_page) || 10;
  const total = toNumber(payload.total);
  const lastPage = toNumber(payload.last_page) || 1;
  const from = payload.from == null ? (total === 0 ? 0 : (currentPage - 1) * perPage + 1) : toNumber(payload.from);
  const to = payload.to == null ? Math.min(currentPage * perPage, total) : toNumber(payload.to);

  return {
    data: (payload.data ?? []).map(mapGoodsStockMaterial),
    meta: {
      currentPage,
      perPage,
      total,
      lastPage,
      from,
      to,
    },
  };
}
