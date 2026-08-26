import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateUnitTransactionItemPayload,
  UpdateUnitTransactionItemPayload,
} from '@/types/unit-transaction.types';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';
import { unitTransactionItemService } from '@/services/unitTransactionItem.service';

export const usePurchaseUnitItems = (purchaseId?: string) => {
  return useQuery({
    queryKey: ['purchase-unit-items', purchaseId],
    queryFn: () => unitTransactionItemService.getItems(purchaseId as string, { type: 'purchase' }),
    enabled: !!purchaseId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useSalesUnitItems = (salesId?: string) => {
  return useQuery({
    queryKey: ['sales-unit-items', salesId],
    queryFn: () => unitTransactionItemService.getItems(salesId as string, { type: 'sales' }),
    enabled: !!salesId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useSalesItemsByWarehouse = (warehouseId?: string | number) => {
  return useQuery({
    queryKey: ['sales-unit-items-by-warehouse', warehouseId],
    queryFn: () => unitTransactionItemService.getSalesItemsByWarehouse(String(warehouseId)),
    enabled: warehouseId !== undefined && warehouseId !== null && String(warehouseId).length > 0,
    staleTime: 1000 * 60,
  });
};

export const useCreateUnitItem = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (payload: CreateUnitTransactionItemPayload) => unitTransactionItemService.createItem(payload),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-items', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['sales-unit-items', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction', data.unit_transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
    },
  });
};

export const useUpdateUnitItem = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUnitTransactionItemPayload }) => unitTransactionItemService.updateItem(id, payload),
    onSuccess: (data, variables) => {
      const transactionId = String(data.unit_transaction_id ?? variables.payload.unit_transaction_id ?? '');

      if (transactionId) {
        if (companyId) {
          queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
        }
        queryClient.invalidateQueries({ queryKey: ['purchase-unit-items', transactionId] });
        queryClient.invalidateQueries({ queryKey: ['purchase-by-id', transactionId] });
        queryClient.invalidateQueries({ queryKey: ['unit-transaction', transactionId] });
        queryClient.invalidateQueries({ queryKey: ['sales-transaction', transactionId] });
        queryClient.invalidateQueries({ queryKey: ['sales-unit-items', transactionId] });
      }

      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
    },
  });
};

export const useDeleteUnitItem = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ id, purchaseId }: { id: string; purchaseId: string }) => unitTransactionItemService.deleteItem(id).then(() => ({ purchaseId })),
    onSuccess: ({ purchaseId }) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-items', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['sales-unit-items', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
    },
  });
};

export const useBulkDeleteUnitItem = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ ids, purchaseId }: { ids: string[]; purchaseId: string }) => unitTransactionItemService.bulkDelete(ids).then(() => ({ purchaseId })),
    onSuccess: ({ purchaseId }) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-items', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['sales-unit-items', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
    },
  });
};
