import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationParams } from '@/types/pagination.types';
import type { ArmadaListParams, ArmadaPayload } from '@/types/armada.types';
import { createArmada, deleteArmada, getArmadaById, getArmadas, importArmada, updateArmada } from '@/services/armada.service';

export function useArmadas(params: PaginationParams & ArmadaListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['armadas', rest],
    queryFn: () => getArmadas(rest),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useArmadaDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['armada', id],
    queryFn: () => getArmadaById(id as string | number),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateArmada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ArmadaPayload) => createArmada(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armadas'] });
    },
  });
}

export function useUpdateArmada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: ArmadaPayload }) => updateArmada(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['armadas'] });
      queryClient.invalidateQueries({ queryKey: ['armada', variables.id] });
    },
  });
}

export function useDeleteArmada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteArmada(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armadas'] });
    },
  });
}

export function useImportArmada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importArmada(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armadas'] });
    },
  });
}
