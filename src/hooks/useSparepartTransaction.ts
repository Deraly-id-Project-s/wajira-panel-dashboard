import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sparepartTransactionService } from '@/services/sparepart-transaction.service';
import { PaginationParams } from '@/types/pagination.types';
import {
  CreateSparepartTransactionPayload,
  UpdateSparepartTransactionPayload,
  CreateSparepartTransactionBillingHistoryPayload,
  UpdateSparepartTransactionBillingHistoryPayload,
} from '@/types/sparepart-transaction.types';

export const sparepartTransactionKeys = {
  all: ['sparepart-transactions'] as const,
  lists: () => [...sparepartTransactionKeys.all, 'list'] as const,
  list: (params: any) => [...sparepartTransactionKeys.lists(), params] as const,
  details: () => [...sparepartTransactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sparepartTransactionKeys.details(), id] as const,

  billingAll: ['sparepart-transaction-billings'] as const,
  billingLists: () => [...sparepartTransactionKeys.billingAll, 'list'] as const,
  billingList: (params: any) => [...sparepartTransactionKeys.billingLists(), params] as const,
};

// --- Sparepart Transactions ---

export function useSparepartTransactions(
  params: PaginationParams & {
    warehouse_id?: number | string;
    is_refunded?: boolean;
    code?: string;
    type?: 'purchase' | 'sales';
    person_id?: number | string;
    sparepart_id?: number | string;
    billing_type?: 'cash' | 'credit';
    company_id?: number | string | null;
    start_date?: string | null;
    end_date?: string | null;
  }
) {
  return useQuery({
    queryKey: sparepartTransactionKeys.list(params),
    queryFn: () => sparepartTransactionService.getSparepartTransactions({
      ...params,
      company_id: params.company_id ?? undefined
    }),
    placeholderData: (previousData) => previousData,
  });
}

export function useSparepartTransaction(id: string, enabled = true) {
  return useQuery({
    queryKey: sparepartTransactionKeys.detail(id),
    queryFn: () => sparepartTransactionService.getSparepartTransactionById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateSparepartTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSparepartTransactionPayload) =>
      sparepartTransactionService.createSparepartTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.lists() });
    },
  });
}

export function useUpdateSparepartTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSparepartTransactionPayload }) =>
      sparepartTransactionService.updateSparepartTransaction(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.detail(variables.id) });
    },
  });
}

export function useDeleteSparepartTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sparepartTransactionService.deleteSparepartTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.lists() });
    },
  });
}

export function useUpdateSparepartTransactionBillingPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billingId, is_paid }: { billingId: string; is_paid: boolean }) =>
      sparepartTransactionService.updateBillingPaymentStatus(billingId, is_paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.details() });
    },
  });
}

// --- Billing Histories ---

export function useSparepartTransactionBillingHistories(
  params: PaginationParams & { sparepart_transaction_billing_id?: number | string }
) {
  return useQuery({
    queryKey: sparepartTransactionKeys.billingList(params),
    queryFn: () => sparepartTransactionService.getBillingHistories(params),
    enabled: !!params.sparepart_transaction_billing_id,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateSparepartTransactionBillingHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSparepartTransactionBillingHistoryPayload) =>
      sparepartTransactionService.createBillingHistory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.billingLists() });
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.details() }); // Refresh detail to update remaining payment
    },
  });
}

export function useUpdateSparepartTransactionBillingHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSparepartTransactionBillingHistoryPayload }) =>
      sparepartTransactionService.updateBillingHistory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.billingLists() });
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.details() });
    },
  });
}

export function useDeleteSparepartTransactionBillingHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sparepartTransactionService.deleteBillingHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.billingLists() });
      queryClient.invalidateQueries({ queryKey: sparepartTransactionKeys.details() });
    },
  });
}
