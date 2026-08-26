import type { PaginatedResult } from './pagination.types';

export interface Brand {
    id: number | string;
    name: string;
    image?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type BrandDetail = Brand;

export interface BrandPayload {
    name: string;
    image?: File | string | null;
}

export interface BrandListResponse extends PaginatedResult<Brand> { }
