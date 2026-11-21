export type StockStatus =
  | 'draft'
  | 'cancel'
  | 'rejected'
  | 'prepare'
  | 'inbound_purcase_order'
  | 'inbound_incoming_goods'
  | 'inbound_receipt'
  | 'inbound_return'
  | 'outbound_reserved'
  | 'outbound_in_transit'
  | 'outbound_delivered'
  | 'outbound_return';

export type Status = 'normal' | 'minor_damage' | 'major_damage' | 'returned' | 'refunded' | 'lost' | 'in_repair';

export type UnitItemDetailStatus = Status;

export type UnitItemDetailStockState =
  | 'receipt'
  | 'draft'
  | 'cancel'
  | 'prepare'
  | 'purchase_order'
  | 'in_transit';

export interface InitImportStockPayload {
  unit_type_id: number;
  qty_total: number;
  price?: number;
  file?: File | null;
  warehouse_sub_block_id?: number | null;
  in_stock?: boolean;
  status?: UnitItemDetailStatus;
  stock_state?: UnitItemDetailStockState;
}

export interface InitImportStockResponse {
  status: boolean;
  message: string;
  errors?: Record<string, string[]> | string | null;
  data?: any;
}

export interface StockUnit {
  id: string;
  namaUnit: string;
  warna: string;
  noMesin: string;
  noRangka: string;
  status: Status;
  inStock: boolean;
  stockStatus: StockStatus;
  isSoldUnit: boolean;
  isForecast: boolean;
  unitType?: {
    id?: number;
    code?: string;
    name?: string;
    unit_type?: string;
    unit_model?: string;
    brand_id?: number;
    brand?: {
      id?: number;
      uuid?: string;
      name?: string;
    } | null;
  } | null;
  brand?: {
    id?: number;
    uuid?: string;
    name?: string;
  } | null;
  branch?: {
    id?: number;
    name?: string;
  } | null;
  warehouseSubBlock?: {
    id: number;
    name: string;
  } | null;
  customer?: {
    id?: number | null;
    name?: string | null;
  } | null;
  supplier?: {
    id?: number | null;
    name?: string | null;
  } | null;
}
