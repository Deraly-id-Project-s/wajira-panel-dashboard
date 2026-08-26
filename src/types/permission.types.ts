export interface Permission {
  id: number | string;
  name: string;
  description?: string | null;
  guard_name?: string;
  created_at?: string | null;
  updated_at?: string | null;
  roles?: Array<{
    id: number | string;
    name: string;
    guard_name?: string;
    created_at?: string | null;
    updated_at?: string | null;
    pivot?: {
      permission_id: number;
      role_id: number;
    };
  }>;
}

export interface PermissionListResponse {
  data: Permission[];
}
