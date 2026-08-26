import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationParams } from '@/types/pagination.types';
import type { VehicleDataAssignPayload, VehicleDataFilters, VehicleDataPayload } from '@/types/vehicle-data.types';
import {
  assignVehicleDataToDitlantas,
  createVehicleData,
  deleteVehicleData,
  exportVehicleData,
  getVehicleDataDetail,
  getVehicleDataList,
  getVehicleDataLookup,
  getVendorLookup,
  importVehicleData,
  updateVehicleData,
} from '@/services/vehicle-data.service';

export function useVehicleDataList(params: PaginationParams & VehicleDataFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['vehicle-data', params],
    queryFn: () => getVehicleDataList(params),
    enabled: options?.enabled,
  });
}

export function useVehicleDataDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['vehicle-data', 'detail', id],
    queryFn: () => getVehicleDataDetail(id as string | number),
    enabled: !!id,
  });
}

export function useVehicleDataLookup(search: string) {
  return useQuery({
    queryKey: ['vehicle-data', 'lookup', search],
    queryFn: () => getVehicleDataLookup(search),
  });
}

export function useVendorLookup(search: string) {
  return useQuery({
    queryKey: ['vehicle-data', 'vendor-lookup', search],
    queryFn: () => getVendorLookup(search),
  });
}

export function useCreateVehicleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<VehicleDataPayload>) => createVehicleData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-data'] });
    },
  });
}

export function useUpdateVehicleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<VehicleDataPayload> }) => updateVehicleData(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-data'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-data', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-registration'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-document'] });
    },
  });
}

export function useDeleteVehicleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteVehicleData(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-data'] });
    },
  });
}

export function useImportVehicleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importVehicleData(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-data'] });
    },
  });
}

export function useExportVehicleData() {
  return useMutation({
    mutationFn: () => exportVehicleData(),
  });
}

export function useAssignVehicleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VehicleDataAssignPayload) => assignVehicleDataToDitlantas(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-data'] });
    },
  });
}
