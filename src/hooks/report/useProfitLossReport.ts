import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ProfitLossReportFilters,
  ProfitLossTemplatePayload,
  SaveProfitLossTemplateYearPayload,
} from '@/@types/profit-loss-report.types';
import {
  createProfitLossTemplateYear,
  deleteProfitLossTemplateYear,
  getProfitLossReport,
  getProfitLossTemplate,
  getProfitLossTemplateYear,
  updateProfitLossTemplate,
  updateProfitLossTemplateYear,
} from '@/services/report/profitLossReport.service';

export const profitLossReportKeys = {
  all: ['profit-loss-report'] as const,
  detail: (
    companyId: string | number | null | undefined,
    filters: ProfitLossReportFilters = {},
  ) => [...profitLossReportKeys.all, companyId, filters] as const,
  template: (
    companyId: string | number | null | undefined,
    year?: number,
  ) => [...profitLossReportKeys.all, 'template', companyId, year] as const,
  templateYear: (
    companyId: string | number | null | undefined,
    year: number | string | null | undefined,
  ) => [...profitLossReportKeys.all, 'template-year', companyId, year] as const,
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

export const useProfitLossTemplate = (
  companyId: string | number | null | undefined,
  year?: number,
  enabled = true,
) =>
  useQuery({
    queryKey: profitLossReportKeys.template(companyId, year),
    queryFn: () => getProfitLossTemplate(companyId!, year),
    enabled: Boolean(companyId) && enabled,
    staleTime: 10_000,
  });

export const useProfitLossTemplateYear = (
  companyId: string | number | null | undefined,
  year: number | string | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: profitLossReportKeys.templateYear(companyId, year),
    queryFn: () => getProfitLossTemplateYear(companyId!, year!),
    enabled: Boolean(companyId && year) && enabled,
    staleTime: 10_000,
  });

export const useCreateProfitLossTemplateYear = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveProfitLossTemplateYearPayload) =>
      createProfitLossTemplateYear(companyId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profitLossReportKeys.all,
      });
    },
  });
};

export const useUpdateProfitLossTemplateYear = (
  companyId: string | number | null | undefined,
  year: number | string | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveProfitLossTemplateYearPayload) =>
      updateProfitLossTemplateYear(companyId!, year!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profitLossReportKeys.all,
      });
    },
  });
};

export const useDeleteProfitLossTemplateYear = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (year: number | string) =>
      deleteProfitLossTemplateYear(companyId!, year),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profitLossReportKeys.all,
      });
    },
  });
};

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
