import type { PaginationParams } from '@/types/pagination.types';
import type {
  GoodsTransactionDetailEquipment,
  GoodsTransactionDetailEquipmentPayload,
} from '@/types/goods-issue-equipment.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, type LaravelApiResponse, ensureSuccess } from '@/lib/api/response';

const detailBasePath = '/wapi/transaction/goods-transaction-detail';

const toNumber = (value: string | number | undefined | null) => Number(value ?? 0) || 0;

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

export const getGoodsTransactionDetails = async (
  params: PaginationParams & {
    material_transaction_id?: number | string;
    goods_transaction_id?: number | string;
    in_stock?: boolean;
    is_forecast?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  },
): Promise<{ data: GoodsTransactionDetailEquipment[] }> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(detailBasePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      // support both keys just in case backend expects either
      material_transaction_id: params.goods_transaction_id ?? params.material_transaction_id,
      goods_transaction_id: params.goods_transaction_id ?? params.material_transaction_id,
      in_stock: params.in_stock,
      is_forecast: params.is_forecast,
      search: params.search,
      sort_by: params.sort_by ?? 'id',
      sort_order: params.sort_order ?? 'desc',
    },
  });

  const data = ensureSuccess(response.data);
  const rawData = Array.isArray(data.data) ? data.data : [];
  
  // Filter for details that have vehicle_equipment_id
  const filtered = rawData
    .filter((item: any) => item.vehicle_equipment_id != null)
    .map(mapDetailItem);

  return {
    data: filtered,
  };
};

export const getGoodsTransactionDetailById = async (id: number | string): Promise<GoodsTransactionDetailEquipment> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${detailBasePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapDetailItem(data);
};

export const createGoodsTransactionDetail = async (payload: GoodsTransactionDetailEquipmentPayload): Promise<GoodsTransactionDetailEquipment> => {
  try {
    const body = new FormData();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    body.append('vehicle_equipment_id', String(payload.vehicleEquipmentId));
    body.append('qty', String(payload.qty));
    if (payload.price !== undefined && payload.price !== null) {
      body.append('price', String(payload.price));
    }
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.post<LaravelApiResponse<any>>(detailBasePath, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapDetailItem(ensureSuccess(response.data));
  } catch (error) {
    throw error;
  }
};

export const updateGoodsTransactionDetail = async (id: number | string, payload: GoodsTransactionDetailEquipmentPayload): Promise<GoodsTransactionDetailEquipment> => {
  try {
    const body = new URLSearchParams();
    body.append('goods_transaction_id', String(payload.goodsTransactionId));
    body.append('vehicle_equipment_id', String(payload.vehicleEquipmentId));
    body.append('qty', String(payload.qty));
    if (payload.price !== undefined && payload.price !== null) {
      body.append('price', String(payload.price));
    }
    if (payload.description) body.append('description', payload.description);

    const response = await apiClient.put<LaravelApiResponse<any>>(`${detailBasePath}/${id}`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapDetailItem(ensureSuccess(response.data));
  } catch (error) {
    throw error;
  }
};

export const deleteGoodsTransactionDetail = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${detailBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete goods transaction item');
  }
};
