import type { PaginatedResult } from './pagination.types';

export interface AccountGroup {
  id: number | string;
  code: string;
  name: string;
  companyId?: string | number | null;
  description?: string | null;
  isActive: boolean;
  is_lock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AccountGroupDetail = AccountGroup;

export interface AccountGroupPayload {
  company_id: string | number;
  group_code: string;
  description?: string | null;
}

export interface AccountGroupListResponse extends PaginatedResult<AccountGroup> { }
