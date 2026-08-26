import type { PaginatedResult } from './pagination.types';

export interface Tarif {
    id: number;
    uuid?: string;
    loadingIn: string;
    loadingOut: string;
    distance: number;
    ujTowing?: number | null;
    ujCdd?: number | null;
    ujFuso?: number | null;
    invTowing?: number | null;
    invCdd?: number | null;
    invFuso?: number | null;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    customerId?: number;
    customer?: any;
}

export interface TarifPayload {
    loading_in: string;
    loading_out: string;
    distance: number;
    uj_towing?: number | null;
    uj_cdd?: number | null;
    uj_fuso?: number | null;
    inv_towing?: number | null;
    inv_cdd?: number | null;
    inv_fuso?: number | null;
    is_active?: boolean;
}

export type TarifListResponse = PaginatedResult<Tarif>;

