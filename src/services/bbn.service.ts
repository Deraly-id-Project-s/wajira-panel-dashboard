import type { BBN, BBNListResponse, BBNPayload } from '@/types/bbn.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, ApiValidationError } from '@/lib/api/response';


const basePath = '/wapi/master-data/bbn';

// ─── Internal: fetch full list (no pagination/search params) ───────────────────
const getAllBBNsRaw = async (): Promise<any[]> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath);
    const raw = response.data;
    if (!raw.status) {
        throw new ApiResponseError(raw.message ?? 'Failed to fetch BBN list');
    }
    // API may return a flat array or a paginated object
    const payload = raw.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
};

const mapBBNItem = (item: any): BBN => ({
    id: item.id,
    uuid: item.uuid,
    dealerId: item.dealer_id,
    regionId: item.region_id,
    tnbkCode: item.tnbk_code || '',
    vehicleType: item.vehicle_type || '',
    unNoticeFee: Number(item.un_notice_fee) || 0,
    garwilFee: Number(item.garwil_fee) || 0,
    countershopFee: Number(item.countershop_fee) || 0,
    otherFee: Number(item.other_fee) || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    region: item.region ? {
        id: item.region.id,
        uuid: item.region.uuid,
        code: item.region.code,
        name: item.region.name,
    } : undefined,
    dealer: item.dealer ? {
        id: item.dealer.id,
        uuid: item.dealer.uuid,
        code: item.dealer.code,
        namaDealer: item.dealer.name,
    } : undefined,
});

export const getBBNs = async (params: PaginationParams & { search?: string }): Promise<BBNListResponse> => {
    const allRaw = await getAllBBNsRaw();
    const allItems: BBN[] = allRaw.map(mapBBNItem);

    // ── Client-side search across multiple fields ─────────────────────────────
    const keyword = (params.search ?? '').toLowerCase().trim();
    const filtered = keyword
        ? allItems.filter((item) => {
              const dealerName = (item.dealer?.namaDealer ?? '').toLowerCase();
              const regionName = (item.region?.name ?? '').toLowerCase();
              const tnbkCode   = item.tnbkCode.toLowerCase();
              const vType      = item.vehicleType.toLowerCase();
              const regionCode = (item.region?.code ?? '').toLowerCase();
              return (
                  dealerName.includes(keyword) ||
                  regionName.includes(keyword) ||
                  tnbkCode.includes(keyword) ||
                  vType.includes(keyword) ||
                  regionCode.includes(keyword)
              );
          })
        : allItems;

    // ── Client-side pagination ────────────────────────────────────────────────
    const page    = params.page    ?? 1;
    const perPage = params.perPage ?? 10;
    const total   = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start   = (page - 1) * perPage;
    const paged   = filtered.slice(start, start + perPage);

    return {
        data: paged,
        meta: { currentPage: page, perPage, total, lastPage },
    };
};



export const getBBNById = async (id: string | number): Promise<BBN> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    
    return {
        id: data.id,
        uuid: data.uuid,
        dealerId: data.dealer_id,
        regionId: data.region_id,
        tnbkCode: data.tnbk_code || '',
        vehicleType: data.vehicle_type || '',
        unNoticeFee: Number(data.un_notice_fee) || 0,
        garwilFee: Number(data.garwil_fee) || 0,
        countershopFee: Number(data.countershop_fee) || 0,
        otherFee: Number(data.other_fee) || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        region: data.region ? {
            id: data.region.id,
            uuid: data.region.uuid,
            code: data.region.code,
            name: data.region.name,
        } : undefined,
        dealer: data.dealer ? {
            id: data.dealer.id,
            uuid: data.dealer.uuid,
            code: data.dealer.code,
            namaDealer: data.dealer.name,
        } : undefined,
    };
};

const buildPayload = (data: Partial<BBNPayload>, opts?: { asUpdate?: boolean }) => {
    const formData = new FormData();
    if (opts?.asUpdate) formData.append('_method', 'PUT');
    
    if (data.dealerId) formData.append('dealer_id', String(data.dealerId));
    if (data.regionId) formData.append('region_id', String(data.regionId));
    if (data.tnbkCode) formData.append('tnbk_code', data.tnbkCode);
    if (data.vehicleType) formData.append('vehicle_type', data.vehicleType);
    
    if (data.unNoticeFee !== undefined) formData.append('un_notice_fee', String(data.unNoticeFee));
    if (data.garwilFee !== undefined) formData.append('garwil_fee', String(data.garwilFee));
    if (data.countershopFee !== undefined) formData.append('countershop_fee', String(data.countershopFee));
    if (data.otherFee !== undefined) formData.append('other_fee', String(data.otherFee));
    
    return formData;
};

export const createBBN = async (data: Partial<BBNPayload>): Promise<void> => {
    const formData = buildPayload(data);

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to create bbn');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateBBN = async (id: string | number, data: Partial<BBNPayload>): Promise<void> => {
    const formData = buildPayload(data, { asUpdate: true });

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to update bbn');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteBBN = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to delete bbn');
    }
};

export const importBBN = async (file: File): Promise<void> => {
    const body = new FormData();
    body.append('file', file);

    const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/import`, body, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    if (!response.data.status) {
        throw new ApiResponseError(response.data.message ?? 'Failed to import bbn');
    }
};

export const exportBBN = async (): Promise<void> => {
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
    link.setAttribute('download', `BBN_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
