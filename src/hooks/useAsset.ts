import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssets, getAssetById, importAsset, createAsset, updateAsset, deleteAsset, exportAsset } from '@/services/asset.service';
import type { PaginationParams } from '@/types/pagination.types';
import type { AssetPayload } from '@/types/asset.types';
import { companyQueryKeys } from '@/lib/query/company-key';

export function useAssets(companyId: string | number | null, params: PaginationParams & { search?: string } = { page: 1, perPage: 100 }) {
    return useQuery({
        queryKey: companyId
            ? companyQueryKeys.list(companyId, 'assets', {
                page: params.page,
                perPage: params.perPage,
                search: params.search ?? '',
            })
            : ['company', 'unselected', 'assets'],
        queryFn: () => getAssets({
            company_id: companyId || undefined,
            ...params
        }),
        enabled: !!companyId,
    });
}

export function useAssetDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['assets', 'detail', id],
        queryFn: () => getAssetById(id as string | number),
        enabled: !!id,
    });
}

export function useImportAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, companyId }: { file: File; companyId?: string | number }) => importAsset(file, companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
}

export function useCreateAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<AssetPayload>) => createAsset(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<AssetPayload> }) => updateAsset(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteAsset(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
}

export function useExportAsset() {
    return useMutation({
        mutationFn: (companyId?: string | number) => exportAsset(companyId),
    });
}
