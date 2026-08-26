import type { Dealer, DealerListResponse } from '@/types/dealer.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/master-data/dealer';

export const getDealers = async (params: PaginationParams & { search?: string; company_id?: string | number }): Promise<DealerListResponse> => {
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
            id: item.id,
            uuid: item.uuid,
            code: item.code,
            namaDealer: item.nama_dealer || item.name || '',
            alamat: item.alamat || item.address || '',
            pic: item.pic || item.pic_name || '',
            handphone: item.handphone || item.phone || '',
            companyId: item.company_id,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        }),
    );
};

export const getDealerById = async (id: string | number): Promise<Dealer> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    
    return {
        id: data.id,
        uuid: data.uuid,
        code: data.code,
        namaDealer: data.name || data.nama_dealer || '',
        alamat: data.address || data.alamat || '',
        pic: data.pic_name || data.pic || '',
        handphone: data.phone || data.handphone || '',
        companyId: data.company_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
};

export const importDealer = async (file: File, companyId?: string | number): Promise<void> => {
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
        throw new ApiResponseError(payload.message ?? 'Failed to import dealer');
    }
};

const buildPayload = (data: Partial<import('@/types/dealer.types').DealerPayload>, opts?: { asUpdate?: boolean }) => {
    const formData = new FormData();
    if (opts?.asUpdate) formData.append('_method', 'PUT');
    
    formData.append('name', data.namaDealer || '');
    if (data.alamat) formData.append('address', data.alamat);
    if (data.handphone) formData.append('phone', data.handphone);
    if (data.userId) formData.append('user_id', String(data.userId));
    if (data.companyId) formData.append('company_id', String(data.companyId));
    if (data.pic) formData.append('pic_name', data.pic);
    
    // Jangan pernah append parameter dengan blank string sembarangan 
    // karena Laravel Validation bisa nge-reject itu kalau formatnya ketat (misal "The npwp format is invalid")
    if (data.code) formData.append('code', data.code);
    
    return formData;
};

export const createDealer = async (data: Partial<import('@/types/dealer.types').DealerPayload>): Promise<void> => {
    const formData = buildPayload(data);

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to create dealer');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateDealer = async (id: string | number, data: Partial<import('@/types/dealer.types').DealerPayload>): Promise<void> => {
    const formData = buildPayload(data, { asUpdate: true });

    try {
        // Karena ada spoofing _method="PUT", request tetap dikirim sebagai POST
        // Ini adalah cara paling natural dan anti-error untuk framework Laravel
        const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to update dealer');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteDealer = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to delete dealer');
    }
};

export const exportDealer = async (companyId?: string | number): Promise<void> => {
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
    link.setAttribute('download', `Dealers_${timestamp}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
