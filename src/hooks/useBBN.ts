import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBBNs, getBBNById, createBBN, updateBBN, deleteBBN, importBBN, exportBBN } from '@/services/bbn.service';
import type { PaginationParams } from '@/types/pagination.types';
import type { BBNPayload } from '@/types/bbn.types';

export function useBBNs(params: PaginationParams & { search?: string }) {
    return useQuery({
        // Include all params so query recomputes when search/page/perPage changes
        queryKey: ['bbns-list', params.page, params.perPage, params.search],
        queryFn: () => getBBNs(params),
        // Keep previous data shown while new results load (smoother UX)
        placeholderData: (prev) => prev,
        staleTime: 30_000, // raw list cache for 30s, avoids redundant network calls during pagination
    });
}

export function useBBNDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['bbns', id],
        queryFn: () => getBBNById(id as string | number),
        enabled: !!id,
    });
}

export function useCreateBBN() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<BBNPayload>) => createBBN(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bbns'] });
            queryClient.invalidateQueries({ queryKey: ['bbns-list'] });
        },
    });
}

export function useUpdateBBN() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<BBNPayload> }) => updateBBN(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bbns'] });
            queryClient.invalidateQueries({ queryKey: ['bbns-list'] });
        },
    });
}

export function useDeleteBBN() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteBBN(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bbns'] });
            queryClient.invalidateQueries({ queryKey: ['bbns-list'] });
        },
    });
}

export function useImportBBN() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => importBBN(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bbns'] });
            queryClient.invalidateQueries({ queryKey: ['bbns-list'] });
        },
    });
}

export function useExportBBN() {
    return useMutation({
        mutationFn: () => exportBBN(),
    });
}
