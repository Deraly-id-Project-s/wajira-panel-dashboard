export interface WarehouseActivity {
  id: number;
  uuid: string;
  person_id: number;
  cash_id: number | null;
  warehouse_id: number;
  type: 'unit-type' | 'sparepart' | string;
  unit_transaction_id: number | null;
  sparepart_transaction_id: number | null;
  activity_number: string;
  activity_type: 'receipt' | 'issue' | string;
  activity_date: string;
  description: string | null;
  state: 'draft' | 'process' | 'done' | string;
  warehouse?: {
    id: number;
    uuid: string;
    name: string;
  } | null;
  person?: {
    id: number;
    uuid: string;
    name: string;
  } | null;
  cash?: any;
  unit_transaction?: any;
  sparepart_transaction?: any;
}
