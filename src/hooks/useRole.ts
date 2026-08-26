import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignRolePermissions, createRole, getRoleDetail, getRoles, deleteRole, updateRole } from '@/services/role.service';
import { UserRoleItem } from '@/types/user.types';
import { Role, RolePayload } from '@/types/role.types';

export const roleKeys = {
  all: ['roles'] as const,
  list: (search?: string) => [...roleKeys.all, search ?? 'all'] as const,
  detail: (id?: number | string) => [...roleKeys.all, 'detail', id] as const,
};

export function useRoles(search?: string) {
  return useQuery<UserRoleItem[]>({
    queryKey: roleKeys.list(search),
    queryFn: () => getRoles(search),
    staleTime: 1000 * 60 * 10,
  });
}

export function useRoleDetail(id?: number | string, opts?: { withoutPermission?: boolean }) {
  return useQuery<Role>({
    queryKey: roleKeys.detail(id),
    queryFn: () => getRoleDetail(id!, opts),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RolePayload) => createRole(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useAssignRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: number | string; permissions: string[] }) => assignRolePermissions(id, permissions),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: RolePayload }) => updateRole(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
      qc.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
    },
  });
}
