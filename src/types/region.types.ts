import { PaginatedResult } from './pagination.types';

export interface Region {
    id: number;
    uuid: string;
    code: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RegionPayload {
    code: string;
    name: string;
}

export type RegionListResponse = PaginatedResult<Region>;
