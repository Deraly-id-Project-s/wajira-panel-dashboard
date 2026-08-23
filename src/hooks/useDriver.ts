import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver,
    importDriver,
    exportDriver,
} from '@/services/driver.service';
import type { PaginationParams } from '@/@types/pagination.types';
import type { DriverPayload } from '@/@types/driver.types';
import { companyQueryKeys } from '@/lib/query/company-key';

export function useDrivers(params: PaginationParams & { search?: string; company_id?: string | number; enabled?: boolean }) {
    const { enabled = true, ...rest } = params;
    return useQuery({
        queryKey: rest.company_id
            ? companyQueryKeys.list(rest.company_id, 'drivers', {
                page: rest.page,
                perPage: rest.perPage,
                search: rest.search ?? '',
            })
            : ['company', 'unselected', 'drivers'],
        queryFn: () => getDrivers(rest),
        enabled: enabled && Boolean(rest.company_id),
        placeholderData: (prev) => prev,
        staleTime: 30_000,
    });
}

export function useDriverDetail(id: string | number | null) {
    return useQuery({
        queryKey: ['drivers', id],
        queryFn: () => getDriverById(id as string | number),
        enabled: !!id,
    });
}

export function useCreateDriver() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: DriverPayload) => createDriver(data),
        onSuccess: (_data, variables) => {
            if (!variables.company_id) return;
            queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.company_id) });
        },
    });
}

export function useUpdateDriver() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: DriverPayload }) =>
            updateDriver(id, data),
        onSuccess: (_data, variables) => {
            if (!variables.data.company_id) return;
            queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.data.company_id) });
        },
    });
}

export function useDeleteDriver() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteDriver(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('drivers'),
            });
        },
    });
}

export function useImportDriver() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, file }: { id: string | number; file: File }) => importDriver(id, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.id) });
        },
    });
}

export function useExportDriver() {
    return useMutation({
        mutationFn: (companyId: string | number) => exportDriver(companyId),
    });
}
