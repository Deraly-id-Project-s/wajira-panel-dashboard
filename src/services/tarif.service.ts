import type { Tarif, TarifListResponse, TarifPayload } from '@/@types/tarif.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';
import { mapRouteItem } from './route.service';

const basePath = '/wapi/master-data/tarif';

export const mapTarifItem = (item: any): Tarif => {
    // If backend returns routes array, derive loadingIn and loadingOut from routes if not provided directly
    const routes = Array.isArray(item.routes) ? item.routes.map(mapRouteItem) : [];
    
    // Sort routes by pivot.order if available
    const sortedRoutes = [...routes].sort((a, b) => {
        const orderA = a.pivot?.order ?? 0;
        const orderB = b.pivot?.order ?? 0;
        return orderA - orderB;
    });

    let loadingIn = item.loading_in || '';
    let loadingOut = item.loading_out || '';

    if (!loadingIn && sortedRoutes.length > 0) {
        const inRoute = sortedRoutes.find((r) => r.pivot?.state_at === 'loading_in') || sortedRoutes[0];
        loadingIn = inRoute?.name || '';
    }

    if (!loadingOut && sortedRoutes.length > 1) {
        const outRoute = sortedRoutes.find((r) => r.pivot?.state_at === 'loading_out') || sortedRoutes[sortedRoutes.length - 1];
        loadingOut = outRoute?.name || '';
    } else if (!loadingOut && sortedRoutes.length === 1 && sortedRoutes[0]?.name !== loadingIn) {
        loadingOut = sortedRoutes[0]?.name || '';
    }

    const priceVersions = Array.isArray(item.tarif_price_versions)
        ? item.tarif_price_versions.map((pv: any) => ({
              id: pv.id,
              uuid: pv.uuid,
              tarif_id: pv.tarif_id,
              tarifId: pv.tarif_id,
              name: pv.name,
              uj_towing: Number(pv.uj_towing) || 0,
              ujTowing: Number(pv.uj_towing) || 0,
              uj_cdd: Number(pv.uj_cdd) || 0,
              ujCdd: Number(pv.uj_cdd) || 0,
              uj_fuso: Number(pv.uj_fuso) || 0,
              ujFuso: Number(pv.uj_fuso) || 0,
              effective_from: pv.effective_from,
              effectiveFrom: pv.effective_from,
              effective_until: pv.effective_until,
              effectiveUntil: pv.effective_until,
              is_default: Boolean(pv.is_default),
              isDefault: Boolean(pv.is_default),
              is_lock: Boolean(pv.is_lock),
              isLock: Boolean(pv.is_lock),
              created_at: pv.created_at,
              createdAt: pv.created_at,
              updated_at: pv.updated_at,
              updatedAt: pv.updated_at,
          }))
        : [];

    return {
        id: item.id,
        uuid: item.uuid,
        loadingIn,
        loadingOut,
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
        routes: sortedRoutes,
        tarifPriceVersions: priceVersions,
    };
};

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

export const createTarif = async (data: TarifPayload): Promise<Tarif> => {
    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, data);
        const dataRes = ensureSuccess(response.data);
        return dataRes ? mapTarifItem(dataRes) : ({} as Tarif);
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateTarif = async (id: string | number, data: TarifPayload): Promise<void> => {
    try {
        const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, data);
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
