import type { PaginatedResult, PaginationParams } from './pagination.types';

export type DocumentArchiveType = 'invoice_purchase' | 'report' | 'letter' | 'other';

export const DOCUMENT_ARCHIVE_TYPE_OPTIONS: { value: DocumentArchiveType; label: string; prefix: string }[] = [
  { value: 'report', label: 'Report / Laporan', prefix: 'RPT' },
  { value: 'invoice_purchase', label: 'Invoice Purchase', prefix: 'INV' },
  { value: 'letter', label: 'Letter / Surat', prefix: 'LTR' },
  { value: 'other', label: 'Other / Lainnya', prefix: 'DOC' },
];

export const DOCUMENT_ARCHIVE_TYPE_LABELS: Record<DocumentArchiveType, string> = {
  report: 'Report',
  invoice_purchase: 'Invoice Purchase',
  letter: 'Letter',
  other: 'Other',
};

export interface DocumentCode {
  id: number;
  name: string;
  code: string;
  type: DocumentArchiveType;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentCodeUpdatePayload {
  code: string;
  description?: string;
}

export interface DocumentArchive {
  id: number;
  uuid: string;
  previousDocumentId?: number | null;
  documentNumber: number;
  documentCode: string;
  isLatest: boolean;
  type: DocumentArchiveType;
  name: string;
  format: 'pdf' | 'docx' | string;
  file: string;
  fileUrl: string | null;
  isActive: boolean;
  isExpired: boolean;
  expiredAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  previousDocument?: DocumentArchive | null;
  revisions?: DocumentArchive[];
}

export interface DocumentArchiveListParams extends PaginationParams {
  type?: DocumentArchiveType | string;
  format?: 'pdf' | 'docx' | string;
  is_latest?: boolean | string;
  is_active?: boolean | string;
  is_expired?: boolean | string;
  previous_document_id?: number | string;
}

export type DocumentArchiveListResponse = PaginatedResult<DocumentArchive>;

export interface CreateDocumentArchivePayload {
  name: string;
  type: DocumentArchiveType;
  file: File | string;
  document_code?: string;
  document_number?: number;
  previous_document_id?: number | null;
  is_latest?: boolean;
  is_active?: boolean;
  expired_at?: string | null;
  notes?: string | null;
}

export interface UpdateDocumentArchivePayload {
  name?: string;
  type?: DocumentArchiveType;
  document_code?: string;
  document_number?: number;
  previous_document_id?: number | null;
  is_latest?: boolean;
  is_active?: boolean;
  expired_at?: string | null;
  notes?: string | null;
}

export interface LatestDocumentNumberResponse {
  type: DocumentArchiveType;
  latest_number: number;
  next_number: number;
  suggested_code: string;
}
