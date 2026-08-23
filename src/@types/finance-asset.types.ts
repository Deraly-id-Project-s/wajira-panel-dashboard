import { Asset, AssetType } from './asset.types';
import { PaginatedResult } from './pagination.types';

export interface FinanceAsset {
    id: number;
    uuid?: string;
    asset_id: number;
    price: number;
    purchase_date: string;
    serial_number?: string;
    economic_age?: number;
    depreciation?: number;
    depreciation_per_month?: number;
    monthly_depreciation?: number;
    residual_value?: number;
    final_value?: number;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    age?: number;
    months_used?: number;
    accumulated_depreciation?: number;
    book_value?: number;
    status?: string;
    company_id?: number;
    code?: string;
    name?: string;
    type?: AssetType | string;
    asset?: {
        id: number;
        company_id?: number;
        code?: string;
        name: string;
        type?: string;
        serial_number?: string;
        purchase_date?: string;
        price?: number;
        [key: string]: any;
    };
}

export interface FinanceAssetPayload {
    asset_id: number;
    price: number | string;
    purchase_date: string;
    economic_age: number;
    description?: string | null;
    serial_number?: string;
    depreciation?: number;
    monthly_depreciation?: number;
    accumulated_depreciation?: number;
    book_value?: number;
    final_value?: number;
    status?: string;
}

export interface FinanceAssetFormulaParams {
    asset_id: number | string;
    purchase_date: string;
    price: number | string;
    economic_age: number | string;
}

export interface FinanceAssetFormulaResult {
    purchase_date: string;
    price: number;
    economic_age: number;
    asset_id: number;
    age: number;
    monthly_depreciation: number;
    months_used: number;
    accumulated_depreciation: number;
    book_value: number;
    status: string;
    asset?: {
        id: number;
        name: string;
        [key: string]: any;
    };
}

export type FinanceAssetListResponse = PaginatedResult<FinanceAsset>;
