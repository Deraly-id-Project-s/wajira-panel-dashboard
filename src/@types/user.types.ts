export type UserRole = 'admin' | 'employee' | string;

export interface UserRoleItem {
  id: number;
  name: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
  users_count?: number;
}

export interface User {
  id: number | string;
  uuid?: string;
  name: string;
  email: string;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  isActive?: boolean | number;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roles?: UserRoleItem[];
  companies?: Array<{ id: number; name: string; slug: string }>;
  company_list?: string;
}

export interface UserListParams {
  role?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  password_confirmation?: string;
  roles?: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: number | string;
}

export interface UserStatusResponse {
  total?: number;
  active?: number;
  inactive?: number;
}
