import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DriverCashAdvanceApprovalPayload,
  DriverCashAdvanceListParams,
  DriverCashAdvancePayload,
} from '@/@types/driver-cash-advance.types';
import {
  approveDriverCashAdvance,
  createDriverCashAdvance,
  deleteDriverCashAdvance,
  getDriverCashAdvanceById,
  getDriverCashAdvances,
  updateDriverCashAdvance,
} from '@/services/driver-cash-advance.service';

const DRIVER_CASH_ADVANCE_KEY = 'driver-cash-advance';

export const driverCashAdvanceKeys = {
  all: [DRIVER_CASH_ADVANCE_KEY] as const,
  list: (params: DriverCashAdvanceListParams) => [DRIVER_CASH_ADVANCE_KEY, 'list', params] as const,
  detail: (id: string | number | null) => [DRIVER_CASH_ADVANCE_KEY, 'detail', id] as const,
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
