import { PaginatedResult } from './pagination.types';

export interface VehicleEquipment {
    id: number;
    uuid: string;
    code: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface VehicleEquipmentPayload {
    code: string;
    name: string;
}

export type VehicleEquipmentListResponse = PaginatedResult<VehicleEquipment>;
