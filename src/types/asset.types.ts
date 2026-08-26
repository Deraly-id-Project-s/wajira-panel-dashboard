import { PaginatedResult } from './pagination.types';

export type AssetType = 'inventory' | 'vehicles' | 'buildings' | 'land';

export interface Asset {
    id: number;
    uuid: string;
    company_id: number;
    code?: string;
    name: string;
    type: AssetType;
    created_at: string;
    updated_at: string;
}

export interface AssetPayload {
    company_id: number;
    name: string;
    code?: string;
    type: AssetType;
    purchase_date?: string;
    price?: number;
    serial_number?: string;
}

export type AssetListResponse = PaginatedResult<Asset>;
