import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '@/services/liability.service';
import type { CreateLiabilityPaymentPayload } from '@/types/pembayaran-hutang.types';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';

type LiabilityListOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  type?: 'purchase' | 'sales';
  start_date?: string;
  end_date?: string;
};

export const usePembayaranHutang = (options: LiabilityListOptions = {}) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? companyQueryKeys.list(companyId, 'liability-list', options) : ['liability-list', 'unscoped', options],
    queryFn: () => liabilityService.getList({ type: options.type, company_id: companyId ?? undefined, page: options.page, per_page: options.perPage, search: options.search, start_date: options.start_date, end_date: options.end_date }),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previous) => previous,
    enabled: Boolean(companyId),
  });
};

export const usePembayaranHutangDetail = (id?: number) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? companyQueryKeys.detail(companyId, 'liability-detail', id ?? '') : ['liability-detail', 'unscoped', id],
    queryFn: () => liabilityService.getDetail(id as number),
    enabled: typeof id === 'number' && Number.isFinite(id),
    staleTime: 1000 * 60 * 5,
  });
};

export const useDeletePembayaranHutang = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (id: number) => liabilityService.delete(id),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          (query.queryKey.includes('liability-list') ||
            query.queryKey.includes('liability-detail') ||
            query.queryKey.includes('sales-liability-list') ||
            query.queryKey.includes('sales-liability-detail')),
      });
    },
  });
};

export const useCreatePembayaranHutangPayment = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (payload: CreateLiabilityPaymentPayload | FormData) => liabilityService.createPayment(payload),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          (query.queryKey.includes('liability-list') ||
            query.queryKey.includes('liability-detail') ||
            query.queryKey.includes('sales-liability-list') ||
            query.queryKey.includes('sales-liability-detail')),
      });
    },
  });
};
