import type { Kas } from './kas.types';
import type { Material } from './material.types';
import type { PaginatedResult } from './pagination.types';
import type { WarehouseOption } from './pengeluaran-unit.types';

export type MaterialTransactionType = 'purchase' | 'sales';

export interface MaterialTransactionDetailItem {
  id: number;
  uuid?: string;
  orderCode?: string;
  materialTransactionId: number;
  materialId: number;
  qty: number;
  price: number;
  total: number;
  inStock: boolean;
  isForecast: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  material?: Material;
}

export interface MaterialTransactionBilling {
  id: number;
  uuid?: string;
  materialTransactionId: number;
  cashId: number;
  amount: number;
  paymentDate?: string | null;
  description?: string | null;
  createdAt?: string;
  materialTransaction?: MaterialTransaction;
  cash?: Kas;
}

export interface MaterialTransaction {
  id: number;
  uuid?: string;
  code: string;
  type: MaterialTransactionType;
  warehouseId: number;
  warehouse?: WarehouseOption | null;
  stockState?: string;
  supplierName: string;
  isPaid: boolean;
  transactionDate: string;
  description?: string | null;
  totalAmount: number;
  totalPaid: number;
  totalUnpaid: number;
  createdAt?: string;
}

export interface MaterialTransactionDetail extends MaterialTransaction {
  materialTransactionDetails: MaterialTransactionDetailItem[];
  materialTransactionBillings: MaterialTransactionBilling[];
}

export interface MaterialTransactionPayload {
  type: MaterialTransactionType;
  warehouseId: number;
  supplierName: string;
  transactionDate: string;
  description?: string | null;
}

export interface MaterialTransactionItemPayload {
  orderCode: string;
  materialTransactionId: number;
  materialId: number;
  qty: number;
  price: number;
  description?: string | null;
}

export interface MaterialTransactionBillingPayload {
  materialTransactionId: number;
  cashId: number;
  amount: number;
  paymentDate?: string | null;
  description?: string | null;
}

export type MaterialTransactionListResponse = PaginatedResult<MaterialTransaction>;
export type MaterialTransactionItemListResponse = PaginatedResult<MaterialTransactionDetailItem>;
export type MaterialTransactionBillingListResponse = PaginatedResult<MaterialTransactionBilling>;
