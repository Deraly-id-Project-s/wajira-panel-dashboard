import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/features/auth/services/auth.service';

export function usePermissionGuard() {
  const { data: permissions = [], isLoading, isError } = useQuery<string[]>({
    queryKey: ['auth', 'permissions'],
    queryFn: AuthService.getPermissions,
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

  return { hasPermission, permissions, isLoading, isError };
}
