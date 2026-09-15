import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/features/auth/services/auth.service';
import { useCompany } from '@/contexts/CompanyContext';

export function usePermissionGuard() {
  const { companyId } = useCompany();
  const { data: profile } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthService.me(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const { data: permissions = [], isLoading, isError } = useQuery<string[]>({
    queryKey: ['auth', 'permissions', companyId],
    queryFn: () => AuthService.getPermissions(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const hasPermission = (required?: string | string[]) => {
    if (!required) return true;
    const list = Array.isArray(required) ? required : [required];
    if (!permissions.length) return false;
    return list.every((perm) => permissions.includes(perm));
  };

  const roleNames = [
    profile?.data?.role,
    ...(profile?.data?.roles?.map((role) => role.name) ?? []),
  ]
    .filter((role): role is string => Boolean(role))
    .map((role) => role.toLowerCase());
  const isAdmin = roleNames.includes('admin');
  const canManageMasterDataLock = isAdmin || hasPermission('master-data:lock');

  return { hasPermission, permissions, isLoading, isError, isAdmin, canManageMasterDataLock };
}
