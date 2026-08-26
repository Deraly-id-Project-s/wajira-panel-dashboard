import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationParams } from '@/types/pagination.types';
import type { GoodsIssueEquipmentPayload } from '@/types/goods-issue-equipment.types';
import {
  getGoodsIssueEquipments,
  getGoodsIssueEquipmentById,
  createGoodsIssueEquipment,
  updateGoodsIssueEquipment,
  deleteGoodsIssueEquipment,
} from '@/services/warehouse/goodsTransaction.service';

export const goodsIssueEquipmentKeys = {
  all: ['goods-issue-equipment'] as const,
  list: (params: unknown) => [...goodsIssueEquipmentKeys.all, 'list', params] as const,
  detail: (id: number | string | undefined) => [...goodsIssueEquipmentKeys.all, 'detail', id] as const,
  details: (params: unknown) => [...goodsIssueEquipmentKeys.all, 'details', params] as const,
};

export function useGoodsIssueEquipments(
  params: PaginationParams & {
    companyId?: number | string;
    code?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    location?: string;
    enabled?: boolean;
  },
) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: goodsIssueEquipmentKeys.list(rest),
    queryFn: () => getGoodsIssueEquipments(rest),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useGoodsIssueEquipmentDetail(id: number | string | undefined) {
  return useQuery({
    queryKey: goodsIssueEquipmentKeys.detail(id),
    queryFn: () => getGoodsIssueEquipmentById(id!),
    enabled: !!id,
  });
}

export function useCreateGoodsIssueEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoodsIssueEquipmentPayload) => createGoodsIssueEquipment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.all });
    },
  });
}

export function useUpdateGoodsIssueEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GoodsIssueEquipmentPayload }) =>
      updateGoodsIssueEquipment(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.all });
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.detail(variables.id) });
    },
  });
}

export function useDeleteGoodsIssueEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteGoodsIssueEquipment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsIssueEquipmentKeys.all });
    },
  });
}
