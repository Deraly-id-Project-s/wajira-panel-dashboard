import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSparepart, createSparepartCategory, deleteSparepart, getSparepartCategories, getSpareparts, importSparepart, updateSparepart } from '@/services/sparepart.service';
import type { SparepartPayload } from '@/types/sparepart.types';

export function useSpareparts(companyId?: string | number) {
  return useQuery({
    queryKey: ['spareparts', companyId],
    queryFn: () => getSpareparts(companyId),
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
