import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVehicleEquipments,
  getVehicleEquipmentById,
  createVehicleEquipment,
  updateVehicleEquipment,
  deleteVehicleEquipment,
} from '@/services/vehicle-equipment.service';
import type { PaginationParams } from '@/@types/pagination.types';
import type { VehicleEquipmentPayload } from '@/@types/vehicle-equipment.types';

export function useVehicleEquipments(params: PaginationParams & { search?: string } = { page: 1, perPage: 25 }) {
  return useQuery({
    queryKey: ['vehicle-equipments', params.page, params.perPage, params.search],
    queryFn: () => getVehicleEquipments(params),
  });
}

export function useVehicleEquipmentDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['vehicle-equipment', id ? String(id) : ''],
    queryFn: () => getVehicleEquipmentById(id as string | number),
    enabled: !!id,
  });
}

export function useCreateVehicleEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VehicleEquipmentPayload>) => createVehicleEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}

export function useUpdateVehicleEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<VehicleEquipmentPayload> }) =>
      updateVehicleEquipment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipment', String(variables.id)] });
    },
  });
}

export function useDeleteVehicleEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteVehicleEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}
