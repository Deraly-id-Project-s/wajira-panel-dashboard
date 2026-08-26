import { PaginatedResult } from './pagination.types';

export interface Material {
    id: number;
    uuid: string;
    code: string;
    name: string;
    price: number;
    type: string;
    averagePrice?: number;
    stock?: number;
    totalPurchased?: number;
    totalSold?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface MaterialPayload {
    code?: string;
    name: string;
    price: number | string;
    type: string;
}

export type MaterialListResponse = PaginatedResult<Material>;
