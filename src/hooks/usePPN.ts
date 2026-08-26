import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BulkUpdatePPNPayload, PPNFilterParams, UpdatePPNMutationPayload } from '@/types/ppn.types';
import { bulkUpdatePPN, getPPNList, updatePPN } from '@/services/api/ppn';

const PPN_KEY = 'ppn';

export const ppnKeys = {
  all: [PPN_KEY] as const,
  list: (params: PPNFilterParams) => [PPN_KEY, 'list', params] as const,
};

export function usePPN(params: PPNFilterParams) {
  return useQuery({
    queryKey: ppnKeys.list(params),
    queryFn: () => getPPNList(params),
    placeholderData: keepPreviousData,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useUpdatePPN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: UpdatePPNMutationPayload) => updatePPN(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppnKeys.all });
    },
  });
}

export function useBulkUpdatePPN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdatePPNPayload) => bulkUpdatePPN(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppnKeys.all });
    },
  });
}

// Convenient aliases & wrappers for Pembelian & Penjualan
export const ppnPembelianKeys = ppnKeys;
export const ppnPenjualanKeys = ppnKeys;

export const usePPNPembelian = (params: PPNFilterParams) => usePPN({ ...params, type: 'ppn_purchase' });
export const usePPNPenjualan = (params: PPNFilterParams) => usePPN({ ...params, type: 'ppn_sales' });

export const useUpdatePPNPembelian = useUpdatePPN;
export const useUpdatePPNPenjualan = useUpdatePPN;

export const useBulkUpdatePPNPembelian = useBulkUpdatePPN;
export const useBulkUpdatePPNPenjualan = useBulkUpdatePPN;
