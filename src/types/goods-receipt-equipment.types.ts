import type { Kas } from './kas.types';
import type { PaginatedResult } from './pagination.types';
import type { Supplier } from './supplier.types';
import type { VehicleEquipment } from './vehicle-equipment.types';

export interface GoodsReceiptEquipmentPayment {
  id: number;
  uuid?: string;
  goodsTransactionBillingId: number;
  cashId: number;
  amount: number;
  transactionDate?: string | null;
  description?: string | null;
  createdAt?: string;
  cash?: Kas | null;
}

export interface GoodsReceiptEquipmentBilling {
  id: number;
  uuid?: string;
  goodsTransactionId: number;
  isPaid: boolean;
  grandTotal: number;
  createdAt?: string;
  payments: GoodsReceiptEquipmentPayment[];
}

export interface GoodsTransactionDetailEquipment {
  id: number;
  uuid?: string;
  goodsTransactionId: number;
  vehicleEquipmentId: number;
  qty: number;
  price?: number;
  inStock?: boolean;
  isForecast?: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  total?: number;
  vehicleEquipment?: VehicleEquipment | null;
  goodsTransaction?: GoodsReceiptEquipment | null;
}

export interface GoodsReceiptEquipment {
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
  supplier?: Supplier | null;
  goodsTransactionBillings?: GoodsReceiptEquipmentBilling[];
}

export interface GoodsReceiptEquipmentDetail extends GoodsReceiptEquipment {
  goodsTransactionDetails: GoodsTransactionDetailEquipment[];
  goodsTransactionBillings: GoodsReceiptEquipmentBilling[];
}

export interface GoodsReceiptEquipmentPayload {
  supplierId: number;
  transactionDate: string;
  description?: string | null;
  location?: string | null;
  companyId?: number;
  type: 'receipt';
}

export interface GoodsTransactionDetailEquipmentPayload {
  goodsTransactionId: number;
  vehicleEquipmentId: number;
  qty: number;
  price?: number;
  description?: string | null;
}

export interface GoodsReceiptEquipmentBillingPayload {
  goodsTransactionId: number;
}

export interface GoodsReceiptEquipmentPaymentPayload {
  goodsTransactionBillingId: number;
  cashId: number;
  amount: number;
  transactionDate: string;
  description?: string | null;
}

export type GoodsReceiptEquipmentResponse = PaginatedResult<GoodsReceiptEquipment>;
