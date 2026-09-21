import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfitLossReportFilters, ProfitLossTemplatePayload } from '@/@types/profit-loss-report.types';
import {
  getProfitLossReport,
  updateProfitLossTemplate,
} from '@/services/report/profitLossReport.service';

export const profitLossReportKeys = {
  all: ['profit-loss-report'] as const,
  detail: (
    companyId: string | number | null | undefined,
    filters: ProfitLossReportFilters = {},
  ) => [...profitLossReportKeys.all, companyId, filters] as const,
};

export const useProfitLossReport = (
  companyId: string | number | null | undefined,
  filters: ProfitLossReportFilters = {},
  enabled = true,
) =>
  useQuery({
    queryKey: profitLossReportKeys.detail(companyId, filters),
    queryFn: () => getProfitLossReport(companyId!, filters),
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
        queryKey: [...profitLossReportKeys.all, companyId],
      });
    },
  });
};
