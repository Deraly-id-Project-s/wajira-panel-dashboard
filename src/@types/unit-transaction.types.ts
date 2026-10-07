import { PaginationMeta } from '@/@types/pagination.types';
import { WarehouseActivity } from './warehouse-activity.types';


export interface UnitTransactionBillingHistoryCashPivot {
  unit_transaction_billing_history_id: string | number;
  cash_id: string | number;
  amount: number;
  original_amount: number;
  exchange_amount: number;
}

export interface UnitTransactionBillingHistoryCash {
  id: string | number;
  uuid?: string;
  company_id?: string | number;
  account_id?: string | number | null;
  code: string;
  cash_name: string;
  description?: string | null;
  amount: number;
  type: string;
  created_at?: string;
  updated_at?: string;
  pivot: UnitTransactionBillingHistoryCashPivot;
}

export interface UnitTransactionBillingHistory {
  id?: string;
  uuid?: string;
  unit_transaction_billing_id?: string;
  payment_proof?: string | null;
  bca_payment_amount?: number;
  cash_payment_amount?: number;
  bca_payment_usd_amount?: number;
  payment_at?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  cashes?: UnitTransactionBillingHistoryCash[];
}

export interface UnitTransactionBilling {
  id?: string;
  uuid?: string;
  unit_transaction_id?: string;
  is_paid?: boolean;
  payment_at?: string | null;
  grand_total?: number;
  total_paid?: number;
  remaining_payment?: number;
  unit_transaction_billing_histories?: UnitTransactionBillingHistory[];
}

export interface UnitTransactionBillingSummary {
  grand_total?: number;
  total_usd_payment?: number;
  total_cash_payment?: number;
  total_bca_payment?: number;
  total_bca_usd_payment?: number;
  total_paid?: number;
  total_paid_usd?: number;
  remaining_payment?: number;
  remaining_payment_usd?: number;
  is_paid?: boolean;
}

export interface UnitTransaction {
  id: string;
  code: string;
  created_at: string;
  supplier: string;
  warehouse: string;
  transaction_bruto_total: number;
  transaction_dpp_total: number;
  transaction_ppn_total: number;
  transaction_bbn_total: number;
  transaction_other_fee: number;
  expedition_fee_total: number;
  total_operational_fee: number;
  stock_state: string;
  unit_transaction_billing?: UnitTransactionBilling | null;
  isPaid: boolean;
  isRefunded: boolean | string | null;
  paymentAt: string | null;
  remainingPayment: number;
  isUnitTypeDetailValid?: boolean;
  billing_summary?: UnitTransactionBillingSummary | null;
  documentTemplateId?: string | null;
}

export interface UnitTransactionResponse {
  data: UnitTransaction[];
  meta: PaginationMeta;
}

export interface UnitTransactionPerson {
  id?: string;
  name: string;
}

export interface UnitTransactionWarehouse {
  id?: string;
  name: string;
}

export interface WarehouseSubBlock {
  id?: string | undefined;
  name?: string | undefined;
}

export interface UnitTransactionItemDetail {
  id: string;
  unit_transaction_item_id: string;
  code: string;
  created_at: string | undefined;
  stock_state: string | null;
  max_capacity?: number;
  person: UnitTransactionPerson;
  price?: number;
  status?: string;
  unit_type_name: string | undefined;
  in_stock?: string | boolean | number | undefined;
  is_forecast?: string | boolean | undefined;
  color?: string;
  chassis_number?: string;
  machine_number?: string;
  unit_transaction_bruto_total: number;
  unit_transaction_item_total_hpp: number;
  unit_transaction_item_total_dpp: number;
  unit_transaction_item_total_ppn: number;
  unit_transaction_item_bruto_total: number;
  transaction_bbn_total: number;
  transaction_other_fee: number;
  warehouse_sub_block: WarehouseSubBlock;
  is_sold_unit: boolean | undefined;
  expedition_fee_total: number;
  total_operational_fee?: number;
  source_transaction_before_id?: number | string | null;
  source_transaction_before?: {
    id?: number | string;
    uuid?: string;
    code?: string | null;
    type?: string | null;
    transaction_type?: string | null;
  } | null;
  has_refund_transaction?: boolean;
  billing_summary?: UnitTransactionBillingSummary | null;
  unit_transaction_billing?: UnitTransactionBilling | null;
}

