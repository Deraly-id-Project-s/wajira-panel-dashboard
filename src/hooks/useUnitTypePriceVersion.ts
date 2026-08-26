import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UnitTypePriceVersionFilterParams } from '@/types/unit-type-price-version.types';
import {
  getUnitTypePriceVersions,
  createUnitTypePriceVersion,
  updateUnitTypePriceVersion,
  deleteUnitTypePriceVersion,
} from '@/services/unitTypePriceVersion.service';

const PRICE_VERSION_KEY = 'unit-type-price-version';

export const priceVersionKeys = {
  all: [PRICE_VERSION_KEY] as const,
  list: (unitTypeId: number | string, params: Omit<UnitTypePriceVersionFilterParams, 'unit_type_id'>) =>
    [PRICE_VERSION_KEY, 'list', unitTypeId, params] as const,
};

export function useUnitTypePriceVersions(unitTypeId: number | string, params: Omit<UnitTypePriceVersionFilterParams, 'unit_type_id'>) {
  return useQuery({
    queryKey: priceVersionKeys.list(unitTypeId, params),
    queryFn: () => getUnitTypePriceVersions({ unit_type_id: unitTypeId, ...params }),
    placeholderData: keepPreviousData,
    enabled: !!unitTypeId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUnitTypePriceVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUnitTypePriceVersion,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['type-units'] });
      queryClient.invalidateQueries({ queryKey: ['type-unit', String(variables.unit_type_id)] });
      queryClient.invalidateQueries({ queryKey: ['type-unit-detail', String(variables.unit_type_id)] });
    },
  });
}

export function useUpdateUnitTypePriceVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => updateUnitTypePriceVersion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['type-units'] });
      queryClient.invalidateQueries({ queryKey: ['type-unit', String(variables.data.unit_type_id)] });
      queryClient.invalidateQueries({ queryKey: ['type-unit-detail', String(variables.data.unit_type_id)] });
    },
  });
}

export function useDeleteUnitTypePriceVersion(unitTypeId?: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUnitTypePriceVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['type-units'] });
      if (unitTypeId) {
        queryClient.invalidateQueries({ queryKey: ['type-unit', String(unitTypeId)] });
        queryClient.invalidateQueries({ queryKey: ['type-unit-detail', String(unitTypeId)] });
      }
    },
  });
}
