import type { Tarif, TarifListResponse, TarifPayload } from '@/@types/tarif.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/master-data/tarif';

const mapTarifItem = (item: any): Tarif => ({
    id: item.id,
    uuid: item.uuid,
    loadingIn: item.loading_in || '',
    loadingOut: item.loading_out || '',
    distance: Number(item.distance) || 0,
    ujTowing: item.uj_towing !== null && item.uj_towing !== undefined ? Number(item.uj_towing) : null,
    ujCdd: item.uj_cdd !== null && item.uj_cdd !== undefined ? Number(item.uj_cdd) : null,
    ujFuso: item.uj_fuso !== null && item.uj_fuso !== undefined ? Number(item.uj_fuso) : null,
    invTowing: item.inv_towing !== null && item.inv_towing !== undefined ? Number(item.inv_towing) : null,
    invCdd: item.inv_cdd !== null && item.inv_cdd !== undefined ? Number(item.inv_cdd) : null,
    invFuso: item.inv_fuso !== null && item.inv_fuso !== undefined ? Number(item.inv_fuso) : null,
    isActive: item.is_active === 1 || item.is_active === true || String(item.is_active) === '1',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
});

export const getTarifs = async (
    params: PaginationParams & { search?: string; company_id?: string | number },
): Promise<TarifListResponse> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
        params: {
            ...buildLaravelPaginationQuery(params),
            company_id: params.company_id,
        },
    });
    const data = ensureSuccess(response.data);
    return toPaginatedResult(data, mapTarifItem);
};

export const getTarifById = async (id: string | number): Promise<Tarif> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    return mapTarifItem(data);
};

const serializePayload = (data: TarifPayload): URLSearchParams => {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
            params.append(key, String(val));
        }
    });
    return params;
};

export const createTarif = async (data: TarifPayload): Promise<void> => {
    try {
        const payload = serializePayload(data);
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, payload, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const result = response.data;
        if (!result.status) {
            throw new ApiResponseError(result.message ?? 'Failed to create tarif');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateTarif = async (id: string | number, data: TarifPayload): Promise<void> => {
    try {
        const payload = serializePayload(data);
        const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, payload, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const result = response.data;
        if (!result.status) {
            throw new ApiResponseError(result.message ?? 'Failed to update tarif');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteTarif = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to delete tarif');
    }
};
