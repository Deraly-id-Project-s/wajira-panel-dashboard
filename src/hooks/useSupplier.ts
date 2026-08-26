import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, importSupplier, exportSupplier } from '@/services/supplier.service';
import type { SupplierPayload } from '@/types/supplier.types';
import type { PaginationParams } from '@/types/pagination.types';
import { companyQueryKeys } from '@/lib/query/company-key';

export function useSuppliers(
  paramsOrCompanyId: string | null | (PaginationParams & { search?: string; company_id?: string | number; enabled?: boolean })
) {
  const isLegacy = typeof paramsOrCompanyId === 'string' || paramsOrCompanyId === null;
  const companyId = isLegacy ? paramsOrCompanyId : paramsOrCompanyId.company_id;
  const rest = isLegacy ? { company_id: paramsOrCompanyId ?? undefined, perPage: 100 } : paramsOrCompanyId;
  const enabled = isLegacy ? !!paramsOrCompanyId : (paramsOrCompanyId.enabled ?? true);

  return useQuery({
    queryKey: companyId ? companyQueryKeys.list(companyId, 'suppliers', rest as any) : ['suppliers', 'unscoped', rest],
    queryFn: () => getSuppliers(rest),
    placeholderData: (previous) => previous,
    enabled: enabled && Boolean(companyId),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SupplierPayload) => createSupplier(payload),
    onSuccess: (_data, variables) => {
      if (variables.companyId !== undefined && variables.companyId !== null) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('suppliers'),
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: SupplierPayload }) => updateSupplier(id, payload),
    onSuccess: (_data, variables) => {
      if (variables.payload.companyId !== undefined && variables.payload.companyId !== null) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.payload.companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('suppliers'),
      });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string | number; companyId?: string | number }) => deleteSupplier(id),
    onSuccess: (_data, variables) => {
      if (variables.companyId !== undefined && variables.companyId !== null) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) });
        return;
      }

      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('suppliers'),
      });
    },
  });
}

export function useImportSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: string | number; file: File }) => importSupplier(file, companyId),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: companyQueryKeys.companyScope(variables.companyId) }),
  });
}

export function useExportSupplier() {
  return useMutation({
    mutationFn: (companyId: string | number) => exportSupplier(companyId),
  });
}

