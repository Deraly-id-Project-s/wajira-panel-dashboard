import type { FinanceAsset, FinanceAssetListResponse, FinanceAssetPayload, FinanceAssetFormulaParams, FinanceAssetFormulaResult } from '@/@types/finance-asset.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, LaravelApiResponse, ensureSuccess, toPaginatedResult, ApiValidationError } from '@/lib/api/response';

const basePath = '/wapi/finance/finance-asset';

export const getFinanceAssets = async (params: PaginationParams & { search?: string; company_id?: string | number; start_date?: string; end_date?: string }): Promise<FinanceAssetListResponse> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
        params: {
            ...buildLaravelPaginationQuery(params),
            company_id: params.company_id,
            start_date: params.start_date || undefined,
            end_date: params.end_date || undefined,
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
            code: item.asset?.code || item.code || '',
            purchase_date: item.purchase_date || item.asset?.purchase_date || '',
            name: item.asset?.name || item.name || '',
            type: item.asset?.type || item.type || '',
            price: Number(item.price ?? item.asset?.price) || 0,
            serial_number: item.serial_number || item.asset?.serial_number || '',
            economic_age: Number(item.economic_age) || 0,
            age: Number(item.age) || (Number(item.economic_age) ? Number(item.economic_age) * 12 : 0),
            depreciation: Number(item.depreciation) || 0,
            monthly_depreciation: Number(item.monthly_depreciation ?? item.depreciation_per_month ?? item.depreciation) || 0,
            depreciation_per_month: Number(item.depreciation_per_month ?? item.monthly_depreciation ?? item.depreciation) || 0,
            months_used: Number(item.months_used) || 0,
            accumulated_depreciation: Number(item.accumulated_depreciation) || 0,
            book_value: Number(item.book_value) || 0,
            status: item.status || 'AKTIF',
            final_value: Number(item.final_value ?? item.book_value ?? item.nilai_akhir) || 0,
            residual_value: Number(item.residual_value) || 0,
        }),
    );
};

export const getFinanceAssetById = async (id: string | number): Promise<FinanceAsset> => {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
    const data = ensureSuccess(response.data);
    
    return {
        ...data,
        code: data.asset?.code || data.code || '',
        purchase_date: data.purchase_date || data.asset?.purchase_date || '',
        name: data.asset?.name || data.name || '',
        type: data.asset?.type || data.type || '',
        price: Number(data.price ?? data.asset?.price) || 0,
        serial_number: data.serial_number || data.asset?.serial_number || '',
        economic_age: Number(data.economic_age) || 0,
        age: Number(data.age) || (Number(data.economic_age) ? Number(data.economic_age) * 12 : 0),
        depreciation: Number(data.depreciation) || 0,
        monthly_depreciation: Number(data.monthly_depreciation ?? data.depreciation_per_month ?? data.depreciation) || 0,
        depreciation_per_month: Number(data.depreciation_per_month ?? data.monthly_depreciation ?? data.depreciation) || 0,
        months_used: Number(data.months_used) || 0,
        accumulated_depreciation: Number(data.accumulated_depreciation) || 0,
        book_value: Number(data.book_value) || 0,
        status: data.status || 'AKTIF',
        final_value: Number(data.final_value ?? data.book_value ?? data.nilai_akhir) || 0,
        residual_value: Number(data.residual_value) || 0,
    };
};

export const getFinanceAssetFormula = async (
    params: FinanceAssetFormulaParams
): Promise<FinanceAssetFormulaResult> => {
    try {
        const response = await apiClient.get<LaravelApiResponse<FinanceAssetFormulaResult>>(
            '/wapi/finance/fiance-asset/get-formula',
            { params }
        );
        return ensureSuccess(response.data);
    } catch (err: any) {
        if (err?.response?.status === 404) {
            const fallbackResponse = await apiClient.get<LaravelApiResponse<FinanceAssetFormulaResult>>(
                '/wapi/finance/finance-asset/get-formula',
                { params }
            );
            return ensureSuccess(fallbackResponse.data);
        }
        throw err;
    }
};

export const createFinanceAsset = async (data: FinanceAssetPayload): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('asset_id', String(data.asset_id));
        formData.append('price', String(data.price));
        formData.append('purchase_date', data.purchase_date);
        formData.append('economic_age', String(data.economic_age));
        if (data.description !== undefined && data.description !== null) {
            formData.append('description', data.description);
        }
        if (data.serial_number !== undefined && data.serial_number !== null) {
            formData.append('serial_number', data.serial_number);
        }
        if (data.depreciation !== undefined && data.depreciation !== null) {
            formData.append('depreciation', String(data.depreciation));
        }
        if (data.final_value !== undefined && data.final_value !== null) {
            formData.append('final_value', String(data.final_value));
        }

        const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const result = response.data;
        if (!result.status) {
            throw new ApiResponseError(result.message ?? 'Failed to create finance asset');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const updateFinanceAsset = async (id: string | number, data: Partial<FinanceAssetPayload>): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('_method', 'PUT'); // Emulate PUT request with FormData
        if (data.asset_id !== undefined && data.asset_id !== null) {
            formData.append('asset_id', String(data.asset_id));
        }
        if (data.price !== undefined && data.price !== null) {
            formData.append('price', String(data.price));
        }
        if (data.purchase_date !== undefined && data.purchase_date !== null) {
            formData.append('purchase_date', data.purchase_date);
        }
        if (data.economic_age !== undefined && data.economic_age !== null) {
            formData.append('economic_age', String(data.economic_age));
        }
        if (data.depreciation !== undefined && data.depreciation !== null) {
            formData.append('depreciation', String(data.depreciation));
        }
        if (data.final_value !== undefined && data.final_value !== null) {
            formData.append('final_value', String(data.final_value));
        }
        if (data.description !== undefined && data.description !== null) {
            formData.append('description', data.description);
        }
        if (data.serial_number !== undefined && data.serial_number !== null) {
            formData.append('serial_number', data.serial_number);
        }

        const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const result = response.data;
        if (!result.status) {
            throw new ApiResponseError(result.message ?? 'Failed to update finance asset');
        }
    } catch (error) {
        if (error instanceof ApiValidationError) throw error;
        throw error;
    }
};

export const deleteFinanceAsset = async (id: string | number): Promise<void> => {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
    
    const payload = response.data;
    if (!payload.status) {
        throw new ApiResponseError(payload.message ?? 'Failed to delete finance asset');
    }
};

export const exportFinanceAsset = async (): Promise<void> => {
    // User specified this exact URL for export
    const response = await apiClient.get(`/wapi/master-data/asset/export`, {
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
    link.setAttribute('download', `Finance_Asset_${timestamp}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
