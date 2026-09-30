import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationParams } from '@/@types/pagination.types';
import type {
  CreateVehicleEquipmentBillingHistoryPayload,
  CreateVehicleEquipmentTransactionPayload,
  UpdateVehicleEquipmentBillingHistoryPayload,
  UpdateVehicleEquipmentTransactionPayload,
} from '@/@types/vehicle-equipment-transaction.types';
import { vehicleEquipmentTransactionService } from '@/services/vehicle-equipment-transaction.service';

export const vehicleEquipmentTransactionKeys = {
  all: ['vehicle-equipment-transactions'] as const,
  lists: () => [...vehicleEquipmentTransactionKeys.all, 'list'] as const,
  list: (params: unknown) => [...vehicleEquipmentTransactionKeys.lists(), params] as const,
  details: () => [...vehicleEquipmentTransactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleEquipmentTransactionKeys.details(), id] as const,
  billingAll: ['vehicle-equipment-transaction-billings'] as const,
  billingLists: () => [...vehicleEquipmentTransactionKeys.billingAll, 'list'] as const,
  billingList: (params: unknown) => [...vehicleEquipmentTransactionKeys.billingLists(), params] as const,
};

export function useVehicleEquipmentTransactions(
  params: PaginationParams & {
    warehouse_id?: number | string;
    is_refunded?: boolean;
    code?: string;
    type?: 'purchase' | 'sales';
    person_id?: number | string;
    vehicle_equipment_id?: number | string;
    billing_type?: string;
    company_id?: number | string | null;
    start_date?: string | null;
    end_date?: string | null;
  },
) {
  return useQuery({
    queryKey: vehicleEquipmentTransactionKeys.list(params),
    queryFn: () => vehicleEquipmentTransactionService.getTransactions({
      ...params,
      company_id: params.company_id ?? undefined,
    }),
    placeholderData: (previousData) => previousData,
  });
}

export function useVehicleEquipmentTransaction(id: string, enabled = true) {
  return useQuery({
    queryKey: vehicleEquipmentTransactionKeys.detail(id),
    queryFn: () => vehicleEquipmentTransactionService.getTransactionById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateVehicleEquipmentTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVehicleEquipmentTransactionPayload) =>
      vehicleEquipmentTransactionService.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.lists() });
    },
  });
}

export function useUpdateVehicleEquipmentTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVehicleEquipmentTransactionPayload }) =>
      vehicleEquipmentTransactionService.updateTransaction(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.detail(variables.id) });
    },
  });
}

export function useDeleteVehicleEquipmentTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleEquipmentTransactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.lists() });
    },
  });
}

export function useUpdateVehicleEquipmentBillingPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billingId, is_paid }: { billingId: string; is_paid: boolean }) =>
      vehicleEquipmentTransactionService.updateBillingPaymentStatus(billingId, is_paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.details() });
    },
  });
}

export function useVehicleEquipmentBillingHistories(
  params: PaginationParams & { goods_transaction_billing_id?: number | string },
) {
  return useQuery({
    queryKey: vehicleEquipmentTransactionKeys.billingList(params),
    queryFn: () => vehicleEquipmentTransactionService.getBillingHistories(params),
    enabled: !!params.goods_transaction_billing_id,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateVehicleEquipmentBillingHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVehicleEquipmentBillingHistoryPayload) =>
      vehicleEquipmentTransactionService.createBillingHistory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.billingLists() });
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.details() });
    },
  });
}

export function useUpdateVehicleEquipmentBillingHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVehicleEquipmentBillingHistoryPayload }) =>
      vehicleEquipmentTransactionService.updateBillingHistory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.billingLists() });
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.details() });
    },
  });
}

export function useDeleteVehicleEquipmentBillingHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleEquipmentTransactionService.deleteBillingHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.billingLists() });
      queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.details() });
    },
  });
}
