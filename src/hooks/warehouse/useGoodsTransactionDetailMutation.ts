import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GoodsTransactionDetailEquipmentPayload } from '@/types/goods-issue-equipment.types';
import {
  createGoodsTransactionDetail,
  updateGoodsTransactionDetail,
  deleteGoodsTransactionDetail,
} from '@/services/warehouse/goodsTransactionDetail.service';
import { goodsIssueEquipmentKeys } from './useGoodsIssueEquipment';

export function useCreateGoodsTransactionDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsTransactionDetailEquipmentPayload) => createGoodsTransactionDetail(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.detail(variables.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.details({}) });
      qc.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}

export function useUpdateGoodsTransactionDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsTransactionDetailEquipmentPayload }) =>
      updateGoodsTransactionDetail(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.detail(variables.payload.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.details({}) });
      qc.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}

export function useDeleteGoodsTransactionDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; goodsTransactionId: number | string }) =>
      deleteGoodsTransactionDetail(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.detail(variables.goodsTransactionId) });
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.details({}) });
      qc.invalidateQueries({ queryKey: ['vehicle-equipments'] });
    },
  });
}
