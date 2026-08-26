import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, fetchUsersOptions, type UserOption, activateUser, deactivateUser, assignRole, revokeRole } from '@/services/user.service';
import { CreateUserRequest, UpdateUserRequest, UserListParams } from '@/types/user.types';

// Strict Query Keys
export const userKeys = {
  all: ['users'] as const,
  list: (filters?: UserListParams) => [...userKeys.all, filters?.role ?? 'all'] as const,
};

export function useUsers(filters?: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export const useUserOptions = () =>
  useQuery<UserOption[]>({
    queryKey: ['user-options'],
    queryFn: () => fetchUsersOptions(),
    staleTime: 1000 * 60 * 5,
  });

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserRequest) => updateUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => activateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deactivateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number | string; role: string }) => assignRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number | string; role: string }) => revokeRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
