import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSparepart, createSparepartCategory, deleteSparepart, getSparepartCategories, getSpareparts, importSparepart, updateSparepart } from '@/services/sparepart.service';
import type { SparepartPayload } from '@/@types/sparepart.types';
import type { PaginationParams } from '@/@types/pagination.types';

export function useSpareparts(
  paramsOrCompanyId?: (PaginationParams & { company_id?: string | number; enabled?: boolean }) | string | number
) {
  const params =
    typeof paramsOrCompanyId === 'object' && paramsOrCompanyId !== null
      ? paramsOrCompanyId
      : { company_id: paramsOrCompanyId };

  const { enabled = true, ...restParams } = params;

  return useQuery({
    queryKey: ['spareparts', restParams],
    queryFn: () => getSpareparts(restParams),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useSparepartCategories() {
  return useQuery({
    queryKey: ['sparepart-categories'],
    queryFn: getSparepartCategories,
  });
}

export function useCreateSparepartCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSparepartCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparepart-categories'] }),
  });
}

export function useCreateSparepart(companyId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SparepartPayload) => createSparepart(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spareparts', companyId] }),
  });
}

export function useUpdateSparepart(companyId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: SparepartPayload }) => updateSparepart(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spareparts', companyId] }),
  });
}

export function useDeleteSparepart(companyId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteSparepart(id, companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spareparts', companyId] }),
  });
}

export function useImportSparepart(companyId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file }: { file: File }) => importSparepart(file, companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spareparts', companyId] }),
  });
}
