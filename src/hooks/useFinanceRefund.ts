import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FinanceRefundQueryParams, FinanceRefundRecord, RefundTransactionType, UpdateFinanceRefundPayload } from '@/@types/finance-refund.types';
import { financeRefundService } from '@/services/finance-refund.service';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';

const financeRefundKeys = {
  list: (companyId: string | number, params: FinanceRefundQueryParams) =>
    companyQueryKeys.list(companyId, 'finance-refunds', {
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
      transactionType: params.transactionType,
    }),
  detail: (companyId: string | number, id: number | string) =>
    companyQueryKeys.detail(companyId, 'finance-refund-detail', id),
};

export const useFinanceRefundDetail = (id?: number | string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId && id ? financeRefundKeys.detail(companyId, id) : ['finance-refund-detail', 'unscoped', id],
    queryFn: () => financeRefundService.getFinanceRefundDetail(id as number | string),
    enabled: Boolean(companyId) && Boolean(id),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateFinanceRefundPaidStatus = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload: { is_paid: boolean; note?: string } }) => {
      return await financeRefundService.updatePaidStatus(id, payload);
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'company' &&
            query.queryKey[1] === String(companyId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['finance-refunds'] });
        queryClient.invalidateQueries({ queryKey: ['finance-refund-detail'] });
      }
    },
  });
};

export const useFinanceRefundList = (params: FinanceRefundQueryParams) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? financeRefundKeys.list(companyId, params) : ['finance-refunds', 'unscoped', params],
    queryFn: () =>
      financeRefundService.getRefundList({
        ...params,
        company_id: companyId ?? undefined,
      }),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(companyId),
  });
};

export const useApproveFinanceRefund = (transactionType: RefundTransactionType) => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ refundId, payload }: { refundId: string; payload: UpdateFinanceRefundPayload }) => {
      if (!companyId) {
        throw new Error('Company context tidak tersedia');
      }

      const previous = queryClient.getQueriesData<{ data: FinanceRefundRecord[] }>({
        queryKey: companyQueryKeys.companyScope(companyId),
      });

      queryClient.setQueriesData(
        { queryKey: companyQueryKeys.companyScope(companyId) },
        (current: any) => {
          if (!current?.data || !Array.isArray(current.data)) return current;
          return {
            ...current,
            data: current.data.map((item: FinanceRefundRecord) =>
              item.id === refundId
                ? {
                  ...item,
                  status: payload.status,
                  cashId: payload.cash_id,
                }
                : item,
            ),
          };
        },
      );

      try {
        return await financeRefundService.approveRefund(refundId, payload);
      } catch (error) {
        previous.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value);
        });
        throw error;
      }
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'company' &&
            query.queryKey[1] === String(companyId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['finance-refunds', transactionType] });
      }
    },
  });
};

export const useDeleteFinanceRefund = (transactionType: RefundTransactionType) => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ refundId, deleteFinanceRefund }: { refundId: string; deleteFinanceRefund: boolean }) => {
      return await financeRefundService.deleteRefund(refundId, deleteFinanceRefund);
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'company' &&
            query.queryKey[1] === String(companyId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['finance-refunds', transactionType] });
      }
    },
  });
};
