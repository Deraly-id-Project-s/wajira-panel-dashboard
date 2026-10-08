import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CashFlowFilterParams, CashFlowPayload } from '@/@types/kas-harian.types';
import { createCashFlow, deleteCashFlow, fetchCashFlow, fetchCashFlowDetail, updateCashFlow, toggleCashFlowPaymentStatus, syncCashFlowPpnData } from '@/services/cashFlowService';

const CASH_FLOW_KEY = 'cash-flow';

export const cashFlowKeys = {
  all: [CASH_FLOW_KEY] as const,
  list: (params: CashFlowFilterParams) => [CASH_FLOW_KEY, 'list', params] as const,
  detail: (id: number | string | undefined) => [CASH_FLOW_KEY, 'detail', id] as const,
};

interface CashFlowQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useKasHarian(params: CashFlowFilterParams, options?: CashFlowQueryOptions) {
  return useQuery({
    queryKey: cashFlowKeys.list(params),
    queryFn: () => fetchCashFlow(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    retry: 2,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useKasHarianDetail(id?: number, options?: CashFlowQueryOptions) {
  return useQuery({
    queryKey: cashFlowKeys.detail(id),
    queryFn: () => fetchCashFlowDetail(id as number),
    enabled: (options?.enabled ?? true) && typeof id === 'number' && Number.isFinite(id),
    retry: 1,
    staleTime: Infinity,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateKasHarian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CashFlowPayload) => createCashFlow(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.all });
    },
  });
}

export function useUpdateKasHarian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: CashFlowPayload }) => updateCashFlow(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.all });
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.detail(variables.id) });
    },
  });
}

export function useDeleteKasHarian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteCashFlow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.all });
    },
  });
}

export function useToggleKasHarianPaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['toggle-cash-flow-payment-status'],
    mutationFn: ({ id, isPaid }: { id: number | string; isPaid: boolean }) => toggleCashFlowPaymentStatus(id, isPaid),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.all });
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.detail(variables.id) });
    },
  });
}

export function useSyncKasHarianPpnData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => syncCashFlowPpnData(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.all });
      queryClient.invalidateQueries({ queryKey: cashFlowKeys.detail(id) });
    },
  });
}
