import { PaginatedResult } from './pagination.types';
import type { Region } from './region.types';
import type { Dealer } from './dealer.types';

export interface BBN {
    id: number;
    uuid: string;
    dealerId: number;
    regionId: number;
    tnbkCode: string;
    vehicleType: string;
    unNoticeFee: number;
    garwilFee: number;
    countershopFee: number;
    otherFee: number;
    createdAt?: string;
    updatedAt?: string;
    region?: Partial<Region>;
    dealer?: Partial<Dealer>;
}

export interface BBNPayload {
    dealerId: number | string;
    regionId: number | string;
    tnbkCode: string;
    vehicleType: string;
    unNoticeFee: number | string;
    garwilFee: number | string;
    countershopFee: number | string;
    otherFee: number | string;
}

export type BBNListResponse = PaginatedResult<BBN>;