export interface UnitTransactionDetail {
  id: string;
  code: string;
  created_at: string;
  stock_state: string;
  type?: string;
  max_capacity?: number;
  person: UnitTransactionPerson;
  warehouse: UnitTransactionWarehouse;
  price?: number;
  in_stock?: string;
  is_forecast?: string;
  status?: string;
  unit_type_name: string;
  color?: string;
  chassis_number?: string;
  machine_number?: string;
  unit_transaction_bruto_total: number;
  unit_transaction_item_total_hpp: number;
  unit_transaction_item_total_dpp: number;
  unit_transaction_item_total_ppn: number;
  unit_transaction_item_bruto_total: number;
  transaction_bbn_total: number;
  transaction_other_fee: number;
  expedition_fee_total: number;
  total_operational_fee?: number;
  has_refund_transaction?: boolean;
  warehouse_activity?: WarehouseActivity | null;
  billing_summary?: UnitTransactionBillingSummary | null;
  unit_transaction_billing?: UnitTransactionBilling | null;
  unit_transaction_adjustments?: any[];
  unit_transaction_items?: any[];
  isUnitTypeDetailValid?: boolean;
  documentTemplateId?: string | null;
  unit_transaction_price_usd_total?: number;
  unit_transaction_price_usd_total_actual?: number;
  pivot: {
    unit_transaction_item_detail_id: number;
  };
}

export interface UnitTransactionItem {
  id: string;
  unit_transaction_id: string;
  unit_type_id?: string;
  sparepart_id?: string;
  qty_total: number;
  price: number;
  bbn_price: number;
  expedition_fee: number;
  other_fee: number;
  hpp_total_price?: number;
  dpp_total_price: number;
  ppn_total_price: number;
  price_usd?: number;
  price_per_unit_usd?: number;
  price_total?: number;
  dpp_tax_id?: string | number;
  ppn_tax_id?: string | number;
  ppn_tax_rate?: number;
  dpp_tax_rate?: number;
  dpp_tax?: {
    id?: number,
    tax_id?: number
    tax?: {
      id?: number,
      name?: string,
      code?: string,
    }
  };
  ppn_tax?: {
    id?: number,
    tax_id?: number
    tax?: {
      id?: number,
      name?: string,
      code?: string,
    }
  };
}

export interface UnitTransactionItemListResponse {
  data: UnitTransactionItem[];
  meta: PaginationMeta;
}

export interface CreateUnitTransactionItemPayload {
  unit_transaction_id: string;
  unit_type_id: string;
  sparepart_id?: string;
  qty_total: number;
  price: number;
  bbn_price: number;
  expedition_fee: number;
  other_fee: number;
  company_id?: string | number;
  type?: string;
  price_usd?: number;
  price_per_unit_usd?: number;
  dpp_tax_id?: number | string;
  ppn_tax_id?: number | string;
}

export interface UpdateUnitTransactionItemPayload {
  unit_transaction_id?: string;
  unit_type_id?: string;
  sparepart_id?: string;
  qty_total?: number;
  price?: number;
  bbn_price?: number;
  expedition_fee?: number;
  other_fee?: number;
  price_usd?: number;
  price_per_unit_usd?: number;
  dpp_tax_id?: number | string;
  ppn_tax_id?: number | string;
}

export interface TaxInfo {
  id?: string | number;
  tax_id?: string | number;
  tax?: {
    id?: string | number;
    name?: string;
    code?: string;
  } | null;
}

