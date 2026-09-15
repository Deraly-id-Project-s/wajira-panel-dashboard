import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountPayload, AccountUpdatePayload } from '@/@types/account.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { createAccount, deleteAccount, getAccountById, getAccountHierarchy, getAccounts, importAccount, updateAccount, bulkUpdateAccounts } from '@/services/account.service';

export const useAccounts = (params: PaginationParams & { search?: string; company_id?: string | number; type?: string; account_group_id?: string | number; enabled?: boolean }) => {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['accounts', rest],
    queryFn: () => getAccounts(rest),
    placeholderData: (previous) => previous,
    enabled,
  });
};

export const useAccount = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['account', id],
    queryFn: () => getAccountById(id!),
    enabled: !!id,
    retry: false,
  });

export const useAccountHierarchy = () =>
  useQuery({
    queryKey: ['account-hierarchy'],
    queryFn: () => getAccountHierarchy(),
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AccountPayload) => createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-hierarchy'] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: AccountUpdatePayload }) => updateAccount(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['account-hierarchy'] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-hierarchy'] });
    },
  });
};

export const useImportAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: string | number; file: File }) => importAccount(file, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-hierarchy'] });
    },
  });
};

export const useBulkUpdateAccounts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { accountIds: (number | string)[]; accountGroupId: number; category: string }) =>
      bulkUpdateAccounts(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['account-hierarchy'] });
    },
  });
};
