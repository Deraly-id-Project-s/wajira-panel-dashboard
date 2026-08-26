import type { PaginationMeta } from './pagination.types';

export interface GoodsStockMaterial {
  id: number;
  uuid: string;
  code: string;
  name: string;
  price: number;
  type: string;
  stockIn: number;
  stockOut: number;
  totalStock: number;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string | null;
}

export interface GoodsStockMaterialParams {
  company_id: number;
  in_stock?: boolean;
  code?: string;
  name?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface GoodsStockMaterialMeta extends PaginationMeta {
  from: number;
  to: number;
}

export interface GoodsStockMaterialResponse {
  data: GoodsStockMaterial[];
  meta: GoodsStockMaterialMeta;
}
