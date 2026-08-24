import type { DocumentTemplate, DocumentTemplateListParams, DocumentTemplateListResponse, DocumentTemplatePayload } from '@/@types/document-template.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/other/document-template';

const mapDocumentTemplate = (item: any): DocumentTemplate => ({
  id: item.id ?? item.uuid,
  uuid: item.uuid,
  name: item.name ?? '',
  language: item.language ?? 'id',
  subject: item.subject ?? '',
  footerInformation: item.footer_information ?? item.footerInformation ?? '',
  personSignature: item.person_signature ?? item.personSignature ?? null,
  personSigner: item.person_signer ?? item.personSigner ?? '',
  documentTemplate: item.document_template ?? item.documentTemplate ?? null,
  createdAt: item.created_at ?? item.createdAt,
  updatedAt: item.updated_at ?? item.updatedAt,
});

export const getDocumentTemplates = async (params: DocumentTemplateListParams): Promise<DocumentTemplateListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: buildLaravelPaginationQuery(params),
  });
  const data = ensureSuccess(response.data);
  const pagination = data?.data ? data : { ...data, data: data ?? [] };
  return toPaginatedResult(pagination, mapDocumentTemplate);
};

export const getDocumentTemplateById = async (id: string | number): Promise<DocumentTemplate> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  return mapDocumentTemplate(ensureSuccess(response.data));
};

const toFormData = (payload: DocumentTemplatePayload, method?: 'PUT') => {
  const body = new FormData();
  if (method) body.append('_method', method);
  body.append('name', payload.name);
  body.append('language', payload.language);
  body.append('subject', payload.subject);
  body.append('footer_information', payload.footerInformation);
  if (payload.personSignature) body.append('person_signature', payload.personSignature);
  body.append('person_signer', payload.personSigner);
  if (payload.documentTemplate) body.append('document_template', payload.documentTemplate);
  return body;
};

const assertSuccess = (payload: LaravelApiResponse<any>, fallback: string) => {
  if (!payload.status) throw new ApiResponseError(payload.message ?? fallback);
  return payload.data;
};

export const createDocumentTemplate = async (payload: DocumentTemplatePayload) => {
  const response = await apiClient.post<LaravelApiResponse<any>>(basePath, toFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapDocumentTemplate(assertSuccess(response.data, 'Gagal menambahkan dokumen template'));
};

export const updateDocumentTemplate = async (id: string | number, payload: DocumentTemplatePayload) => {
  const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}`, toFormData(payload, 'PUT'), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapDocumentTemplate(assertSuccess(response.data, 'Gagal mengubah dokumen template'));
};

export const deleteDocumentTemplate = async (id: string | number) => {
  const response = await apiClient.delete<LaravelApiResponse<any>>(`${basePath}/${id}`);
  assertSuccess(response.data, 'Gagal menghapus dokumen template');
};
