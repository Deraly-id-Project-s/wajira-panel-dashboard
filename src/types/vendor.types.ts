import { PaginatedResult } from './pagination.types';

export interface Vendor {
    id: number;
    uuid: string;
    picName: string;
    code: string;
    type: string;
    name: string;
    address: string;
    npwp: string;
    phone: string;
    identityNumber?: string | null;
    driveLicenseIdentityNumber?: string | null;
    image?: string | null;
    mapLink?: string | null;
    socialMedia1Link?: string | null;
    socialMedia2Link?: string | null;
    socialMedia3Link?: string | null;
    socialMedia4Link?: string | null;
    websiteLink?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface VendorPayload {
    companyId: string | number;
    name: string;
    address: string;
    phone: string;
    npwp?: string;
    picName: string;
}

export type VendorListResponse = PaginatedResult<Vendor>;
