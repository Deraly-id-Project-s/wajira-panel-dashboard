export type AppNotificationType =
  | 'unit_transaction'
  | 'do_expedition'
  | 'finance'
  | 'login'
  | 'system'
  | 'other';

export interface AppNotification {
  id: number;
  name: string;
  type: AppNotificationType;
  message: string | null;
  link: string | null;
  expired_at: string | null; // ISO 8601 string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppNotificationFilterParams {
  type?: AppNotificationType | 'all';
  search?: string;
  per_page?: number | 'all';
  page?: number;
  sort_by?: 'id' | 'name' | 'type' | 'created_at' | 'expired_at';
  sort_order?: 'asc' | 'desc';
  sync?: boolean;
}

export interface AppNotificationListResponse {
  data: AppNotification[];
  total: number;
  currentPage: number;
  lastPage: number;
}
