import { apiClient } from '@/lib/api/client';

export interface PenerimaanParams {
  page?: number;
  type?: string;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  person_id?: number;
  unit_type_id?: number;
  sort_dir?: 'asc' | 'desc';
  company_id?: string | number | null;
}

export interface PenerimaanItem {
  id: number;
  type?: string;
  transaction_code: string;
  receipt_date: string;
  person: string;
  unit_type: { id: number; name: string };
  machine_number: string;
  chassis_number: string;
  color: string;
  warehouse_movement?: { serial_number: string };
  warehouse_sub_block?: { id: number; name: string } | null;
}

export interface PenerimaanResponse {
  current_page: number;
  data: PenerimaanItem[];
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const normalizePenerimaanItem = (item: any): PenerimaanItem => ({
  id: item.id,
  transaction_code: item.transaction_code || item.code || '-',
  receipt_date: item.receipt_date || item.created_date || item.created_at || new Date().toISOString(),
  person: typeof item.person === 'string' ? item.person : item.person?.name || '-',
  unit_type: {
    id: item.unit_type?.id || 0,
    name: item.unit_type?.name || '-',
  },
  machine_number: item.machine_number || '-',
  chassis_number: item.chassis_number || '-',
  color: item.color || '-',
  warehouse_movement: item.warehouse_movement,
  warehouse_sub_block: item.warehouse_sub_block,
});

export const getLaporanPenerimaan = async (
  params: PenerimaanParams = {}
): Promise<PenerimaanResponse> => {
  const response = await apiClient.get('/wapi/report/unit-type-detail-report', {
    params: {
      sort_dir: 'asc',
      ...params,
    },
  });

  const payload = response.data?.data || {};
  const rows = Array.isArray(payload.data) ? payload.data : [];

  return {
    current_page: payload.current_page || 1,
    data: rows.map(normalizePenerimaanItem),
    last_page: payload.last_page || 1,
    per_page: payload.per_page || params.per_page || 10,
    total: payload.total || 0,
    from: payload.from || 0,
    to: payload.to || 0,
  };
};

export const getSuppliers = async () => {
  const response = await apiClient.get('/wapi/master-data/supplier', {
    params: { per_page: 1000 },
  });
  const payload = response.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getUnitTypes = async () => {
  const response = await apiClient.get('/wapi/master-data/unit-type', {
    params: { sort_by: 'created_at', sort_order: 'asc' },
  });
  const payload = response.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};
