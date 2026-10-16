import type { PaginatedResult } from './pagination.types';
import type { RouteModel } from './route.types';

export interface TarifRoutePivot {
    id?: number;
    tarif_id?: number;
    tarifId?: number;
    route_id?: number;
    routeId?: number;
    order?: number;
    state_at: 'loading_in' | 'loading_out' | string;
    stateAt?: 'loading_in' | 'loading_out' | string;
    created_at?: string;
    updated_at?: string;
}

export interface TarifRouteInput {
    route_id: number;
    order?: number;
    state_at: 'loading_in' | 'loading_out';
}

export interface TarifPriceVersion {
    id: number;
    uuid?: string;
    tarif_id?: number;
    tarifId?: number;
    name?: string | null;
    uj_towing?: number;
    ujTowing?: number;
    uj_cdd?: number;
    ujCdd?: number;
    uj_fuso?: number;
    ujFuso?: number;
    effective_from?: string | null;
    effectiveFrom?: string | null;
    effective_until?: string | null;
    effectiveUntil?: string | null;
    is_default?: boolean;
    isDefault?: boolean;
    is_lock?: boolean;
    isLock?: boolean;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
}

export interface Tarif {
    id: number;
    uuid?: string;
    loadingIn?: string;
    loadingOut?: string;
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
    routes?: RouteModel[];
    tarifPriceVersions?: TarifPriceVersion[];
}

export interface TarifPayload {
    distance: number;
    uj_towing?: number | null;
    uj_cdd?: number | null;
    uj_fuso?: number | null;
    inv_towing?: number | null;
    inv_cdd?: number | null;
    inv_fuso?: number | null;
    is_active?: boolean;
    routes?: TarifRouteInput[] | number[];
    // Backwards compatibility if legacy form fields are used
    loading_in?: string;
    loading_out?: string;
}

export type TarifListResponse = PaginatedResult<Tarif>;
