import type { PaginatedResult, PaginationParams } from './pagination.types';

export interface DriverCashAdvanceDriver {
  id: number;
  code?: string | null;
  name: string;
}

export interface DriverCashAdvance {
  id: number;
  uuid?: string | null;
  companyId: number;
  driverId: number;
  subject: string;
  description?: string | null;
  claimNominal: number;
  claimDate: string;
  isApprove: boolean;
  approveDate?: string | null;
  code?: string | null;
  driver?: DriverCashAdvanceDriver | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DriverCashAdvancePayload {
  company_id: number;
  driver_id: number;
  subject: string;
  description?: string | null;
  claim_nominal: number;
  claim_date: string;
}

export interface DriverCashAdvanceApprovalPayload {
  is_approve: boolean;
  approve_date: string;
}

export interface DriverCashAdvanceListParams extends PaginationParams {
  company_id?: number | string;
  start_date?: string | null;
  end_date?: string | null;
}

export type DriverCashAdvanceListResponse = PaginatedResult<DriverCashAdvance>;
