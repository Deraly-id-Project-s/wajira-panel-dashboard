import { useQuery } from '@tanstack/react-query';
import { getPermissionById, getPermissions } from '@/services/permission.service';
import { Permission } from '@/types/permission.types';

export const permissionKeys = {
  all: ['permissions'] as const,
  list: () => permissionKeys.all,
  detail: (id?: number | string) => [...permissionKeys.all, id] as const,
};

export function usePermissions() {
  return useQuery<Permission[]>({
    queryKey: permissionKeys.list(),
    queryFn: () => getPermissions(),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePermission(id?: number | string) {
  return useQuery<Permission>({
    queryKey: permissionKeys.detail(id),
    queryFn: () => getPermissionById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}
