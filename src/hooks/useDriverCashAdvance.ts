import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApplyDriverCashAdvancePayload,
  DriverCashAdvanceApprovalPayload,
  DriverCashAdvanceBillingHistoryPayload,
  DriverCashAdvanceBillingStatusPayload,
  DriverCashAdvanceListParams,
  DriverCashAdvancePayload,
  UpdateDriverCashAdvanceClaimPayload,
} from '@/@types/driver-cash-advance.types';
import {
  applyDriverCashAdvance,
  approveDriverCashAdvance,
  createDriverCashAdvance,
  deleteDriverCashAdvanceClaim,
  deleteDriverCashAdvance,
  getDriverCashAdvanceById,
  getDriverCashAdvances,
  getDriverCashAdvanceBillingById,
  createDriverCashAdvanceBillingHistory,
  deleteDriverCashAdvanceBillingHistory,
  updateDriverCashAdvanceBillingStatus,
  updateDriverCashAdvance,
  updateDriverCashAdvanceClaim,
} from '@/services/driver-cash-advance.service';

const DRIVER_CASH_ADVANCE_KEY = 'driver-cash-advance';

export const driverCashAdvanceKeys = {
  all: [DRIVER_CASH_ADVANCE_KEY] as const,
  list: (params: DriverCashAdvanceListParams) => [DRIVER_CASH_ADVANCE_KEY, 'list', params] as const,
  detail: (id: string | number | null) => [DRIVER_CASH_ADVANCE_KEY, 'detail', id] as const,
  billing: (id: string | number | null) => [DRIVER_CASH_ADVANCE_KEY, 'billing', id] as const,
};

export function useDriverCashAdvances(params: DriverCashAdvanceListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: driverCashAdvanceKeys.list(rest),
    queryFn: () => getDriverCashAdvances(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useDriverCashAdvanceBillingDetail(id: string | number | null) {
  return useQuery({
    queryKey: driverCashAdvanceKeys.billing(id),
    queryFn: () => getDriverCashAdvanceBillingById(id as string | number),
    enabled: !!id,
    retry: 2,
  });
}

export function useCreateDriverCashAdvanceBillingHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DriverCashAdvanceBillingHistoryPayload) => createDriverCashAdvanceBillingHistory(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.billing(payload.driver_cash_advance_billing_id) });
    },
  });
}

export function useDeleteDriverCashAdvanceBillingHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteDriverCashAdvanceBillingHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
    },
  });
}

export function useUpdateDriverCashAdvanceBillingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DriverCashAdvanceBillingStatusPayload }) =>
      updateDriverCashAdvanceBillingStatus(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.billing(variables.id) });
    },
  });
}

export function useDriverCashAdvanceDetail(id: string | number | null) {
  return useQuery({
    queryKey: driverCashAdvanceKeys.detail(id),
    queryFn: () => getDriverCashAdvanceById(id as string | number),
    enabled: !!id,
    retry: 2,
  });
}

export function useCreateDriverCashAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DriverCashAdvancePayload) => createDriverCashAdvance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
    },
  });
}

export function useUpdateDriverCashAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DriverCashAdvancePayload }) => updateDriverCashAdvance(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.detail(variables.id) });
    },
  });
}

export function useDeleteDriverCashAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteDriverCashAdvance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
    },
  });
}

export function useApproveDriverCashAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DriverCashAdvanceApprovalPayload }) => approveDriverCashAdvance(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.detail(variables.id) });
    },
  });
}

export function useApplyDriverCashAdvance(expeditionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplyDriverCashAdvancePayload) => applyDriverCashAdvance(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
    },
  });
}

export function useUpdateDriverCashAdvanceClaim(expeditionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateDriverCashAdvanceClaimPayload }) =>
      updateDriverCashAdvanceClaim(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
    },
  });
}

export function useDeleteDriverCashAdvanceClaim(expeditionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteDriverCashAdvanceClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverCashAdvanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
    },
  });
}
