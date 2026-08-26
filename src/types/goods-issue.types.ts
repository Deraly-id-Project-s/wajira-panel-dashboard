import type { Kas } from './kas.types';
import type { Customer } from './customer.types';
import type { Material } from './material.types';
import type { PaginatedResult } from './pagination.types';

export type GoodsIssueItemUnit = 'pcs' | 'set' | 'box';

export interface GoodsIssuePayment {
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

export interface GoodsIssueBilling {
  id: number;
  uuid?: string;
  goodsTransactionId: number;
  isPaid: boolean;
  grandTotal: number;
  createdAt?: string;
  payments: GoodsIssuePayment[];
}

export interface GoodsIssueItem {
  id: number;
  uuid?: string;
  goodsTransactionId: number;
  materialId: number;
  qty: number;
  type: GoodsIssueItemUnit;
  price: number;
  total: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  material?: Material;
}

export interface GoodsIssue {
  id: number;
  uuid?: string;
  code: string;
  companyId: number;
  customerId: number;
  type: 'issue';
  transactionDate: string;
  location?: string | null;
  description?: string | null;
  invoiceFile?: string | null;
  createdAt?: string;
  totalBrutto: number;
  isPaid: boolean;
  customer?: Customer;
  goodsTransactionBillings?: GoodsIssueBilling[];
}

export interface GoodsIssueDetail extends GoodsIssue {
  goodsTransactionDetails: GoodsIssueItem[];
  goodsTransactionBillings: GoodsIssueBilling[];
}

export interface GoodsIssuePayload {
  customerId: number;
  transactionDate: string;
  description?: string | null;
  location?: string | null;
  companyId?: number;
}

export interface GoodsIssueItemPayload {
  goodsTransactionId: number;
  materialId: number;
  qty: number;
  type: GoodsIssueItemUnit;
  price: number;
  description?: string | null;
}

export interface GoodsIssueBillingPayload {
  goodsTransactionId: number;
}

export interface GoodsIssuePaymentPayload {
  goodsTransactionBillingId: number;
  cashId: number;
  amount: number;
  transactionDate: string;
  description?: string | null;
}

export interface GoodsIssueUploadInvoicePayload {
  invoiceFile: File;
}

export type GoodsIssueListResponse = PaginatedResult<GoodsIssue>;
