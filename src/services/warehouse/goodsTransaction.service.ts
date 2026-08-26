import type { PaginationParams } from '@/types/pagination.types';
import type {
  GoodsIssueEquipment,
  GoodsIssueEquipmentDetail,
  GoodsIssueEquipmentPayload,
  GoodsIssueEquipmentResponse,
  GoodsTransactionDetailEquipment,
} from '@/types/goods-issue-equipment.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, type LaravelApiResponse, ensureSuccess, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/transaction/goods-transaction';

const toNumber = (value: string | number | undefined | null) => Number(value ?? 0) || 0;

const mapDriver = (item: any) => {
  if (!item) return null;
  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name || '',
    phone: item.phone || '',
  };
};

const mapVehicleFleet = (item: any) => {
  if (!item) return null;
  return {
    id: item.id,
    uuid: item.uuid,
    registrationNumber: item.registration_number || '',
    type: item.type || '',
    machineNumber: item.machine_number || '',
    chassisNumber: item.chassis_number || '',
    equipment: {},
  };
};

const mapEquipmentItem = (item: any) => {
  if (!item) return null;
  return {
    id: item.id,
    uuid: item.uuid,
    code: item.code || '',
    name: item.name || '',
  };
};

const mapDetailItem = (item: any): GoodsTransactionDetailEquipment => ({
  id: item.id,
  uuid: item.uuid,
  goodsTransactionId: toNumber(item.goods_transaction_id),
  vehicleEquipmentId: toNumber(item.vehicle_equipment_id),
  qty: toNumber(item.qty),
  price: toNumber(item.price),
  inStock: item.in_stock === true || item.in_stock === 1,
  isForecast: item.is_forecast === true || item.is_forecast === 1,
  description: item.description ?? null,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  total: toNumber(item.total) || toNumber(item.qty) * toNumber(item.price),
  vehicleEquipment: mapEquipmentItem(item.vehicle_equipment),
});

const mapGoodsIssueEquipment = (item: any): GoodsIssueEquipment => ({
  id: item.id,
  uuid: item.uuid,
  code: item.code || '',
  companyId: toNumber(item.company_id),
  vehicleFleetId: toNumber(item.vehicle_fleet_id),
  driverId: toNumber(item.driver_id),
  category: item.category || 'equipped',
  type: 'issue',
  transactionDate: item.transaction_date || '',
  description: item.description ?? null,
  invoiceFile: item.invoice_file ?? null,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  totalBrutto: toNumber(item.total_brutto),
  driver: mapDriver(item.driver),
  vehicleFleet: mapVehicleFleet(item.vehicle_fleet),
});

export const getGoodsIssueEquipments = async (
  params: PaginationParams & {
    companyId?: number | string;
    code?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
  },
): Promise<GoodsIssueEquipmentResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      type: 'issue',
      company_id: params.companyId ?? 4,
      category: 'equipped',
      code: params.code,
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
      location: params.location,
    },
  });

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page ?? 10,
      total: data.total,
      last_page: data.last_page,
    },
    mapGoodsIssueEquipment,
  );
};

export const getGoodsIssueEquipmentById = async (id: number | string): Promise<GoodsIssueEquipmentDetail> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);

  return {
    ...mapGoodsIssueEquipment(data),
    goodsTransactionDetails: (data.goods_transaction_details ?? []).map(mapDetailItem),
  };
};

export const createGoodsIssueEquipment = async (payload: GoodsIssueEquipmentPayload): Promise<GoodsIssueEquipment> => {
  try {
    const body = new URLSearchParams();
    body.append('type', 'issue');
    body.append('company_id', String(payload.companyId ?? 4));
    body.append('category', payload.category);
    body.append('vehicle_fleet_id', String(payload.vehicleFleetId));
    body.append('driver_id', String(payload.driverId));
    body.append('transaction_date', payload.transactionDate);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<LaravelApiResponse<any>>(basePath, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapGoodsIssueEquipment(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateGoodsIssueEquipment = async (id: number | string, payload: GoodsIssueEquipmentPayload): Promise<GoodsIssueEquipment> => {
  try {
    const body = new URLSearchParams();
    body.append('type', 'issue');
    body.append('company_id', String(payload.companyId ?? 4));
    body.append('category', payload.category);
    body.append('vehicle_fleet_id', String(payload.vehicleFleetId));
    body.append('driver_id', String(payload.driverId));
    body.append('transaction_date', payload.transactionDate);
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapGoodsIssueEquipment(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteGoodsIssueEquipment = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete goods issue transaction');
  }
};
