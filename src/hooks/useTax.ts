import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TaxListParams, TaxPayload } from '@/types/tax.types';
import { createTax, deleteTax, getTaxDetail, getDefaultTaxByCode, getTaxes, updateTax } from '@/services/tax.service';

export function useTaxes(params?: TaxListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params ?? {};

  return useQuery({
    queryKey: ['tax', 'list', rest],
    queryFn: async () => {
      const response = await getTaxes(rest.page ?? 1, rest.perPage ?? 100, rest.search ?? '');
      // Map it to the shape expected by UnitTransactionForm.
      // The components expect `data` to be an array of taxes
      return {
        data: response.data.data,
        meta: {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total,
          per_page: response.data.per_page,
        }
      };
    },
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useTaxDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['tax', 'detail', id],
    queryFn: async () => {
      const response = await getTaxDetail(id as number);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TaxPayload) => {
      const response = await createTax({ code: payload.code, name: payload.name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax'] });
    },
  });
}

export function useUpdateTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string | number; payload: TaxPayload }) => {
      const response = await updateTax(id as number, { code: payload.code, name: payload.name });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tax'] });
      queryClient.invalidateQueries({ queryKey: ['tax', 'detail', variables.id] });
    },
  });
}

export function useDeleteTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await deleteTax(id as number);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax'] });
    },
  });
}

export function useTaxDefault(code: string | null) {
  return useQuery({
    queryKey: ['tax', 'default', code],
    queryFn: async () => {
      try {
        const response = await getDefaultTaxByCode(code as string);
        return response.data;
      } catch (e) {
        return null;
      }
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 5,
  });
}
