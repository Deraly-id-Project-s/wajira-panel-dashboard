export interface FinanceAssetItem {
  id: number;
  uuid: string;
  asset_id: number;
  economic_age: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  depreciation_per_month: number;
  months_used: number;
  difference: number;
  final_value: number;
  asset: {
    id: number;
    code: string;
    serial_number: string;
    name: string;
    type: string;
    purchase_date: string;
    price: number;
  };
}

export interface FinanceAssetPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
}

export interface FinanceAssetListResponse {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: {
    current_page: number;
    data: FinanceAssetItem[];
    first_page_url: string | null;
    from: number;
    last_page: number;
    last_page_url: string | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface FinanceAssetListResult {
  data: FinanceAssetItem[];
  pagination: FinanceAssetPagination;
}

// Keep the old type around briefly if other components need it, but export the new ones.
export interface AssetReportItem {
  id: number;
  kodeAset: string;
  tanggalBeli: string;
  namaBarang: string;
  tipeAset: string;
  serialNumber: string;
  hargaBeli: number;
  umurEkonomis: string;
  penyusutanBulanan: number;
  nilaiAkhir: number;
}
