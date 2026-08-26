import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationParams } from '@/types/pagination.types';
import type {
  BBNBillBillingItemPayload,
  BBNBillBillingPayload,
  BBNBillPayload,
  BBNBillVehicleFeePayload,
} from '@/types/bbn-bill.types';
import {
  createBBNBill,
  createBBNBillBilling,
  createBBNBillBillingItem,
  deleteBBNBill,
  deleteBBNBillBilling,
  deleteBBNBillBillingItem,
  getBBNBillBillingDetail,
  getBBNBillBillingItems,
  getBBNBillBillings,
  getBBNBillDetail,
  getBBNBills,
  updateBBNBill,
  updateBBNBillBillingItem,
  updateBBNBillVehicleData,
} from '@/services/bbn-bill.service';

export const bbnBillKeys = {
  list: (params: PaginationParams) => ['bbn-bill', params.page ?? 1, params.perPage ?? 10, 'created_at', 'asc'] as const,
  detail: (id: string | number | null) => ['bbn-bill-detail', id] as const,
  billings: () => ['bbn-bill-billing'] as const,
  billingDetail: (id: string | number | null) => ['bbn-bill-billing-detail', id] as const,
  billingItems: () => ['bbn-bill-billing-item'] as const,
};

export function useBBNBillList(params: PaginationParams & { search?: string }) {
  return useQuery({
    queryKey: bbnBillKeys.list(params),
    queryFn: () => getBBNBills(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useBBNBillDetail(id: string | number | null) {
  return useQuery({
    queryKey: bbnBillKeys.detail(id),
    queryFn: () => getBBNBillDetail(id as string | number),
    enabled: !!id,
  });
}

export function useCreateBBNBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BBNBillPayload) => createBBNBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
    },
  });
}

export function useUpdateBBNBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: BBNBillPayload }) => updateBBNBill(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail', variables.id] });
    },
  });
}

export function useDeleteBBNBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteBBNBill(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail', id] });
    },
  });
}

export function useUpdateBBNBillVehicleData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleRegistrationId, payload }: { vehicleRegistrationId: string | number; payload: BBNBillVehicleFeePayload }) =>
      updateBBNBillVehicleData(vehicleRegistrationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
    },
  });
}

export function useBBNBillBillings(params: PaginationParams & { search?: string }) {
  return useQuery({
    queryKey: bbnBillKeys.billings(),
    queryFn: () => getBBNBillBillings(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useBBNBillBillingDetail(id: string | number | null) {
  return useQuery({
    queryKey: bbnBillKeys.billingDetail(id),
    queryFn: () => getBBNBillBillingDetail(id as string | number),
    enabled: !!id,
  });
}

export function useCreateBBNBillBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BBNBillBillingPayload) => createBBNBillBilling(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
    },
  });
}

export function useDeleteBBNBillBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteBBNBillBilling(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
    },
  });
}

export function useBBNBillBillingItems(params: PaginationParams & { search?: string }) {
  return useQuery({
    queryKey: bbnBillKeys.billingItems(),
    queryFn: () => getBBNBillBillingItems(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateBBNBillBillingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BBNBillBillingItemPayload) => createBBNBillBillingItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing-item'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
    },
  });
}

export function useUpdateBBNBillBillingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: BBNBillBillingItemPayload }) => updateBBNBillBillingItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing-item'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
    },
  });
}

export function useDeleteBBNBillBillingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteBBNBillBillingItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-detail'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill-billing-item'] });
      queryClient.invalidateQueries({ queryKey: ['bbn-bill'] });
    },
  });
}
