import type { Asset, AssetListResponse, AssetPayload } from '@/types/asset.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/master-data/asset';

export const getAssets = async (params: PaginationParams & { search?: string; company_id?: string | number }): Promise<AssetListResponse> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
        params: {
            ...buildLaravelPaginationQuery(params),
            company_id: params.company_id,
        },
    });

    const data = ensureSuccess(response.data);

    return toPaginatedResult(
        {
            data: data.data ?? [],
            current_page: data.current_page,
            per_page: data.per_page,
            total: data.total,
            last_page: data.last_page,
        },
        (item: any) => ({
            ...item,
            price: Number(item.price) || 0,
        }),
    );
};

export const getAssetById = async (id: string | number): Promise<Asset> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    
    return {
        ...data,
        price: Number(data.price) || 0,
    };
};

export const createAsset = async (data: Partial<AssetPayload>): Promise<void> => {
    const formData = new FormData();
    if (data.company_id) formData.append('company_id', String(data.company_id));
    if (data.name) formData.append('name', data.name);
    if (data.code) formData.append('code', data.code);
    if (data.purchase_date) formData.append('purchase_date', data.purchase_date);
    if (data.type) formData.append('type', data.type);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.serial_number !== undefined) formData.append('serial_number', data.serial_number ?? '');

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to create asset');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateAsset = async (id: string | number, data: Partial<AssetPayload>): Promise<void> => {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Spoofing PUT for safe Form-Data handling in laravel
    if (data.company_id) formData.append('company_id', String(data.company_id));
    if (data.name) formData.append('name', data.name);
    if (data.code) formData.append('code', data.code);
    if (data.purchase_date) formData.append('purchase_date', data.purchase_date);
    if (data.type) formData.append('type', data.type);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.serial_number !== undefined) formData.append('serial_number', data.serial_number ?? '');

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to update asset');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteAsset = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to delete asset');
    }
};

export const importAsset = async (file: File, companyId?: string | number): Promise<void> => {
    const body = new FormData();
    body.append('file', file);

    const url = companyId ? `${basePath}/${companyId}/import` : `${basePath}/import`;

    const response = await apiClient.post(url, body, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const payload = response.data as LaravelApiResponse<null>;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to import asset');
    }
};

export const exportAsset = async (companyId?: string | number): Promise<void> => {
    const response = await apiClient.get(`${basePath}/export`, {
        params: companyId ? { company_id: companyId } : undefined,
        responseType: 'blob',
    });

    const contentType = response.headers['content-type'];
    const isJson = typeof contentType === 'string' && contentType.includes('application/json');

    if (isJson) {
        const textData = await (response.data as Blob).text();
        const jsonResponse = JSON.parse(textData);
        throw new ApiResponseError(jsonResponse.message ?? 'Failed to export data');
    }

    const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().getTime();
    link.setAttribute('download', `Asset_${timestamp}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
