import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRegions, getRegionById, importRegion, createRegion, updateRegion, deleteRegion, exportRegion } from '@/services/region.service';
import type { PaginationParams } from '@/types/pagination.types';
import type { RegionPayload } from '@/types/region.types';

export function useRegions(params: PaginationParams & { search?: string } = { page: 1, perPage: 25 }) {
    return useQuery({
        queryKey: ['regions', params.page, params.perPage, params.search],
        queryFn: () => getRegions(params),
    });
}

export function useRegionDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['regions', id],
        queryFn: () => getRegionById(id as string | number),
        enabled: !!id,
    });
}

export function useImportRegion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file }: { file: File }) => importRegion(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
        },
    });
}

export function useCreateRegion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<RegionPayload>) => createRegion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
        },
    });
}

export function useUpdateRegion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<RegionPayload> }) => updateRegion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
        },
    });
}

export function useDeleteRegion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteRegion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
        },
    });
}

export function useExportRegion() {
    return useMutation({
        mutationFn: () => exportRegion(),
    });
}
