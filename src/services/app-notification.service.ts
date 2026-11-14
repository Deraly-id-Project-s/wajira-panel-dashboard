import { apiClient } from '@/lib/api/client';
import type {
  AppNotification,
  AppNotificationFilterParams,
  AppNotificationListResponse,
} from '@/@types/app-notification.types';

const NOTIFICATION_BASE_PATH = '/wapi/other/app-notification';

export const getAppNotifications = async (
  params?: AppNotificationFilterParams,
): Promise<AppNotificationListResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.type && params.type !== 'all') {
    queryParams.type = params.type;
  }

  if (params?.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }

  if (params?.per_page !== undefined) {
    queryParams.per_page = params.per_page;
  }

  if (params?.page) {
    queryParams.page = params.page;
  }

  if (params?.sort_by) {
    queryParams.sort_by = params.sort_by;
  }

  if (params?.sort_order) {
    queryParams.sort_order = params.sort_order;
  }

  if (params?.sync) {
    queryParams.sync = 1;
  }

  const response = await apiClient.get<any>(NOTIFICATION_BASE_PATH, {
    params: queryParams,
  });

  const body = response.data;
  const rawData = body?.data ?? body;

  let items: AppNotification[] = [];
  let total = 0;
  let currentPage = 1;
  let lastPage = 1;

  if (Array.isArray(rawData)) {
    items = rawData;
    total = rawData.length;
    currentPage = 1;
    lastPage = 1;
  } else if (rawData && typeof rawData === 'object') {
    items = Array.isArray(rawData.data) ? rawData.data : [];
    total = Number(rawData.total ?? items.length);
    currentPage = Number(rawData.current_page ?? 1);
    lastPage = Number(rawData.last_page ?? 1);
  }

  return {
    data: items,
    total,
    currentPage,
    lastPage,
  };
};

export const syncAppNotifications = async (): Promise<AppNotificationListResponse> => {
  return getAppNotifications({ sync: true, per_page: 20 });
};
