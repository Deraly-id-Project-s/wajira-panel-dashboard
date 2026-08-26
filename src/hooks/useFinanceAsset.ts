import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinanceAssets, getFinanceAssetById, updateFinanceAsset, deleteFinanceAsset, exportFinanceAsset, createFinanceAsset, getFinanceAssetFormula } from '@/services/finance-asset.service';
import type { PaginationParams } from '@/@types/pagination.types';
import type { FinanceAssetPayload, FinanceAssetFormulaParams } from '@/@types/finance-asset.types';

export function useFinanceAssets(companyId: string | number | null, params: PaginationParams & { search?: string } = { page: 1, perPage: 25 }) {
    return useQuery({
        queryKey: ['finance-assets', companyId, params.page, params.perPage, params.search],
        queryFn: () => getFinanceAssets({
            company_id: companyId || undefined,
            ...params
        }),
        enabled: !!companyId,
    });
}

export function useFinanceAssetDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['finance-assets', id],
        queryFn: () => getFinanceAssetById(id as string | number),
        enabled: !!id,
    });
}

export function useFinanceAssetFormula(params: {
    asset_id?: number | string;
    purchase_date?: string;
    price?: number | string;
    economic_age?: number | string;
}) {
    const assetId = Number(params.asset_id);
    const price = Number(params.price);
    const economicAge = Number(params.economic_age);
    const purchaseDate = params.purchase_date ? params.purchase_date.split('T')[0].split(' ')[0] : '';

    const isReady = !!assetId && assetId > 0 && !!purchaseDate && price > 0 && economicAge > 0;

    return useQuery({
        queryKey: ['finance-asset-formula', assetId, purchaseDate, price, economicAge],
        queryFn: () => getFinanceAssetFormula({
            asset_id: assetId,
            purchase_date: purchaseDate,
            price,
            economic_age: economicAge,
        }),
        enabled: isReady,
        staleTime: 1000 * 60 * 5,
    });
}

export function useCreateFinanceAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FinanceAssetPayload) => createFinanceAsset(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-assets'] });
        },
    });
}

export function useUpdateFinanceAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<FinanceAssetPayload> }) => updateFinanceAsset(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-assets'] });
        },
    });
}

export function useDeleteFinanceAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteFinanceAsset(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-assets'] });
        },
    });
}

export function useExportFinanceAsset() {
    return useMutation({
        mutationFn: () => exportFinanceAsset(),
    });
}
