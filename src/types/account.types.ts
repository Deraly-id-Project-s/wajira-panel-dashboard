import type { AccountGroup } from './account-group.types';
import type { PaginatedResult } from './pagination.types';
import type { AccountCategoryValue } from '@/lib/account';

export type AccountCategory = AccountCategoryValue | string;
// Backend may spell "debet"; keep both for compatibility but prefer "debet" when sending
export type AccountTypeValue = 'credit' | 'debet' | 'debit';
export type AccountType = 'AKTIVA' | 'PASIVA';

/**
 * Canonical Account shape used across master data screens.
 * Legacy fields retained as optional to keep backward compatibility
 * with older mock-based screens.
 */
export interface Account {
  id: string | number;
  uuid?: string;
  code: string;
  name: string;
  accountGroupId: number;
  accountGroupCode?: string;
  description?: string | null;
  isActive: boolean;
  is_lock?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Backend type field (credit/debit)
  type?: AccountTypeValue;

  // Legacy fields (soft-deprecated)
  group?: string;
  category?: AccountCategory | null;
  cashFlow?: AccountCategory;
  accountType?: AccountType; // Klasifikasi Aktiva/Pasiva
  parentId?: string | null; // Hierarchy support
  companyId?: string; // Multi-tenant support
}

export interface AccountDetail extends Account {
  accountGroup?: AccountGroup;
}

export interface AccountPayload {
  accountGroupId: number;
  code: string;
  name: string;
  description?: string | null;
  type?: AccountTypeValue;
  category?: AccountCategory | null;
}

export interface AccountListResponse extends PaginatedResult<Account> {}

// Legacy request shapes (kept for compatibility with older screens)
export interface CreateAccountRequest {
  code: string;
  group: string;
  description: string;
  category: AccountCategory;
  accountType: AccountType;
  parentId?: string;
  isActive?: boolean;
  companyId: string;
}

export interface UpdateAccountRequest {
  code?: string;
  group?: string;
  description?: string;
  category?: AccountCategory;
  accountType?: AccountType;
  parentId?: string | null;
  isActive?: boolean;
}
