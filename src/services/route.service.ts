import type { RouteModel, RouteListResponse, CreateRoutePayload, UpdateRoutePayload } from '@/@types/route.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/master-data/route';

export const mapRouteItem = (item: any): RouteModel => ({
    id: item.id,
    uuid: item.uuid,
    name: item.name || '',
    address: item.address || null,
    link: item.link || null,
    other_information: item.other_information || null,
    otherInformation: item.other_information || null,
    description: item.description || null,
    created_at: item.created_at,
    createdAt: item.created_at,
    updated_at: item.updated_at,
    updatedAt: item.updated_at,
    pivot: item.pivot
        ? {
            id: item.pivot.id,
            tarif_id: item.pivot.tarif_id,
            tarifId: item.pivot.tarif_id,
            route_id: item.pivot.route_id,
            routeId: item.pivot.route_id,
            order: item.pivot.order,
            state_at: item.pivot.state_at,
            stateAt: item.pivot.state_at,
            created_at: item.pivot.created_at,
            updated_at: item.pivot.updated_at,
        }
        : undefined,
});

export const getRoutes = async (
    params: PaginationParams & { search?: string; company_id?: string | number },
): Promise<RouteListResponse> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
        params: {
            ...buildLaravelPaginationQuery(params),
            company_id: params.company_id,
        },
    });
    const data = ensureSuccess(response.data);
    return toPaginatedResult(data, mapRouteItem);
};

export const getAllRouteOptions = async (): Promise<RouteModel[]> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
        params: {
            per_page: -1,
        },
    });
    const data = ensureSuccess(response.data);
    const list = Array.isArray(data) ? data : data?.data || [];
    return list.map(mapRouteItem);
};

export const getRouteById = async (id: string | number): Promise<RouteModel> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    return mapRouteItem(data);
};

export const createRoute = async (data: CreateRoutePayload): Promise<RouteModel> => {
    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, data);
        const dataRes = ensureSuccess(response.data);
        return dataRes ? mapRouteItem(dataRes) : ({} as RouteModel);
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateRoute = async (id: string | number, data: UpdateRoutePayload): Promise<RouteModel> => {
    try {
        const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, data);
        const dataRes = ensureSuccess(response.data);
        return dataRes ? mapRouteItem(dataRes) : ({} as RouteModel);
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteRoute = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Gagal menghapus rute');
    }
};