export interface UnitTransactionItemSummary {
  id: string;
  unit_transaction_id: string;
  unit_transaction_code?: string;
  unit_type_id?: string;
  qty_total: number;
  price: number;
  bbn_price: number;
  expedition_fee: number;
  price_usd?: number;
  price_per_unit_usd?: number;
  other_fee: number;
  hpp_per_unit_price?: number;
  dpp_per_unit_price?: number;
  ppn_per_unit_price?: number;
  dpp_tax_id?: string | number;
  ppn_tax_id?: string | number;
  dpp_tax_rate?: number;
  ppn_tax_rate?: number;
  hpp_total_price?: number;
  dpp_total_price?: number;
  ppn_total_price?: number;
  price_total?: number;
  dpp_tax?: TaxInfo | null;
  ppn_tax?: TaxInfo | null;
  unit_type?: {
    id?: string | number;
    name?: string;
    code?: string;
  } | null;
  unit_transaction_item_details?: UnitTransactionItemDetail[];
}

export interface TransactionAdjustment {
  id: string;
  unit_transaction_id: string;
  cash_id?: string;
  amount: number;
  description: string;
  date?: string;
  created_at?: string;
}

export interface UnitTransactionItemDetailListResponse {
  data: UnitTransactionItemDetail[];
  meta: PaginationMeta;
}

export interface UnitTransactionTypeDetail {
  id: string;
  unit_transaction_item_id: string;
  warehouse_sub_block_id?: string | null;
  uuid: string;
  color?: string | null;
  machine_number?: string | null;
  chassis_number?: string | null;
  in_stock: boolean;
  is_forecast: boolean;
  status?: string | null;
  stock_state?: string | null;
  is_sold_unit: boolean;
  created_at?: string;
  updated_at?: string;
  person?: {
    id: number | string;
    uuid?: string;
    code?: string;
    type?: string;
    name: string;
  } | null;
  unit_transaction_item: {
    id: string;
    unit_transaction_id: string;
    unit_type_id: string;
    price?: number;
    price_usd?: number;
    price_per_unit_usd?: number;
    unit_type: {
      id: string;
      code: string;
      name: string;
      unit_type?: string | null;
      unit_model?: string | null;
      buy_price: number;
      sell_price: number;
    } | null;
  } | null;
  warehouse_sub_block: WarehouseSubBlock | null;
}

export interface UnitTransactionTypeDetailListResponse {
  data: UnitTransactionTypeDetail[];
  meta: PaginationMeta;
}

export interface CreateUnitItemDetailPayload {
  unit_transaction_item_id: string;
  color: string;
  machine_number: string;
  chassis_number: string;
}

export interface UpdateUnitItemDetailPayload {
  unit_transaction_item_id: string;
  color: string;
  machine_number: string;
  chassis_number: string;
}

export interface WarehouseStockUnit {
  id: number;
  color: string;
  machine_number: string;
  chassis_number: string;
  unit_type_id?: string;
  warehouse_id?: string;
  in_stock?: boolean;
  status?: string | undefined;
  warehouse_sub_block?: WarehouseSubBlock;
  stock_state?: string | null;
  is_reserved?: boolean;
  source_transaction_before_id?: number | string | null;
  source_transaction_before?: {
    id?: number | string;
    uuid?: string;
    code?: string | null;
    type?: string | null;
    transaction_type?: string | null;
  } | null;
  unit_transaction_item_sales?: {
    id?: number | string;
    unit_transaction_item_id?: number | string;
    unit_transaction_item_detail_id?: number | string;
    unit_transaction_item?: {
      id?: number | string;
      unit_transaction_id?: number | string;
      unit_transaction?: {
        id?: number | string;
        code?: string | null;
        type?: string | null;
      } | null;
    } | null;
  } | null;
}

export interface UnitTransactionItemSalesAssignment {
  id: string;
  unit_transaction_item_id: string;
  unit_transaction_details: number[];
  details: WarehouseStockUnit[];
}
