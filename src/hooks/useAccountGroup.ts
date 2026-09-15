import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountGroupDetail, AccountGroupPayload, AccountGroupUpdatePayload } from '@/@types/account-group.types';
import type { PaginationParams } from '@/@types/pagination.types';
import { createAccountGroup, deleteAccountGroup, getAccountGroupById, getAccountGroups, quickCreateAccountGroup, updateAccountGroup, importAccountGroup } from '@/services/account-group.service';
import type { QuickCreateAccountGroupPayload } from '@/services/account-group.service';
import { companyQueryKeys } from '@/lib/query/company-key';

export const useAccountGroups = (params: PaginationParams & { search?: string; company_id?: string | number; enabled?: boolean }) => {
  const { enabled = true, ...rest } = params;
  const companyId = rest.company_id;

  return useQuery({
    queryKey: companyId ? companyQueryKeys.list(companyId, 'account-groups', rest) : ['account-groups', 'unscoped', rest],
    queryFn: () => getAccountGroups(rest),
    placeholderData: (previous) => previous,
    enabled,
  });
};

export const useAccountGroup = (id: string | number | undefined) =>
  useQuery<AccountGroupDetail>({
    queryKey: ['account-group', id],
    queryFn: () => getAccountGroupById(id!),
    enabled: !!id,
    retry: false,
  });

export const useCreateAccountGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AccountGroupPayload) => createAccountGroup(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: companyQueryKeys.companyScope(variables.company_id),
      });
    },
  });
};

/** Quick create (FormData) used by modal inline add */
export const useQuickCreateAccountGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuickCreateAccountGroupPayload) => quickCreateAccountGroup(payload),
    onSuccess: (_group, variables) => {
      queryClient.invalidateQueries({
        queryKey: companyQueryKeys.companyScope(variables.companyId),
      });
    },
  });
};

export const useUpdateAccountGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: AccountGroupUpdatePayload }) => updateAccountGroup(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: companyQueryKeys.companyScope(variables.payload.company_id),
      });
      queryClient.invalidateQueries({ queryKey: ['account-group'] });
    },
  });
};

export const useDeleteAccountGroup = (companyId?: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteAccountGroup(id),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: companyQueryKeys.companyScope(companyId),
        });
      }
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey.includes('account-groups'),
      });
    },
  });
};

export const useImportAccountGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: string | number; file: File }) => importAccountGroup(file, companyId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: companyQueryKeys.companyScope(variables.companyId),
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey.includes('account-groups'),
      });
    },
  });
};
