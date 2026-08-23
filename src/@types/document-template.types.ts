import type { PaginatedResult, PaginationParams } from './pagination.types';

export interface DocumentTemplate {
  id: string | number;
  uuid?: string;
  name: string;
  language: string;
  subject: string;
  footerInformation: string;
  personSigner: string;
  documentTemplate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentTemplatePayload {
  name: string;
  language: string;
  subject: string;
  footerInformation: string;
  personSigner: string;
  documentTemplate?: File | null;
}

export interface DocumentTemplateListParams extends PaginationParams {
  search?: string;
}

export type DocumentTemplateListResponse = PaginatedResult<DocumentTemplate>;
