import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MaterialTransactionBillingPayload,
  MaterialTransactionItemPayload,
  MaterialTransactionPayload,
} from '@/types/material-transaction.types';
import type { PaginationParams } from '@/types/pagination.types';
import {
  createMaterialTransaction,
  createMaterialTransactionBilling,
  createMaterialTransactionItem,
  deleteMaterialTransaction,
  deleteMaterialTransactionItem,
  getMaterialTransactionById,
  getMaterialTransactionBillings,
  getMaterialTransactionItemById,
  getMaterialTransactionItems,
  getMaterialTransactions,
  updateMaterialTransaction,
  updateMaterialTransactionItem,
  uploadMaterialTransactionInvoice,
} from '@/services/material-transaction.service';

export const materialTransactionKeys = {
  all: ['material-transactions'] as const,
  list: (params: unknown) => [...materialTransactionKeys.all, 'list', params] as const,
  detail: (id: number | string | undefined) => [...materialTransactionKeys.all, 'detail', id] as const,
  items: (params: unknown) => [...materialTransactionKeys.all, 'items', params] as const,
  item: (id: number | string | undefined) => [...materialTransactionKeys.all, 'item', id] as const,
  billings: (params: unknown) => [...materialTransactionKeys.all, 'billings', params] as const,
  invoice: (id: number | string | undefined) => [...materialTransactionKeys.all, 'invoice', id] as const,
};

export const useMaterialTransactions = (
  params: PaginationParams & {
    search?: string;
    type?: 'purchase' | 'sales';
    supplier_name?: string;
    code?: string;
    enabled?: boolean;
  },
) => {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: materialTransactionKeys.list(rest),
    queryFn: () => getMaterialTransactions(rest),
    placeholderData: (previous) => previous,
    enabled,
  });
};

export const useMaterialTransaction = (id: number | string | undefined) =>
  useQuery({
    queryKey: materialTransactionKeys.detail(id),
    queryFn: () => getMaterialTransactionById(id!),
    enabled: !!id,
  });

export const useCreateMaterialTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MaterialTransactionPayload) => createMaterialTransaction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
    },
  });
};

export const useUpdateMaterialTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Omit<MaterialTransactionPayload, 'type'> }) => updateMaterialTransaction(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.detail(variables.id) });
    },
  });
};

export const useDeleteMaterialTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteMaterialTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
    },
  });
};

export const useMaterialTransactionItems = (
  params: PaginationParams & {
    search?: string;
    type?: 'purchase' | 'sales';
    materialTransactionId?: number | string;
    materialId?: number | string;
    inStock?: boolean;
    isForecast?: boolean;
    enabled?: boolean;
  },
) => {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: materialTransactionKeys.items(rest),
    queryFn: () => getMaterialTransactionItems(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
};

export const useMaterialTransactionItem = (id: number | string | undefined) =>
  useQuery({
    queryKey: materialTransactionKeys.item(id),
    queryFn: () => getMaterialTransactionItemById(id!),
    enabled: !!id,
  });

export const useCreateMaterialTransactionItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MaterialTransactionItemPayload) => createMaterialTransactionItem(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.detail(variables.materialTransactionId) });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.items({}) });
    },
  });
};

export const useUpdateMaterialTransactionItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: MaterialTransactionItemPayload }) => updateMaterialTransactionItem(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.detail(variables.payload.materialTransactionId) });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.items({}) });
    },
  });
};

export const useDeleteMaterialTransactionItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; materialTransactionId: number | string }) => deleteMaterialTransactionItem(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.detail(variables.materialTransactionId) });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.items({}) });
    },
  });
};

export const useMaterialTransactionBillings = (params: PaginationParams & { materialTransactionId?: number | string; enabled?: boolean }) => {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: materialTransactionKeys.billings(rest),
    queryFn: () => getMaterialTransactionBillings(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
};

export const useCreateMaterialTransactionBilling = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MaterialTransactionBillingPayload) => createMaterialTransactionBilling(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.detail(variables.materialTransactionId) });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.billings({ materialTransactionId: variables.materialTransactionId }) });
    },
  });
};

export const useUploadMaterialTransactionInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number | string; file: File }) => uploadMaterialTransactionInvoice(id, file),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: materialTransactionKeys.all });
      qc.invalidateQueries({ queryKey: materialTransactionKeys.detail(variables.id) });
    },
  });
};
