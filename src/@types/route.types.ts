import type { PaginatedResult } from './pagination.types';

export interface RouteModel {
    id: number;
    uuid?: string;
    name: string;
    address?: string | null;
    link?: string | null;
    other_information?: string | null;
    otherInformation?: string | null;
    description?: string | null;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
    pivot?: TarifRoutePivot;
}

export type RouteItem = RouteModel;

export interface CreateRoutePayload {
    name: string;
    address?: string | null;
    link?: string | null;
    other_information?: string | null;
    description?: string | null;
}

export type UpdateRoutePayload = Partial<CreateRoutePayload>;

export type RouteListResponse = PaginatedResult<RouteModel>;
