import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomerById, getCustomers, createCustomer, updateCustomer, deleteCustomer, importCustomer, exportCustomer } from '@/services/customer.service';
import { CustomerPayload } from '@/types/customer.types';
import type { PaginationParams } from '@/types/pagination.types';
import { companyQueryKeys } from '@/lib/query/company-key';

export function useCustomers(params: PaginationParams & { search?: string; company_id?: string | number; enabled?: boolean }) {
  const { enabled = true, ...rest } = params;
  const companyId = rest.company_id;

  return useQuery({
    queryKey: companyId ? companyQueryKeys.list(companyId, 'customers', rest) : ['customers', 'unscoped', rest],
    queryFn: () => getCustomers(rest),
    placeholderData: (previous) => previous,
    enabled: enabled && Boolean(companyId),
  });
}

export function useCustomer(id: string | number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerById(id!),
    enabled: enabled && !!id,
    retry: false,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CustomerPayload) => createCustomer(payload),
    onSuccess: (_data, variables) => {
      if (variables.companyId !== undefined && variables.companyId !== null) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('customers'),
      });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: CustomerPayload }) => updateCustomer(id, payload),
    onSuccess: (_data, variables) => {
      if (variables.payload.companyId !== undefined && variables.payload.companyId !== null) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.payload.companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('customers'),
      });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string | number; companyId?: string | number }) => deleteCustomer(id),
    onSuccess: (_data, variables) => {
      if (variables.companyId !== undefined && variables.companyId !== null) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('customers'),
      });
    },
  });
}

export function useImportCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: string | number; file: File }) => importCustomer(file, companyId),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) }),
  });
}

export function useExportCustomer() {
  return useMutation({
    mutationFn: (companyId: string | number) => exportCustomer(companyId),
  });
}
