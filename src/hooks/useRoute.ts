import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoutes, getAllRouteOptions, getRouteById, createRoute, updateRoute, deleteRoute } from '@/services/route.service';
import type { PaginationParams } from '@/@types/pagination.types';
import type { CreateRoutePayload, UpdateRoutePayload } from '@/@types/route.types';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';

export function useRoutes(params: PaginationParams & { search?: string; enabled?: boolean }) {
    const { companyId } = useCompany();
    const { enabled = true, ...rest } = params;

    return useQuery({
        queryKey: companyId
            ? companyQueryKeys.list(companyId, 'routes', {
                  page: rest.page,
                  perPage: rest.perPage,
                  search: rest.search,
                  sort_by: rest.sort_by,
                  sort_order: rest.sort_order,
              })
            : ['routes', 'unscoped', rest],
        queryFn: () => getRoutes({ ...rest, company_id: companyId ?? undefined }),
        placeholderData: (prev) => prev,
        staleTime: 30_000,
        enabled: enabled && Boolean(companyId),
    });
}

export function useRouteOptions() {
    const { companyId } = useCompany();

    return useQuery({
        queryKey: companyId ? ['routes', 'options', companyId] : ['routes', 'options', 'all'],
        queryFn: () => getAllRouteOptions(),
        staleTime: 60_000,
        enabled: Boolean(companyId),
    });
}

export function useRouteDetail(id: string | number | null) {
    const { companyId } = useCompany();

    return useQuery({
        queryKey: companyId ? companyQueryKeys.detail(companyId, 'routes', id ?? '') : ['routes', 'detail', id],
        queryFn: () => getRouteById(id as string | number),
        enabled: !!id,
    });
}

export function useCreateRoute() {
    const queryClient = useQueryClient();
    const { companyId } = useCompany();

    return useMutation({
        mutationFn: (data: CreateRoutePayload) => createRoute(data),
        onSuccess: () => {
            if (companyId) {
                queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
            }
            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('routes'),
            });
        },
    });
}

export function useUpdateRoute() {
    const queryClient = useQueryClient();
    const { companyId } = useCompany();

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: UpdateRoutePayload }) =>
            updateRoute(id, data),
        onSuccess: () => {
            if (companyId) {
                queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
            }
            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('routes'),
            });
        },
    });
}

export function useDeleteRoute() {
    const queryClient = useQueryClient();
    const { companyId } = useCompany();

    return useMutation({
        mutationFn: (id: string | number) => deleteRoute(id),
        onSuccess: () => {
            if (companyId) {
                queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
            }
            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('routes'),
            });
        },
    });
}
