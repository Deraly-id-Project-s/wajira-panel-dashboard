export interface PenerimaanUnit {
  id: string;
  noPenerimaan: string;
  tanggal: string;
  supplier: string;
  keterangan?: string;
  state?: string;
  isSoldUnit?: boolean;
  state_note?: string;
  activity_date?: string;
  person?: {
    id: string;
    name: string;
  } | null;
}

export interface PenerimaanUnitDetail {
  id: number;
  penerimaanId: string;
  noPembelian: string;
  tipeUnit: string;
  warna: string;
  noMesin: string;
  noRangka: string;
  diterima: boolean;
}

export interface TransformedReceiptUnitData {
  id: number;
  purchaseCode: string;
  unitTypeName: string;
  color: string;
  machineNumber: string;
  chassisNumber: string;
  status: string;
  in_stock: boolean;
  unitTransactionId: number;
  received: boolean;
}
