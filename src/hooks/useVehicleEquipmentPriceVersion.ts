import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VehicleEquipmentPriceVersionFilterParams } from '@/@types/vehicle-equipment-price-version.types';
import {
  createVehicleEquipmentPriceVersion,
  deleteVehicleEquipmentPriceVersion,
  getVehicleEquipmentPriceVersions,
  updateVehicleEquipmentPriceVersion,
} from '@/services/vehicle-equipment-price-version.service';

const PRICE_VERSION_KEY = 'vehicle-equipment-price-version';

export const vehicleEquipmentPriceVersionKeys = {
  all: [PRICE_VERSION_KEY] as const,
  list: (equipmentId: number | string, params: Omit<VehicleEquipmentPriceVersionFilterParams, 'vehicle_equipment_id'>) =>
    [PRICE_VERSION_KEY, 'list', equipmentId, params] as const,
};

export function useVehicleEquipmentPriceVersions(
  equipmentId: number | string,
  params: Omit<VehicleEquipmentPriceVersionFilterParams, 'vehicle_equipment_id'>,
) {
  return useQuery({
    queryKey: vehicleEquipmentPriceVersionKeys.list(equipmentId, params),
    queryFn: () => getVehicleEquipmentPriceVersions({ vehicle_equipment_id: equipmentId, ...params }),
    placeholderData: keepPreviousData,
    enabled: !!equipmentId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVehicleEquipmentPriceVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicleEquipmentPriceVersion,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipment', String(variables.vehicle_equipment_id)] });
    },
  });
}

export function useUpdateVehicleEquipmentPriceVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Parameters<typeof updateVehicleEquipmentPriceVersion>[1] }) =>
      updateVehicleEquipmentPriceVersion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipment', String(variables.data.vehicle_equipment_id)] });
    },
  });
}

export function useDeleteVehicleEquipmentPriceVersion(equipmentId?: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicleEquipmentPriceVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRICE_VERSION_KEY] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipments'] });
      if (equipmentId) queryClient.invalidateQueries({ queryKey: ['vehicle-equipment', String(equipmentId)] });
    },
  });
}
