import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppNotificationFilterParams } from '@/@types/app-notification.types';
import { getAppNotifications, syncAppNotifications } from '@/services/app-notification.service';

export const APP_NOTIFICATIONS_QUERY_KEY = ['app-notifications'];

export const DEFAULT_APP_NOTIFICATION_PARAMS: AppNotificationFilterParams = {
  per_page: 50,
  sort_by: 'created_at',
  sort_order: 'desc',
};

export function useAppNotifications(
  params?: AppNotificationFilterParams,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const { enabled = true, refetchInterval = false } = options ?? {};
  const queryParams = params ?? DEFAULT_APP_NOTIFICATION_PARAMS;

  return useQuery({
    queryKey: [...APP_NOTIFICATIONS_QUERY_KEY, queryParams],
    queryFn: () => getAppNotifications(queryParams),
    enabled,
    refetchInterval,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSyncAppNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncAppNotifications(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: APP_NOTIFICATIONS_QUERY_KEY });
      return data;
    },
  });
}
