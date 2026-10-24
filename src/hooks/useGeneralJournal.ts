import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GeneralJournalFilterParams,
  GeneralJournalPayload,
} from '@/@types/general-journal.types';
import {
  createGeneralJournal,
  deleteGeneralJournal,
  fetchGeneralJournalDetail,
  fetchGeneralJournals,
  toggleGeneralJournalPaidStatus,
  updateGeneralJournal,
} from '@/services/generalJournal.service';

const GENERAL_JOURNAL_KEY = 'general-journal';

export const generalJournalKeys = {
  all: [GENERAL_JOURNAL_KEY] as const,
  list: (params: GeneralJournalFilterParams) => [GENERAL_JOURNAL_KEY, 'list', params] as const,
  detail: (id: number | string | undefined) => [GENERAL_JOURNAL_KEY, 'detail', id] as const,
};

interface GeneralJournalQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useGeneralJournals(params: GeneralJournalFilterParams, options?: GeneralJournalQueryOptions) {
  return useQuery({
    queryKey: generalJournalKeys.list(params),
    queryFn: () => fetchGeneralJournals(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    retry: 2,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useGeneralJournalDetail(id?: number | string, options?: GeneralJournalQueryOptions) {
  return useQuery({
    queryKey: generalJournalKeys.detail(id),
    queryFn: () => fetchGeneralJournalDetail(id as number | string),
    enabled: (options?.enabled ?? true) && Boolean(id),
    retry: 1,
    staleTime: Infinity,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateGeneralJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GeneralJournalPayload) => createGeneralJournal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generalJournalKeys.all });
    },
  });
}

export function useUpdateGeneralJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GeneralJournalPayload }) =>
      updateGeneralJournal(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: generalJournalKeys.all });
      queryClient.invalidateQueries({ queryKey: generalJournalKeys.detail(variables.id) });
    },
  });
}

export function useDeleteGeneralJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteGeneralJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generalJournalKeys.all });
    },
  });
}

export function useToggleGeneralJournalPaidStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPaid }: { id: number | string; isPaid: boolean }) =>
      toggleGeneralJournalPaidStatus({ id, isPaid }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: generalJournalKeys.all });
      queryClient.invalidateQueries({ queryKey: generalJournalKeys.detail(variables.id) });
    },
  });
}
