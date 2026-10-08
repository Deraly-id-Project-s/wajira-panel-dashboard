import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FinanceBillingItemPayload, FinanceBillingPayload } from '@/@types/finance-billing.types';
import { createFinanceBilling, createFinanceBillingItem, deleteFinanceBilling, deleteFinanceBillingItem, fetchFinanceBilling, fetchFinanceBillingDetail, updateFinanceBilling, updateFinanceBillingItem } from '@/services/financeBilling.service';

const FINANCE_BILLING_KEY = 'finance-billing';

export const financeBillingKeys = {
  all: [FINANCE_BILLING_KEY] as const,
  list: (params: { page?: number; per_page?: number; search?: string; company_id?: number | string }) => [FINANCE_BILLING_KEY, 'list', params] as const,
  detail: (id: number | string | undefined) => [FINANCE_BILLING_KEY, 'detail', id] as const,
};

interface FinanceBillingQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useFinanceBilling(params: { page?: number; per_page?: number; search?: string; company_id?: number | string }, options?: FinanceBillingQueryOptions) {
  return useQuery({
    queryKey: financeBillingKeys.list(params),
    queryFn: () => fetchFinanceBilling(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useFinanceBillingDetail(id?: number, options?: FinanceBillingQueryOptions) {
  return useQuery({
    queryKey: financeBillingKeys.detail(id),
    queryFn: () => fetchFinanceBillingDetail(id as number),
    enabled: (options?.enabled ?? true) && typeof id === 'number' && Number.isFinite(id),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateFinanceBillingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: FinanceBillingItemPayload }) => createFinanceBillingItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeBillingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}

export function useUpdateFinanceBillingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: FinanceBillingItemPayload }) => updateFinanceBillingItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeBillingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}

export function useDeleteFinanceBillingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteFinanceBillingItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeBillingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}

export function useCreateFinanceBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FinanceBillingPayload) => createFinanceBilling(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeBillingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}

export function useUpdateFinanceBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: FinanceBillingPayload }) => updateFinanceBilling(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeBillingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}

export function useDeleteFinanceBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteFinanceBilling(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeBillingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}
