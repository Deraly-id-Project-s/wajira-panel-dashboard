import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendors, getVendorById, importVendor, createVendor, updateVendor, deleteVendor, exportVendor } from '@/services/vendor.service';
import type { PaginationParams } from '@/types/pagination.types';
import type { VendorPayload } from '@/types/vendor.types';
import { companyQueryKeys } from '@/lib/query/company-key';

export function useVendors(params: PaginationParams & { search?: string; company_id?: string | number }) {
    return useQuery({
        queryKey: params.company_id
            ? companyQueryKeys.list(params.company_id, 'vendors', {
                page: params.page,
                perPage: params.perPage,
                search: params.search ?? '',
            })
            : ['company', 'unselected', 'vendors'],
        queryFn: () => getVendors(params),
        enabled: Boolean(params.company_id),
    });
}

export function useVendorDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['vendors', id],
        queryFn: () => getVendorById(id as string | number),
        enabled: !!id,
    });
}

export function useImportVendor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, file }: { companyId: string | number; file: File }) => importVendor(companyId, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
        },
    });
}

export function useCreateVendor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<VendorPayload>) => createVendor(data),
        onSuccess: (_data, variables) => {
            if (!variables.companyId) return;
            queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
        },
    });
}

export function useUpdateVendor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<VendorPayload> }) => updateVendor(id, data),
        onSuccess: (_data, variables) => {
            if (!variables.data.companyId) return;
            queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.data.companyId) });
        },
    });
}

export function useDeleteVendor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteVendor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('vendors'),
            });
        },
    });
}

export function useExportVendor() {
    return useMutation({
        mutationFn: (companyId: string | number) => exportVendor(companyId),
    });
}
