import type { Kas } from './kas.types';
import type { Material } from './material.types';
import type { PaginatedResult } from './pagination.types';
import type { Supplier } from './supplier.types';

export type GoodsReceiptItemUnit = 'pcs' | 'set' | 'box';

export interface GoodsReceiptPayment {
  id: number;
  uuid?: string;
  goodsTransactionBillingId: number;
  cashId: number;
  amount: number;
  transactionDate?: string | null;
  description?: string | null;
  createdAt?: string;
  cash?: Kas;
}

export interface GoodsReceiptBilling {
  id: number;
  uuid?: string;
  goodsTransactionId: number;
  isPaid: boolean;
  grandTotal: number;
  createdAt?: string;
  payments: GoodsReceiptPayment[];
}

export interface GoodsReceiptItem {
  id: number;
  uuid?: string;
  goodsTransactionId: number;
  materialId: number;
  qty: number;
  type: GoodsReceiptItemUnit;
  price: number;
  total: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  material?: Material;
}

export interface GoodsReceipt {
  id: number;
  uuid?: string;
  code: string;
  companyId: number;
  supplierId: number;
  type: 'receipt';
  transactionDate: string;
  location?: string | null;
  description?: string | null;
  invoiceFile?: string | null;
  createdAt?: string;
  totalBrutto: number;
  isPaid: boolean;
  supplier?: Supplier;
  goodsTransactionBillings?: GoodsReceiptBilling[];
}

export interface GoodsReceiptDetail extends GoodsReceipt {
  goodsTransactionDetails: GoodsReceiptItem[];
  goodsTransactionBillings: GoodsReceiptBilling[];
}

export interface GoodsReceiptPayload {
  supplierId: number;
  transactionDate: string;
  description?: string | null;
  location?: string | null;
  companyId?: number;
}

export interface GoodsReceiptItemPayload {
  goodsTransactionId: number;
  materialId: number;
  qty: number;
  type: GoodsReceiptItemUnit;
  price: number;
  description?: string | null;
}

export interface GoodsReceiptBillingPayload {
  goodsTransactionId: number;
}

export interface GoodsReceiptPaymentPayload {
  goodsTransactionBillingId: number;
  cashId: number;
  amount: number;
  transactionDate: string;
  description?: string | null;
}

export interface GoodsReceiptUploadInvoicePayload {
  invoiceFile: File;
}

export type GoodsReceiptListResponse = PaginatedResult<GoodsReceipt>;
