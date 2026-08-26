import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterials, getMaterialById, importMaterial, createMaterial, updateMaterial, deleteMaterial, exportMaterial } from '@/services/material.service';
import type { PaginationParams } from '@/types/pagination.types';
import type { MaterialPayload } from '@/types/material.types';

export function useMaterials(params: PaginationParams & { search?: string; has_transaction?: boolean; sort_order?: 'asc' | 'desc' } = { page: 1, perPage: 25 }) {
    return useQuery({
        queryKey: ['materials', params.page, params.perPage, params.search, params.has_transaction, params.sort_order],
        queryFn: () => getMaterials(params),
    });
}

export function useMaterialDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['materials', id],
        queryFn: () => getMaterialById(id as string | number),
        enabled: !!id,
    });
}

export function useImportMaterial() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file }: { file: File }) => importMaterial(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

export function useCreateMaterial() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<MaterialPayload>) => createMaterial(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

export function useUpdateMaterial() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<MaterialPayload> }) => updateMaterial(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

export function useDeleteMaterial() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteMaterial(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

export function useExportMaterial() {
    return useMutation({
        mutationFn: () => exportMaterial(),
    });
}
