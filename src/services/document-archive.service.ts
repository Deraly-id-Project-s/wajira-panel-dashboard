import type {
  CreateDocumentArchivePayload,
  DocumentArchive,
  DocumentArchiveListParams,
  DocumentArchiveListResponse,
  DocumentArchiveType,
  LatestDocumentNumberResponse,
  UpdateDocumentArchivePayload,
} from '@/@types/document-archive.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/other/document-archive';

export const mapDocumentArchive = (item: any): DocumentArchive => ({
  id: item.id,
  uuid: item.uuid ?? '',
  previousDocumentId: item.previous_document_id ?? item.previousDocumentId ?? null,
  documentNumber: item.document_number ?? item.documentNumber ?? 0,
  documentCode: item.document_code ?? item.documentCode ?? '',
  isLatest: Boolean(item.is_latest ?? item.isLatest ?? true),
  type: item.type ?? 'report',
  name: item.name ?? '',
  format: item.format ?? '',
  file: item.file ?? '',
  fileUrl: item.file_url ?? item.fileUrl ?? null,
  isActive: typeof item.is_active !== 'undefined' ? Boolean(item.is_active) : true,
  isExpired: Boolean(item.is_expired ?? item.isExpired ?? false),
  expiredAt: item.expired_at ?? item.expiredAt ?? null,
  notes: item.notes ?? null,
  createdAt: item.created_at ?? item.createdAt,
  updatedAt: item.updated_at ?? item.updatedAt,
  previousDocument: item.previous_document ? mapDocumentArchive(item.previous_document) : null,
  revisions: Array.isArray(item.revisions) ? item.revisions.map(mapDocumentArchive) : [],
});

export const getDocumentArchives = async (params: DocumentArchiveListParams): Promise<DocumentArchiveListResponse> => {
  const query: Record<string, any> = {
    ...buildLaravelPaginationQuery(params),
    type: params.type || undefined,
    format: params.format || undefined,
    is_latest: typeof params.is_latest !== 'undefined' ? params.is_latest : undefined,
    is_active: typeof params.is_active !== 'undefined' ? params.is_active : undefined,
    is_expired: typeof params.is_expired !== 'undefined' ? params.is_expired : undefined,
    previous_document_id: params.previous_document_id || undefined,
  };

  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, { params: query });
  const data = ensureSuccess(response.data);
  const pagination = data?.data ? data : { ...data, data: data ?? [] };
  return toPaginatedResult(pagination, mapDocumentArchive);
};

export const getDocumentArchiveById = async (id: number | string): Promise<DocumentArchive> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  return mapDocumentArchive(ensureSuccess(response.data));
};

export const getLatestDocumentNumber = async (type: DocumentArchiveType): Promise<LatestDocumentNumberResponse> => {
  const response = await apiClient.get<LaravelApiResponse<LatestDocumentNumberResponse>>(`${basePath}/latest-number`, {
    params: { type },
  });
  return ensureSuccess(response.data);
};

export const uploadArchiveFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<LaravelApiResponse<{ file: string; file_url: string; format: string }>>(
    `${basePath}/store-file`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return ensureSuccess(response.data);
};

export const createDocumentArchive = async (payload: CreateDocumentArchivePayload): Promise<DocumentArchive> => {
  if (payload.file instanceof File) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('type', payload.type);
    formData.append('file', payload.file);
    if (payload.document_code) formData.append('document_code', payload.document_code);
    if (payload.document_number) formData.append('document_number', String(payload.document_number));
    if (payload.previous_document_id) formData.append('previous_document_id', String(payload.previous_document_id));
    if (typeof payload.is_latest !== 'undefined') formData.append('is_latest', payload.is_latest ? '1' : '0');
    if (typeof payload.is_active !== 'undefined') formData.append('is_active', payload.is_active ? '1' : '0');
    if (payload.expired_at) formData.append('expired_at', payload.expired_at);
    if (payload.notes) formData.append('notes', payload.notes);

    const response = await apiClient.post<LaravelApiResponse<any>>(basePath, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapDocumentArchive(ensureSuccess(response.data));
  }

  // JSON payload if file is already uploaded string path
  const body: Record<string, any> = {
    name: payload.name,
    type: payload.type,
    file: payload.file,
    ...(payload.document_code ? { document_code: payload.document_code } : {}),
    ...(payload.document_number ? { document_number: payload.document_number } : {}),
    ...(payload.previous_document_id ? { previous_document_id: payload.previous_document_id } : {}),
    ...(typeof payload.is_latest !== 'undefined' ? { is_latest: payload.is_latest } : {}),
    ...(typeof payload.is_active !== 'undefined' ? { is_active: payload.is_active } : {}),
    ...(payload.expired_at ? { expired_at: payload.expired_at } : {}),
    ...(payload.notes ? { notes: payload.notes } : {}),
  };

  const response = await apiClient.post<LaravelApiResponse<any>>(basePath, body);
  return mapDocumentArchive(ensureSuccess(response.data));
};

export const updateDocumentArchive = async (
  id: number | string,
  payload: UpdateDocumentArchivePayload
): Promise<DocumentArchive> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, payload);
  return mapDocumentArchive(ensureSuccess(response.data));
};

export const updateArchiveFile = async (id: number | string, file: File): Promise<DocumentArchive> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}/update-file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapDocumentArchive(ensureSuccess(response.data));
};

export const deleteDocumentArchive = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Gagal menghapus arsip dokumen');
  }
};
