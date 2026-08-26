import type { Vendor, VendorListResponse, VendorPayload } from '@/types/vendor.types';
import type { PaginationParams } from '@/types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/master-data/vendor';

export const getVendors = async (params: PaginationParams & { search?: string; company_id?: string | number }): Promise<VendorListResponse> => {
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
            picName: item.pic_name || '',
            code: item.code || '',
            type: item.type || '',
            name: item.name || '',
            address: item.address || '',
            npwp: item.npwp || '',
            phone: item.phone || '',
            identityNumber: item.identity_number,
            driveLicenseIdentityNumber: item.drive_license_identity_number,
            image: item.image,
            mapLink: item.map_link,
            socialMedia1Link: item.social_media_1_link,
            socialMedia2Link: item.social_media_2_link,
            socialMedia3Link: item.social_media_3_link,
            socialMedia4Link: item.social_media_4_link,
            websiteLink: item.website_link,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        }),
    );
};

export const getVendorById = async (id: string | number): Promise<Vendor> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    
    return {
        id: data.id,
        uuid: data.uuid,
        picName: data.pic_name || '',
        code: data.code || '',
        type: data.type || '',
        name: data.name || '',
        address: data.address || '',
        npwp: data.npwp || '',
        phone: data.phone || '',
        identityNumber: data.identity_number,
        driveLicenseIdentityNumber: data.drive_license_identity_number,
        image: data.image,
        mapLink: data.map_link,
        socialMedia1Link: data.social_media_1_link,
        socialMedia2Link: data.social_media_2_link,
        socialMedia3Link: data.social_media_3_link,
        socialMedia4Link: data.social_media_4_link,
        websiteLink: data.website_link,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
};

export const createVendor = async (data: Partial<VendorPayload>): Promise<void> => {
    const formData = new FormData();
    if (data.companyId) formData.append('company_id', String(data.companyId));
    if (data.name) formData.append('name', data.name);
    if (data.address) formData.append('address', data.address);
    if (data.phone) formData.append('phone', data.phone);
    if (data.npwp) formData.append('npwp', data.npwp); // Backend will ignore if empty string because it expects 15 char if present, but since we provide form-data, we shouldn't append if it's undefined
    if (data.picName) formData.append('pic_name', data.picName);

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to create vendor');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateVendor = async (id: string | number, data: Partial<VendorPayload>): Promise<void> => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (data.companyId) formData.append('company_id', String(data.companyId));
    if (data.name) formData.append('name', data.name);
    if (data.address) formData.append('address', data.address);
    if (data.phone) formData.append('phone', data.phone);
    if (data.npwp) formData.append('npwp', data.npwp);
    if (data.picName) formData.append('pic_name', data.picName);

    try {
        const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const payload = response.data;
        if (!payload.status) {
            throw new ApiResponseError(payload.message ?? 'Failed to update vendor');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteVendor = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to delete vendor');
    }
};

export const importVendor = async (companyId: string | number, file: File): Promise<void> => {
    const body = new FormData();
    body.append('file', file);

    const response = await apiClient.post(`${basePath}/${companyId}/import`, body, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const payload = response.data as LaravelApiResponse<null>;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to import vendor');
    }
};

export const exportVendor = async (companyId: string | number): Promise<void> => {
    const response = await apiClient.get(`${basePath}/export`, {
        params: { company_id: companyId },
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
    link.setAttribute('download', `Vendor_${timestamp}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
