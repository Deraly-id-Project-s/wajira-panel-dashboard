import type { QueryClient } from '@tanstack/react-query';
import { removeAccessToken } from '@/lib/auth/token';
import { clearCompanyScopedQueries } from '@/lib/session/query-cache';
import { clearStoredCompanyId, clearStoredPermissions } from '@/lib/session/storage';
import { clearCachedUserCompanies } from '@/services/company.service';
import { AuthService } from '@/features/auth/services/auth.service';

export const performClientLogout = (queryClient: QueryClient): void => {
  removeAccessToken();
  clearStoredCompanyId();
  clearStoredPermissions();
  clearCachedUserCompanies();
  AuthService.clearCachedProfile();
  queryClient.removeQueries({ queryKey: ['auth', 'dashboard-permissions'] });
  queryClient.removeQueries({ queryKey: ['auth', 'permissions'] });
  queryClient.removeQueries({ queryKey: ['auth', 'sidebar'] });
  clearCompanyScopedQueries(queryClient);
};
