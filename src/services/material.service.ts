import type { Material, MaterialListResponse, MaterialPayload } from '@/types/material.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/master-data/material';

export const getMaterials = async (params: PaginationParams & { search?: string; has_transaction?: boolean; sort_order?: 'asc' | 'desc' }): Promise<MaterialListResponse> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
        params: {
            ...buildLaravelPaginationQuery(params),
            has_transaction: params.has_transaction,
            sort_order: params.sort_order,
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
            id: item.id,
            uuid: item.uuid,
            code: item.code || '',
            name: item.name || '',
            price: Number(item.price) || 0,
            type: item.type || '',
            averagePrice: Number(item.average_price) || 0,
            stock: Number(item.stock) || 0,
            totalPurchased: Number(item.total_purchased) || 0,
            totalSold: Number(item.total_sold) || 0,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        }),
    );
};

export const getMaterialById = async (id: string | number): Promise<Material> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    
    return {
        id: data.id,
        uuid: data.uuid,
        code: data.code || '',
        name: data.name || '',
        price: Number(data.price) || 0,
        type: data.type || '',
        averagePrice: Number(data.average_price) || 0,
        stock: Number(data.stock) || 0,
        totalPurchased: Number(data.total_purchased) || 0,
        totalSold: Number(data.total_sold) || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
};

export const createMaterial = async (data: Partial<MaterialPayload>): Promise<void> => {
    const formData = new FormData();
    if (data.code) formData.append('code', data.code);
    if (data.name) formData.append('name', data.name);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.type) formData.append('type', data.type);

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to create material');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateMaterial = async (id: string | number, data: Partial<MaterialPayload>): Promise<void> => {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Spoofing PUT for safe Form-Data handling in laravel
    if (data.code) formData.append('code', data.code);
    if (data.name) formData.append('name', data.name);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.type) formData.append('type', data.type);

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to update material');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteMaterial = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to delete material');
    }
};

export const importMaterial = async (file: File): Promise<void> => {
    const body = new FormData();
    body.append('file', file);

    const response = await apiClient.post(`${basePath}/import`, body, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const payload = response.data as LaravelApiResponse<null>;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to import material');
    }
};

export const exportMaterial = async (): Promise<void> => {
    const response = await apiClient.get(`${basePath}/export`, {
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
    link.setAttribute('download', `Material_${timestamp}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
