import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BalanceReportCashPayload,
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
  detail: (companyId: string | number | null | undefined) =>
    [...balanceReportKeys.all, companyId] as const,
  cashOptions: (companyId: string | number | null | undefined) =>
    [...balanceReportKeys.all, 'cash-options', companyId] as const,
};

export const useBalanceReport = (
  companyId: string | number | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: balanceReportKeys.detail(companyId),
    queryFn: () => getBalanceReport(companyId!),
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
      void queryClient.invalidateQueries({ queryKey: balanceReportKeys.detail(companyId) });
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
      void queryClient.invalidateQueries({ queryKey: balanceReportKeys.detail(companyId) });
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
      void queryClient.invalidateQueries({ queryKey: balanceReportKeys.detail(companyId) });
    },
  });
};
