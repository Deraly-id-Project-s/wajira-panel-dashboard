import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GoodsReceiptBillingPayload,
  GoodsReceiptItemPayload,
  GoodsReceiptPayload,
  GoodsReceiptPaymentPayload,
  GoodsReceiptUploadInvoicePayload,
} from '@/types/goods-receipt.types';
import type { PaginationParams } from '@/types/pagination.types';
import {
  createGoodsReceipt,
  createGoodsReceiptBilling,
  createGoodsReceiptItem,
  createGoodsReceiptPayment,
  deleteGoodsReceipt,
  deleteGoodsReceiptItem,
  getGoodsReceiptById,
  getGoodsReceipts,
  updateGoodsReceipt,
  updateGoodsReceiptItem,
  uploadGoodsReceiptInvoice,
} from '@/services/goods-receipt.service';

export const goodsReceiptKeys = {
  all: ['goods-receipts'] as const,
  list: (params: unknown) => [...goodsReceiptKeys.all, 'list', params] as const,
  detail: (id: number | string | undefined) => [...goodsReceiptKeys.all, 'detail', id] as const,
};

const invalidateStockMaterialQueries = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: ['warehouse-stock-material'] });

export const useGoodsReceipts = (
  params: PaginationParams & {
    companyId?: number | string;
    supplier_name?: string;
    code?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
    enabled?: boolean;
  },
) => {
  const { enabled = true, ...rest } = params;
  return useQuery({
    queryKey: goodsReceiptKeys.list(rest),
    queryFn: () => getGoodsReceipts(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
};

export const useGoodsReceipt = (id: number | string | undefined) =>
  useQuery({
    queryKey: goodsReceiptKeys.detail(id),
    queryFn: () => getGoodsReceiptById(id!),
    enabled: !!id,
  });

export const useCreateGoodsReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsReceiptPayload) => createGoodsReceipt(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useUpdateGoodsReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsReceiptPayload }) => updateGoodsReceipt(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.id) });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useDeleteGoodsReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteGoodsReceipt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useCreateGoodsReceiptItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsReceiptItemPayload) => createGoodsReceiptItem(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.goodsTransactionId) });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useUpdateGoodsReceiptItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsReceiptItemPayload }) => updateGoodsReceiptItem(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.payload.goodsTransactionId) });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useDeleteGoodsReceiptItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; goodsTransactionId: number | string }) => deleteGoodsReceiptItem(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.goodsTransactionId) });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useCreateGoodsReceiptBilling = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsReceiptBillingPayload) => createGoodsReceiptBilling(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.goodsTransactionId) });
    },
  });
};

export const useCreateGoodsReceiptPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsReceiptPaymentPayload) => createGoodsReceiptPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
    },
  });
};

export const useUploadGoodsReceiptInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsReceiptUploadInvoicePayload }) => uploadGoodsReceiptInvoice(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.id) });
    },
  });
};
