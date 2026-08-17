import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TarifPriceVersionFilterParams } from '@/@types/tarif-price-version.types';
import { createTarifPriceVersion, deleteTarifPriceVersion, getTarifPriceVersions, updateTarifPriceVersion } from '@/services/tarifPriceVersion.service';

const PRICE_VERSION_KEY = 'tarif-price-version';

export const tarifPriceVersionKeys = {
  all: [PRICE_VERSION_KEY] as const,
  list: (tarifId: number | string, params: Omit<TarifPriceVersionFilterParams, 'tarif_id'>) => [PRICE_VERSION_KEY, 'list', tarifId, params] as const,
};

export function useTarifPriceVersions(tarifId: number | string, params: Omit<TarifPriceVersionFilterParams, 'tarif_id'>) {
  return useQuery({
    queryKey: tarifPriceVersionKeys.list(tarifId, params),
    queryFn: () => getTarifPriceVersions({ tarif_id: tarifId, ...params }),
    placeholderData: keepPreviousData,
    enabled: !!tarifId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTarifPriceVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTarifPriceVersion,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['tarifs'] });
      queryClient.invalidateQueries({ queryKey: ['tarif', String(variables.tarif_id)] });
    },
  });
}

export function useUpdateTarifPriceVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Parameters<typeof updateTarifPriceVersion>[1] }) => updateTarifPriceVersion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['tarifs'] });
      queryClient.invalidateQueries({ queryKey: ['tarif', String(variables.data.tarif_id)] });
    },
  });
}

export function useDeleteTarifPriceVersion(tarifId?: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTarifPriceVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['tarifs'] });
      if (tarifId) queryClient.invalidateQueries({ queryKey: ['tarif', String(tarifId)] });
    },
  });
}
