export interface BaseJumlahDaftarReport {
  id: number;
  stnk_name: string | null;
  region: string | null;
  dealer: string | null;
  vendor: string | null;
  tnkb_number: string | null;
  vehicle_type: string | null;
  chassis_number: string | null;
  machine_number: string | null;
  registration_date: string | null;
  created_at: string | null;
}

export interface BpkbReportItem extends BaseJumlahDaftarReport {
  bpkb_number: string | null;
  bpkb_physical_status: boolean | null;
}

export interface StnkReportItem extends BaseJumlahDaftarReport {
  stnk_number: string | null;
  stnk_physical_status: boolean | null;
}

export interface SkpdReportItem extends BaseJumlahDaftarReport {
  skpd_number: string | null;
  skpd_physical_status: boolean | null;
}

export interface TnkbReportItem extends BaseJumlahDaftarReport {
  tnkb_physical_status: boolean | null;
}

export interface ReportPaginationResponse<T> {
  status: boolean;
  message: string;
  errors: unknown;
  data: {
    current_page: number;
    data: T[];
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    links?: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url?: string | null;
    prev_page_url?: string | null;
  };
}
