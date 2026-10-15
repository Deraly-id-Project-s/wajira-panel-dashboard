import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BalanceReportCashPayload,
  BalanceReportFilters,
  BalanceReportTemplatePayload,
  CreateBalanceYearPayload,
  UpdateBalanceYearPayload,
} from '@/@types/balance-report.types';
import {
  createBalanceReportCash,
  createBalanceYearConfig,
  deleteBalanceReportCash,
  deleteBalanceYearConfig,
  getBalanceReport,
  getBalanceReportCashOptions,
  getBalanceTemplate,
  getBalanceYearConfig,
  updateBalanceReportCash,
  updateBalanceReportTemplate,
  updateBalanceYearConfig,
} from '@/services/report/balanceReport.service';

export const balanceReportKeys = {
  all: ['balance-report'] as const,
  byCompany: (companyId: string | number | null | undefined) =>
    [...balanceReportKeys.all, companyId] as const,
  detail: (
    companyId: string | number | null | undefined,
    filters: BalanceReportFilters = {},
  ) => [...balanceReportKeys.all, 'detail', companyId, filters] as const,
  template: (
    companyId: string | number | null | undefined,
    year?: number,
  ) => [...balanceReportKeys.all, 'template', companyId, year] as const,
  templateYear: (
    companyId: string | number | null | undefined,
    year: number | string | null | undefined,
  ) => [...balanceReportKeys.all, 'template-year', companyId, year] as const,
  cashOptions: (companyId: string | number | null | undefined) =>
    [...balanceReportKeys.all, 'cash-options', companyId] as const,
};

export const useBalanceReport = (
  companyId: string | number | null | undefined,
  filters: BalanceReportFilters = {},
  enabled = true,
) =>
  useQuery({
    queryKey: balanceReportKeys.detail(companyId, filters),
    queryFn: () => getBalanceReport(companyId!, filters),
    enabled: Boolean(companyId) && enabled,
    staleTime: 10_000,
  });

export const useBalanceTemplate = (
  companyId: string | number | null | undefined,
  year?: number,
  enabled = true,
) =>
  useQuery({
    queryKey: balanceReportKeys.template(companyId, year),
    queryFn: () => getBalanceTemplate(companyId!, year),
    enabled: Boolean(companyId) && enabled,
    staleTime: 10_000,
  });

export const useBalanceYearConfig = (
  companyId: string | number | null | undefined,
  year: number | string | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: balanceReportKeys.templateYear(companyId, year),
    queryFn: () => getBalanceYearConfig(companyId!, year!),
    enabled: Boolean(companyId && year) && enabled,
    staleTime: 10_000,
  });

export const useCreateBalanceYearConfig = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBalanceYearPayload) =>
      createBalanceYearConfig(companyId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: balanceReportKeys.all,
      });
    },
  });
};

export const useUpdateBalanceYearConfig = (
  companyId: string | number | null | undefined,
  year: number | string | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBalanceYearPayload) =>
      updateBalanceYearConfig(companyId!, year!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: balanceReportKeys.all,
      });
    },
  });
};

export const useDeleteBalanceYearConfig = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (year: number | string) =>
      deleteBalanceYearConfig(companyId!, year),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: balanceReportKeys.all,
      });
    },
  });
};

export const useUpdateBalanceReportTemplate = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BalanceReportTemplatePayload | UpdateBalanceYearPayload) =>
      updateBalanceReportTemplate(companyId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: balanceReportKeys.all,
      });
    },
  });
};

// ==========================================
// Legacy Hooks (Preserved)
// ==========================================
export const useBalanceReportCashOptions = (
  companyId: string | number | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: balanceReportKeys.cashOptions(companyId),
    queryFn: () => getBalanceReportCashOptions(companyId!),
    enabled: Boolean(companyId) && enabled,
    staleTime: 10 * 60 * 1000,
  });

export const useCreateBalanceReportCash = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BalanceReportCashPayload) =>
      createBalanceReportCash(companyId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: balanceReportKeys.byCompany(companyId) });
    },
  });
};

export const useUpdateBalanceReportCash = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: BalanceReportCashPayload }) =>
      updateBalanceReportCash(companyId!, id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: balanceReportKeys.byCompany(companyId) });
    },
  });
};

export const useDeleteBalanceReportCash = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteBalanceReportCash(companyId!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: balanceReportKeys.byCompany(companyId) });
    },
  });
};
