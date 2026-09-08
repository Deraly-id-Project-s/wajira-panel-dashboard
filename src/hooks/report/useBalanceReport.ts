import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BalanceReportCashPayload,
  BalanceReportFilters,
  BalanceReportTemplatePayload,
} from '@/@types/balance-report.types';
import {
  createBalanceReportCash,
  getBalanceReport,
  getBalanceReportCashOptions,
  updateBalanceReportCash,
  updateBalanceReportTemplate,
} from '@/services/report/balanceReport.service';

export const balanceReportKeys = {
  all: ['balance-report'] as const,
  byCompany: (companyId: string | number | null | undefined) =>
    [...balanceReportKeys.all, companyId] as const,
  detail: (
    companyId: string | number | null | undefined,
    filters: BalanceReportFilters = {},
  ) => [...balanceReportKeys.byCompany(companyId), filters] as const,
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

export const useUpdateBalanceReportTemplate = (
  companyId: string | number | null | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BalanceReportTemplatePayload) =>
      updateBalanceReportTemplate(companyId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: balanceReportKeys.byCompany(companyId) });
    },
  });
};

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
