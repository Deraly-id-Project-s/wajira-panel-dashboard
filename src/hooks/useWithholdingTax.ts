import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WithholdingTaxListParams, WithholdingTaxPayload } from '@/types/withholding-tax.types';
import {
  createWithholdingTax,
  deleteWithholdingTax,
  getWithholdingTaxDetail,
  getWithholdingTaxList,
  updateWithholdingTax,
} from '@/services/withholding-tax.service';

export function useWithholdingTaxes(params: WithholdingTaxListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['withholding-tax', 'list', rest],
    queryFn: () => getWithholdingTaxList(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useWithholdingTaxDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['withholding-tax', 'detail', id],
    queryFn: () => getWithholdingTaxDetail(id as string | number),
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateWithholdingTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithholdingTaxPayload) => createWithholdingTax(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withholding-tax'] });
    },
  });
}

export function useUpdateWithholdingTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: WithholdingTaxPayload }) => updateWithholdingTax(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['withholding-tax'] });
      queryClient.invalidateQueries({ queryKey: ['withholding-tax', 'detail', variables.id] });
    },
  });
}

export function useDeleteWithholdingTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteWithholdingTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withholding-tax'] });
    },
  });
}
