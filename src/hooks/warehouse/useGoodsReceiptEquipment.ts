import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationParams } from '@/types/pagination.types';
import type {
  GoodsReceiptEquipmentPayload,
  GoodsReceiptEquipmentBillingPayload,
  GoodsReceiptEquipmentPaymentPayload,
  GoodsTransactionDetailEquipmentPayload,
} from '@/types/goods-receipt-equipment.types';
import {
  getGoodsReceiptEquipments,
  getGoodsReceiptEquipmentById,
  createGoodsReceiptEquipment,
  updateGoodsReceiptEquipment,
  deleteGoodsReceiptEquipment,
  createGoodsReceiptBilling,
  deleteGoodsReceiptBilling,
  createGoodsReceiptPayment,
  deleteGoodsReceiptPayment,
} from '@/services/warehouse/goodsReceiptEquipment.service';
import {
  createGoodsTransactionDetail,
  updateGoodsTransactionDetail,
  deleteGoodsTransactionDetail,
} from '@/services/warehouse/goodsTransactionDetail.service';
import { uploadGoodsTransactionInvoice } from '@/services/warehouse/goodsTransactionInvoice.service';

export const goodsReceiptEquipmentKeys = {
  all: ['goods-receipt-equipment'] as const,
  list: (params: unknown) => [...goodsReceiptEquipmentKeys.all, 'list', params] as const,
  detail: (id: number | string | undefined) => [...goodsReceiptEquipmentKeys.all, 'detail', id] as const,
};

export function useGoodsReceiptEquipments(
  params: PaginationParams & {
    companyId?: number | string;
    code?: string;
    supplier_name?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
    enabled?: boolean;
  },
) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: goodsReceiptEquipmentKeys.list(rest),
    queryFn: () => getGoodsReceiptEquipments(rest),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useGoodsReceiptEquipmentDetail(id: number | string | undefined) {
  return useQuery({
    queryKey: goodsReceiptEquipmentKeys.detail(id),
    queryFn: () => getGoodsReceiptEquipmentById(id!),
    enabled: !!id,
  });
}

export function useCreateGoodsReceiptEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsReceiptEquipmentPayload) => createGoodsReceiptEquipment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
    },
  });
}

export function useUpdateGoodsReceiptEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsReceiptEquipmentPayload }) =>
      updateGoodsReceiptEquipment(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.id) });
    },
  });
}

export function useDeleteGoodsReceiptEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteGoodsReceiptEquipment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
    },
  });
}

export function useCreateGoodsReceiptBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsReceiptEquipmentBillingPayload) => createGoodsReceiptBilling(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.goodsTransactionId) });
    },
  });
}

export function useDeleteGoodsReceiptBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; goodsTransactionId: number | string }) =>
      deleteGoodsReceiptBilling(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.goodsTransactionId) });
    },
  });
}

export function useCreateGoodsReceiptPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsReceiptEquipmentPaymentPayload) => createGoodsReceiptPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
    },
  });
}

export function useDeleteGoodsReceiptPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; goodsTransactionId: number | string }) =>
      deleteGoodsReceiptPayment(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.goodsTransactionId) });
    },
  });
}

export function useCreateGoodsReceiptDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsTransactionDetailEquipmentPayload) => createGoodsTransactionDetail(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}

export function useUpdateGoodsReceiptDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsTransactionDetailEquipmentPayload }) =>
      updateGoodsTransactionDetail(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.payload.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}

export function useDeleteGoodsReceiptDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; goodsTransactionId: number | string }) =>
      deleteGoodsTransactionDetail(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}

export function useUploadGoodsReceiptInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number | string; file: File }) => uploadGoodsTransactionInvoice(id, file),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsReceiptEquipmentKeys.detail(variables.id) });
    },
  });
}
