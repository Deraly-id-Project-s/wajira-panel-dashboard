import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDealers, getDealerById, importDealer, createDealer, updateDealer, deleteDealer, exportDealer } from '@/services/dealer.service';
import type { PaginationParams } from '@/types/pagination.types';
import type { DealerPayload } from '@/types/dealer.types';
import { companyQueryKeys } from '@/lib/query/company-key';

export function useDealers(
    companyId: string | null,
    params: PaginationParams & { search?: string } = { page: 1, perPage: 25 },
    options?: { enabled?: boolean },
) {
    const isEnabled = options?.enabled ?? Boolean(companyId);

    return useQuery({
        queryKey: companyId
            ? companyQueryKeys.list(companyId, 'dealers', {
                  page: params.page,
                  perPage: params.perPage,
                  search: params.search,
                  sort_by: params.sort_by,
                  sort_order: params.sort_order,
              })
            : ['dealers', 'unscoped', params],
        queryFn: () =>
            getDealers({
                company_id: companyId || undefined,
                ...params,
            }),
        enabled: isEnabled,
    });
}

export function useDealerDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['dealers', 'detail', id],
        queryFn: () => getDealerById(id as string | number),
        enabled: !!id,
    });
}

export function useImportDealer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, file }: { companyId: string | number; file: File }) => importDealer(file, companyId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
        },
    });
}

export function useCreateDealer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<DealerPayload>) => createDealer(data),
        onSuccess: (_data, variables) => {
            if (variables.companyId !== undefined && variables.companyId !== null) {
                queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
                return;
            }

            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('dealers'),
            });
        },
    });
}

export function useUpdateDealer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<DealerPayload> }) => updateDealer(id, data),
        onSuccess: (_data, variables) => {
            if (variables.data.companyId !== undefined && variables.data.companyId !== null) {
                queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.data.companyId) });
                return;
            }

            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('dealers'),
            });
        },
    });
}

export function useDeleteDealer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteDealer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('dealers'),
            });
        },
    });
}

export function useExportDealer() {
    return useMutation({
        mutationFn: (companyId?: string | number) => exportDealer(companyId),
    });
}
