import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppNotificationFilterParams } from '@/@types/app-notification.types';
import { getAppNotifications, syncAppNotifications } from '@/services/app-notification.service';

export const APP_NOTIFICATIONS_QUERY_KEY = ['app-notifications'];

export function useAppNotifications(
  params?: AppNotificationFilterParams,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  const { enabled = true, refetchInterval = 30000 } = options ?? {};

  return useQuery({
    queryKey: [...APP_NOTIFICATIONS_QUERY_KEY, params],
    queryFn: () => getAppNotifications(params),
    enabled,
    refetchInterval,
    staleTime: 10000,
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
