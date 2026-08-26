import type { PaginatedResult } from './pagination.types';

export interface Dealer {
    id: number | string;
    uuid?: string;
    code?: string;
    namaDealer: string;
    alamat?: string | null;
    pic?: string | null;
    handphone?: string | null;
    userId?: number | string;
    companyId?: number | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DealerPayload {
    namaDealer: string;
    code?: string;
    alamat?: string;
    pic?: string;
    handphone?: string;
    userId?: number | string;
    companyId?: number | string;
}

export interface DealerListResponse extends PaginatedResult<Dealer> { }
