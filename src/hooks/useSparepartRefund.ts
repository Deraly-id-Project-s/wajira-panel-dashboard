import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sparepartRefundService } from '@/services/sparepart-refund.service';
import type {
  CreateSparepartRefundPaymentPayload,
  CreateSparepartRefundPayload,
  UpdateSparepartRefundPaymentPayload,
  UpdateSparepartRefundPayload,
} from '@/@types/sparepart-refund.types';

export const sparepartRefundKeys = {
  all: ['sparepart-refunds'] as const,
  list: (params: unknown) => [...sparepartRefundKeys.all, 'list', params] as const,
  detail: (id: string) => [...sparepartRefundKeys.all, 'detail', id] as const,
};

export const useSparepartRefunds = (params: { page?: number; perPage?: number; search?: string; type?: string } = {}) =>
  useQuery({
    queryKey: sparepartRefundKeys.list(params),
    queryFn: () => sparepartRefundService.list(params),
    placeholderData: (previous) => previous,
  });

export const useSparepartRefund = (id?: string) =>
  useQuery({
    queryKey: sparepartRefundKeys.detail(id || ''),
    queryFn: () => sparepartRefundService.detail(id as string),
    enabled: Boolean(id),
  });

const invalidate = (queryClient: ReturnType<typeof useQueryClient>, id?: string) => {
  queryClient.invalidateQueries({ queryKey: sparepartRefundKeys.all });
  if (id) queryClient.invalidateQueries({ queryKey: sparepartRefundKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: ['sparepart-transactions'] });
};

export const useCreateSparepartRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: CreateSparepartRefundPayload) => sparepartRefundService.create(payload), onSuccess: () => invalidate(queryClient) });
};

export const useUpdateSparepartRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: UpdateSparepartRefundPayload }) => sparepartRefundService.update(id, payload), onSuccess: (_, variables) => invalidate(queryClient, variables.id) });
};

export const useDeleteSparepartRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => sparepartRefundService.remove(id), onSuccess: () => invalidate(queryClient) });
};

export const useCreateSparepartRefundPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: CreateSparepartRefundPaymentPayload) => sparepartRefundService.createPayment(payload), onSuccess: (_, variables) => invalidate(queryClient, variables.sparepart_transaction_refund_id) });
};

export const useUpdateSparepartRefundPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: UpdateSparepartRefundPaymentPayload }) => sparepartRefundService.updatePayment(id, payload), onSuccess: () => invalidate(queryClient) });
};

export const useDeleteSparepartRefundPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => sparepartRefundService.removePayment(id), onSuccess: () => invalidate(queryClient) });
};
