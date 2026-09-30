import { PaginationMeta } from '@/@types/pagination.types';

export interface VehicleEquipmentBillingHistory {
  id: number;
  uuid?: string;
  goods_transaction_billing_id: number;
  payment_proof?: string | null;
  bca_payment_amount?: number;
  cash_payment_amount?: number;
  bca_payment_usd_amount?: number;
  payment_at?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleEquipmentBilling {
  id: number;
  uuid?: string;
  goods_transaction_id: number;
  grand_total: number;
  last_payment_at: string | null;
  is_paid: boolean;
  is_remaining_payment?: number | string | null;
  created_at?: string;
  updated_at?: string;
  goods_transaction_billing_histories?: VehicleEquipmentBillingHistory[];
}

export interface VehicleEquipmentBillingSummary {
  grand_total: number;
  total_paid: number;
  remaining_payment: number;
  is_paid: boolean;
}

export interface VehicleEquipmentTransaction {
  id: number;
  uuid?: string;
  code: string;
  warehouse_id?: number | null;
  company_id?: number | null;
  person_id: number;
  vehicle_equipment_id: number;
  transaction_type?: 'vehicle_equipment' | 'vehicle-equipment' | string;
  type: 'purchase' | 'sales';
  billing_type: 'cash' | 'credit' | 'transfer' | string;
  is_refunded?: boolean;
  has_warehouse_activity?: boolean;
  qty: number;
  price: number;
  discount: number;
  transaction_date: string;
  nota_number?: string | null;
  billing_due_date?: string | null;
  invoice_file?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
  transaction_bruto_total?: number;
  transaction_netto_total?: number;
  billing_summary?: VehicleEquipmentBillingSummary;
  goods_transaction_billing?: VehicleEquipmentBilling;
  warehouse?: { id?: number | string; name?: string } | null;
  person?: { id?: number | string; name?: string } | null;
  supplier?: { name?: string } | null;
  customer?: { name?: string } | null;
  vehicle_equipment?: {
    id: number;
    uuid?: string;
    code: string;
    name: string;
    description?: string | null;
    buy_price?: number;
    sell_price?: number;
  } | null;
}

export interface VehicleEquipmentTransactionResponse {
  data: VehicleEquipmentTransaction[];
  meta: PaginationMeta;
}

export interface CreateVehicleEquipmentTransactionPayload {
  warehouse_id?: number;
  company_id: number;
  person_id: number;
  vehicle_equipment_id: number;
  transaction_type?: string;
  type: 'purchase' | 'sales' | string;
  billing_type: 'cash' | 'credit' | 'transfer' | string;
  qty: number;
  price: number;
  discount: number;
  transaction_date: string;
  nota_number?: string;
  billing_due_date?: string | null;
  invoice_file?: File | null;
  note?: string;
}

export interface UpdateVehicleEquipmentTransactionPayload extends Omit<CreateVehicleEquipmentTransactionPayload, 'company_id'> {
  company_id?: number;
}

export interface CreateVehicleEquipmentBillingHistoryPayload {
  goods_transaction_billing_id: number;
  bca_payment_amount?: number;
  bca_payment_usd_amount?: number;
  cash_payment_amount?: number;
  payment_at: string;
  note?: string;
  payment_proof?: File | null;
}

export interface UpdateVehicleEquipmentBillingHistoryPayload extends CreateVehicleEquipmentBillingHistoryPayload { }
