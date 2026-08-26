import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateUnitItemDetailPayload, UpdateUnitItemDetailPayload } from '@/types/unit-transaction.types';
import { unitItemDetailService } from '@/services/unitItemDetail.service';

export const useUnitTransactionItemById = (unitItemId?: string) => {
  const isValidId = !!unitItemId && unitItemId !== 'unit' && unitItemId !== 'undefined' && unitItemId !== 'null' && unitItemId.trim() !== '';
  return useQuery({
    queryKey: ['unit-transaction-item', unitItemId],
    queryFn: () => unitItemDetailService.getUnitTransactionItemById(unitItemId as string),
    enabled: isValidId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useUnitItemDetails = (unitItemId?: string) => {
  const isValidId = !!unitItemId && unitItemId !== 'unit' && unitItemId !== 'undefined' && unitItemId !== 'null' && unitItemId.trim() !== '';
  return useQuery({
    queryKey: ['unit-item-details', unitItemId],
    queryFn: () => unitItemDetailService.getDetails(unitItemId as string),
    enabled: isValidId,
    staleTime: 1000 * 60,
  });
};

/** Fetch ALL unit item details for every item in a given purchase transaction. */
export const useUnitItemDetailsByTransactionId = (purchaseId?: string) => {
  const isValidId = !!purchaseId && purchaseId !== 'unit' && purchaseId !== 'undefined' && purchaseId !== 'null' && purchaseId.trim() !== '';
  return useQuery({
    queryKey: ['unit-item-details-by-transaction', purchaseId],
    queryFn: () => unitItemDetailService.getDetailsByTransactionId(purchaseId as string),
    enabled: isValidId,
    staleTime: 1000 * 60,
  });
};

export const useCreateUnitItemDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitItemDetailPayload) => unitItemDetailService.createDetail(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unit-item-details', data.unit_transaction_item_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item', data.unit_transaction_item_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details-by-transaction'] });
    },
  });
};

export const useUpdateUnitItemDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUnitItemDetailPayload }) => unitItemDetailService.updateDetail(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unit-item-details', data.unit_transaction_item_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item', data.unit_transaction_item_id] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details-by-transaction'] });
    },
  });
};

export const useDeleteUnitItemDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, unitItemId }: { id: string; unitItemId: string }) => unitItemDetailService.deleteDetail(id).then(() => ({ unitItemId })),
    onSuccess: ({ unitItemId }) => {
      queryClient.invalidateQueries({ queryKey: ['unit-item-details', unitItemId] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item', unitItemId] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details-by-transaction'] });
    },
  });
};

export const useImportUnitItemDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unitItemId, file }: { unitItemId: string; file: File }) => unitItemDetailService.importDetails(unitItemId, file).then(() => ({ unitItemId })),
    onSuccess: ({ unitItemId }) => {
      queryClient.invalidateQueries({ queryKey: ['unit-item-details', unitItemId] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item', unitItemId] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details-by-transaction'] });
    },
  });
};

export const useBulkDeleteUnitItemDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unitItemId, ids }: { unitItemId: string | number; ids: Array<string | number> }) =>
      unitItemDetailService.bulkDeleteDetails(unitItemId, ids).then(() => ({ unitItemId })),
    onSuccess: ({ unitItemId }) => {
      queryClient.invalidateQueries({ queryKey: ['unit-item-details', String(unitItemId)] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item', String(unitItemId)] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details-by-transaction'] });
    },
  });
};

export const useWarehouseSubBlocks = (params: { is_active?: boolean; per_page?: number } = {}) => {
  return useQuery({
    queryKey: ['warehouse-sub-blocks', params],
    queryFn: () => import('@/services/warehouseSubBlock.service').then(m => m.getWarehouseSubBlocks(params)),
  });
};

export const useBulkUpdateUnitItemDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      unit_transaction_item_details_ids: number[];
      stock_state: string;
      transaction_type?: string | null;
      refund_activity?: boolean | null;
      warehouse_sub_block_id?: number | null;
    }) => unitItemDetailService.bulkUpdateState(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-item-details'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item'] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details-by-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-activities'] });
      queryClient.invalidateQueries({ queryKey: ['refund_activity'] });
      queryClient.invalidateQueries({ queryKey: ['transaction_type'] });
    },
  });
};
