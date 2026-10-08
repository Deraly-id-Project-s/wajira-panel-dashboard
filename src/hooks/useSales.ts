import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesService, SalesPayload } from '@/services/sales.service';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';
import { mapSalesDetailToUI } from '@/services/sales.mapper';

const salesKeys = {
  all: (companyId: string) => companyQueryKeys.list(companyId, 'sales-transactions'),
  detail: (companyId: string, id: string) => companyQueryKeys.detail(companyId, 'sales-transactions', id),
};

export const useSalesList = (options: { page?: number; perPage?: number; search?: string; status?: string; start_date?: string | null; end_date?: string | null } = {}) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId
      ? companyQueryKeys.list(companyId, 'sales-transactions', {
          page: options.page,
          perPage: options.perPage,
          search: options.search,
          status: options.status,
          start_date: options.start_date,
          end_date: options.end_date,
        })
      : ['sales-transactions', 'unscoped', options],
    queryFn: () => salesService.getSalesList(companyId ?? undefined, options),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(companyId),
  });
};

export const useSalesDetail = (id?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? salesKeys.detail(companyId, id ?? '') : ['sales-transaction', 'unscoped', id],
    queryFn: async () => {
      const detail = await salesService.getSalesDetail(id as string, companyId ?? undefined);
      return {
        raw: detail,
        ui: mapSalesDetailToUI(detail as any),
      };
    },
    enabled: !!id && Boolean(companyId),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSalesById = (id?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? ['sales-by-id', companyId, id ?? ''] : ['sales-by-id', 'unscoped', id],
    queryFn: () => salesService.getSalesDetail(id as string, companyId ?? undefined),
    enabled: !!id && Boolean(companyId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateSales = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SalesPayload) => salesService.createSales(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.company_id) });
    },
  });
};

export const useUpdateSales = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SalesPayload }) => salesService.updateSales(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.payload.company_id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.detail(String(variables.payload.company_id), variables.id) });
    },
  });
};

export const useDeleteSales = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (id: string) => salesService.deleteSales(id, companyId ?? undefined),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('sales-transactions'),
      });
    },
  });
};
