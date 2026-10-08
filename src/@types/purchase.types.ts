// src/@types/purchase.types.ts

export type Currency = 'IDR' | 'USD';
export type UnitTransactionType = 'purchase' | 'sales';

export interface PurchaseUnit {
  id: string;
  purchaseId: string;
  typeUnitId: string;
  typeUnitName: string;

  qty: number;
  price: number;
  price_discount?: number;
  price_usd_discount?: number;

  biayaBBN: number;
  biayaEkspedisi: number;
  biayaLain: number;

  dppTaxVersionId: string;
  ppnTaxVersionId: string;

  hpp: number;
  dpp: number;
  ppn: number;
  total: number;
}

export interface PurchaseUnitItemDetail {
  id: string;
  uuid?: string;
  purchaseId?: string; // from parent unit_transaction
  unitTransactionItemId?: string;
  color?: string;
  machineNumber?: string;
  chassisNumber?: string;
  inStock?: boolean;
  createdAt?: string;
}

export interface Purchase {
  id: string;
  code: string;
  date: string;
  supplierName: string;
  supplierAddress?: string | null;
  supplierNpwp?: string | null;
  companyId: string;
  stockState?: string;
  maxCapacity?: number;
  warehouseName?: string;
  warehouseId?: string;
  transaction_date?: string;
  documentTemplateId?: string | null;

  totalDpp: number;
  totalPpn: number;
  totalBiaya: number;
  totalPurchase: number;

  unit_transaction_items: any[];

  totalPaid: number;
  remainingPayment: number;

  units: PurchaseUnit[];

  createdAt: string;
  updatedAt: string;
}

/* ============================
   REQUEST TYPES
============================ */

export interface CreatePurchaseRequest {
  warehouse_id: number;
  person_id: number;
  company_id: number;
  code?: string;
  type: UnitTransactionType;
  max_capacity: string;
  stock_state: 'draft';
  unit_type_id?: number;
  sparepart_id?: number;
  qty_total?: number;
  price?: number;
  bbn_price?: number;
  expedition_fee?: number;
  other_fee?: number;
  price_discount?: number;
  price_usd_discount?: number;
  transaction_date?: string;
  price_usd?: number;
  price_per_unit_usd?: number;
  usd_costs?: Array<{
    id?: number;
    cost_type: string;
    amount: number;
    note?: string | null;
  }>;
  document_template_id?: number | string | null;
}

export interface UpdatePurchaseRequest {
  company_id: number;
  person_id: number;
  code: string;
  type: 'purchase' | 'sales';
  max_capacity: string;
  stock_state: string;
  transaction_date?: string;
  document_template_id?: number | string | null;
}

export interface PurchaseFormValues {
  supplierName: string;
  date: string;
  code: string;
  supplierAddress?: string | null;
  supplierNpwp?: string | null;
  documentTemplateId?: string | number | null;
}

export interface CreatePurchaseUnitRequest {
  purchaseId: string;
  typeUnitId: string;
  typeUnitName: string;
  qty: number;
  price: number;
  price_discount?: number;
  price_usd_discount?: number;
  biayaBBN: number;
  biayaEkspedisi: number;
  dppTaxVersionId: string;
  ppnTaxVersionId: string;
  biayaLain: number;
  priceUsd?: number;
  pricePerUnitUsd?: number;
  usd_costs?: Array<{
    id?: number;
    cost_type: string;
    amount: number;
    note?: string | null;
  }>;
}

export interface PurchaseListResponse {
  data: Purchase[];
  total: number;
}

export interface PurchasePaginatedResponse {
  data: Purchase[];
  meta: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}

export interface PurchaseUnitItemRow {
  id: string;
  code: string;
  unitTransactionId: string;
  unitTransactionCode?: string;
  unitTypeId?: string;
  qtyTotal: number;
  price: number;
  price_discount?: number;
  price_usd_discount?: number;
  bbnPrice: number;
  expeditionFee: number;
  otherFee: number;
  hppPerUnit: number;
  dppPerUnit: number;
  ppnPerUnit: number;
  hppTotal: number;
  dppTotal: number;
  ppnTotal: number;
  totalDpp?: number;
  totalPpn?: number;
  totalPurchase?: number;
  supplierName?: string;
  createdAt?: string;
}

export interface PurchaseUnitItemPaginatedResponse {
  data: PurchaseUnitItemRow[];
  meta: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}
