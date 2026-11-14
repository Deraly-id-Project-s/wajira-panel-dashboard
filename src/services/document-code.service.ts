import type { DocumentCode, DocumentCodeUpdatePayload } from '@/@types/document-archive.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/other/document-code';

export const mapDocumentCode = (item: any): DocumentCode => ({
  id: item.id,
  name: item.name ?? '',
  code: item.code ?? '',
  type: item.type ?? 'other',
  description: item.description ?? null,
  createdAt: item.created_at ?? item.createdAt,
  updatedAt: item.updated_at ?? item.updatedAt,
});

export const getDocumentCodes = async (params?: PaginationParams) => {
  const query = params ? buildLaravelPaginationQuery(params) : {};
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, { params: query });
  const data = ensureSuccess(response.data);
  const pagination = data?.data && typeof data.current_page !== 'undefined' ? data : { ...data, data: Array.isArray(data) ? data : data?.data ?? [] };
  return toPaginatedResult(pagination, mapDocumentCode);
};

export const updateDocumentCode = async (id: number | string, payload: DocumentCodeUpdatePayload): Promise<DocumentCode> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, payload);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Gagal memperbarui kode dokumen');
  }
  return mapDocumentCode(response.data.data);
};
