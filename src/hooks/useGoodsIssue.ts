import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GoodsIssueBillingPayload,
  GoodsIssueItemPayload,
  GoodsIssuePayload,
  GoodsIssuePaymentPayload,
  GoodsIssueUploadInvoicePayload,
} from '@/types/goods-issue.types';
import type { PaginationParams } from '@/types/pagination.types';
import {
  createGoodsIssue,
  createGoodsIssueBilling,
  createGoodsIssueItem,
  createGoodsIssuePayment,
  deleteGoodsIssue,
  deleteGoodsIssueItem,
  getGoodsIssueById,
  getGoodsIssues,
  updateGoodsIssue,
  updateGoodsIssueItem,
  uploadGoodsIssueInvoice,
} from '@/services/goods-issue.service';

export const goodsIssueKeys = {
  all: ['goods-issues'] as const,
  list: (params: unknown) => [...goodsIssueKeys.all, 'list', params] as const,
  detail: (id: number | string | undefined) => [...goodsIssueKeys.all, 'detail', id] as const,
};

const invalidateStockMaterialQueries = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: ['warehouse-stock-material'] });

export const useGoodsIssues = (
  params: PaginationParams & {
    companyId?: number | string;
    customer_name?: string;
    code?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
    enabled?: boolean;
  },
) => {
  const { enabled = true, ...rest } = params;
  return useQuery({
    queryKey: goodsIssueKeys.list(rest),
    queryFn: () => getGoodsIssues(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
};

export const useGoodsIssue = (id: number | string | undefined) =>
  useQuery({
    queryKey: goodsIssueKeys.detail(id),
    queryFn: () => getGoodsIssueById(id!),
    enabled: !!id,
  });

export const useCreateGoodsIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsIssuePayload) => createGoodsIssue(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useUpdateGoodsIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsIssuePayload }) => updateGoodsIssue(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueKeys.detail(variables.id) });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useDeleteGoodsIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteGoodsIssue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useCreateGoodsIssueItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsIssueItemPayload) => createGoodsIssueItem(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueKeys.detail(variables.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: ['materials'] });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useUpdateGoodsIssueItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsIssueItemPayload }) => updateGoodsIssueItem(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueKeys.detail(variables.payload.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: ['materials'] });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useDeleteGoodsIssueItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; goodsTransactionId: number | string }) => deleteGoodsIssueItem(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueKeys.detail(variables.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: ['materials'] });
      invalidateStockMaterialQueries(qc);
    },
  });
};

export const useCreateGoodsIssueBilling = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsIssueBillingPayload) => createGoodsIssueBilling(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueKeys.detail(variables.goodsTransactionId) });
    },
  });
};

export const useCreateGoodsIssuePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsIssuePaymentPayload) => createGoodsIssuePayment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsIssueKeys.all }),
  });
};

export const useUploadGoodsIssueInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsIssueUploadInvoicePayload }) => uploadGoodsIssueInvoice(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueKeys.detail(variables.id) });
    },
  });
};
