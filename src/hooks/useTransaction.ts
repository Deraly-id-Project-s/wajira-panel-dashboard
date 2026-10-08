import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as service from '@/services/transaction.service';
import { Transaction, CreateTransactionRequest } from '@/@types/transaction.types';

const KEYS = {
  all: ['transactions'] as const,
  list: (companyId: string, page: number, limit: number, search: string, startDate?: string, endDate?: string) => [...KEYS.all, 'list', companyId, page, limit, search, startDate, endDate] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
  summary: (companyId: string) => [...KEYS.all, 'summary', companyId] as const,
};

export const useTransactions = (companyId: string, page: number, limit: number, search: string = '', startDate?: string, endDate?: string) =>
  useQuery({
    queryKey: KEYS.list(companyId, page, limit, search, startDate, endDate),
    queryFn: () => service.getTransactions(companyId, page, limit, search, startDate, endDate),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useTransactionSummary = (companyId: string) =>
  useQuery({
    queryKey: KEYS.summary(companyId),
    queryFn: () => service.getTransactionSummary(companyId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useCreateTransaction = (companyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => service.createTransaction(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.summary(companyId) });
    },
  });
};

export const useUpdateTransaction = (companyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; payload: Partial<Transaction> }) => service.updateTransaction(data.id, data.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.summary(companyId) });
    },
  });
};

export const useDeleteTransaction = (companyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => service.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.summary(companyId) });
    },
  });
};

export const useExportTransactions = () =>
  useMutation({
    mutationFn: ({ companyId, search }: { companyId: string; search?: string }) =>
      service.exportTransactions(companyId, search),
  });
