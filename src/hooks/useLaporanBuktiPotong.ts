import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WithholdingTaxReportListParams, UpdateWithholdingTaxReportPayload } from '@/types/laporan-bukti-potong.types';
import {
  getWithholdingTaxReports,
  getWithholdingTaxReportById,
  updateWithholdingTaxReport,
  deleteWithholdingTaxReport,
} from '@/services/laporan-bukti-potong.service';

export const LAPORAN_BUKTI_POTONG_KEYS = {
  all: ['laporan-bukti-potong'] as const,
  lists: () => [...LAPORAN_BUKTI_POTONG_KEYS.all, 'list'] as const,
  list: (params: WithholdingTaxReportListParams) => [...LAPORAN_BUKTI_POTONG_KEYS.lists(), params] as const,
  details: () => [...LAPORAN_BUKTI_POTONG_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...LAPORAN_BUKTI_POTONG_KEYS.details(), id] as const,
};

export function useWithholdingTaxReports(params: WithholdingTaxReportListParams) {
  return useQuery({
    queryKey: LAPORAN_BUKTI_POTONG_KEYS.list(params),
    queryFn: () => getWithholdingTaxReports(params),
  });
}

export function useWithholdingTaxReportDetail(id: number | string | null) {
  return useQuery({
    queryKey: LAPORAN_BUKTI_POTONG_KEYS.detail(id!),
    queryFn: () => getWithholdingTaxReportById(id!),
    enabled: !!id,
  });
}

export function useUpdateWithholdingTaxReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateWithholdingTaxReportPayload }) =>
      updateWithholdingTaxReport(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LAPORAN_BUKTI_POTONG_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LAPORAN_BUKTI_POTONG_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteWithholdingTaxReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteWithholdingTaxReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LAPORAN_BUKTI_POTONG_KEYS.lists() });
    },
  });
}
