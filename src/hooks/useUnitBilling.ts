import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateUnitBillingHistoryPayload, CreateUnitBillingPayloadV2, UpsertUnitBillingPayload } from '@/types/unit-billing.types';
import { unitBillingService } from '@/services/unitBilling.service';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';
import { apiClient } from '@/lib/api/client';

const unitBillingKeys = {
  list: (transactionId?: string) => ['unit-billings', transactionId] as const,
  current: (transactionId?: string) => ['unit-billing-current', transactionId] as const,
  history: (billingId?: string, transactionId?: string) => ['unit-billing-history', billingId ?? '', transactionId ?? ''] as const,
};

export const useUnitBillings = (purchaseId?: string) => {
  return useQuery({
    queryKey: unitBillingKeys.list(purchaseId),
    queryFn: () => unitBillingService.getBillings(purchaseId as string),
    enabled: !!purchaseId,
    retry: false,
    staleTime: 1000 * 30,
  });
};

export const useCreateBilling = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (payload: UpsertUnitBillingPayload) => unitBillingService.createBilling(payload),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.list(data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.current(data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.history(undefined, data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-id'] });
    },
  });
};

export const useBillingValidation = (companyId?: string, purchaseId?: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['unit-billing-validation', companyId, purchaseId],
    queryFn: async () => {
      await unitBillingService.checkRightAmount(companyId as string, purchaseId as string);
      return true;
    },
    enabled: Boolean(companyId && purchaseId && (options?.enabled ?? true)),
    retry: false,
    staleTime: 1000 * 30,
  });
};

export const useCurrentBilling = (purchaseId?: string) => {
  return useQuery({
    queryKey: unitBillingKeys.current(purchaseId),
    queryFn: () => unitBillingService.getCurrentBilling(purchaseId as string),
    enabled: !!purchaseId,
    staleTime: 1000 * 30,
  });
};

export const useCreateBillingV2 = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (payload: CreateUnitBillingPayloadV2) => unitBillingService.createBillingV2(payload),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.current(data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.list(data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.history(undefined, data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-id'] });
    },
  });
};

export const useBillingHistory = (billingId?: string, purchaseId?: string) => {
  return useQuery({
    queryKey: unitBillingKeys.history(billingId, purchaseId),
    queryFn: () => unitBillingService.getBillingHistory(billingId, purchaseId),
    enabled: !!billingId || !!purchaseId,
    staleTime: 1000 * 30,
  });
};

export const useCreateBillingHistory = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (payload: CreateUnitBillingHistoryPayload) => unitBillingService.createBillingHistory(payload),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.history(data.unit_transaction_billing_id, data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.history(undefined, data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.current(data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: unitBillingKeys.list(data.unit_transaction_id) });
      queryClient.invalidateQueries({ queryKey: ['unit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-id'] });
    },
  });
};

export const useDeleteBillingHistory = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (id: string | number) => unitBillingService.deleteBillingHistory(id),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: ['unit-billing-history'] });
      queryClient.invalidateQueries({ queryKey: ['unit-billing-current'] });
      queryClient.invalidateQueries({ queryKey: ['unit-billings'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-id'] });
    },
  });
};

export const useUpdateBillingIsPaid = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async ({ billingId, isPaid = 'true' }: { billingId: string | number; isPaid?: boolean | string }) => {
      const response = await apiClient.put(
        `/wapi/transaction/unit-transaction/unit-transaction-billing/${billingId}`,
        { is_paid: isPaid }
      );
      return response.data;
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: ['unit-billing-current'] });
      queryClient.invalidateQueries({ queryKey: ['unit-billings'] });
      queryClient.invalidateQueries({ queryKey: ['unit-billing-history'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-id'] });
    },
  });
};

