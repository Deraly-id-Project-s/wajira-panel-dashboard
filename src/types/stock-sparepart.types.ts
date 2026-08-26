import type { Status, StockStatus } from './stock-unit.types';

export interface StockSparepart {
  id: string;
  sparepartId: number;
  sparepartCode: string;
  sparepartName: string;
  price: number;
  qty: number;
  status: Status;
  stockStatus: StockStatus;
  warehouseSubBlock?: {
    id: number;
    name: string;
  } | null;
  activity_type?: string;
  specified?: string;
  inStock?: boolean;
}
