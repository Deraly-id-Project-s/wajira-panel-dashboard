export interface VehicleEquipmentTransactionItem {
  id: number;
  uuid: string;
  code: string;
  type: 'purchase' | 'sales' | string;
  billing_type: string;
  qty: number;
  discount: number;
  total_netto: number;
  transaction_date: string;
  nota_number: string | null;
  vehicle_equipment: {
    id: number;
    code: string;
    name: string;
  } | null;
  person: {
    id: number;
    name: string;
    type: string;
  } | null;
  billing_summary: {
    is_paid: boolean;
    grand_total: number;
    total_paid: number;
    remaining_payment: number;
  } | null;
  warehouse: {
    id: number;
    name: string;
  } | null;
}

export interface VehicleEquipmentTransactionReportParams {
  page?: number;
  perPage?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  type?: 'purchase' | 'sales';
  state?: 'done' | 'draft' | 'process' | string;
  warehouse_id?: number;
  code?: string;
  vehicle_equipment_id?: number;
}
