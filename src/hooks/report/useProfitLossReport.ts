import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfitLossTemplatePayload } from '@/@types/profit-loss-report.types';
import {
  getProfitLossReport,
  updateProfitLossTemplate,
} from '@/services/report/profitLossReport.service';

export const profitLossReportKeys = {
  all: ['profit-loss-report'] as const,
  detail: (companyId: string | number | null | undefined) =>
    [...profitLossReportKeys.all, companyId] as const,
};

export const useProfitLossReport = (
  companyId: string | number | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: profitLossReportKeys.detail(companyId),
    queryFn: () => getProfitLossReport(companyId!),
    enabled: Boolean(companyId) && enabled,
    staleTime: 10_000,
  });

export const useUpdateProfitLossTemplate = (companyId: string | number | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfitLossTemplatePayload) =>
      updateProfitLossTemplate(companyId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profitLossReportKeys.detail(companyId),
      });
    },
  });
};
