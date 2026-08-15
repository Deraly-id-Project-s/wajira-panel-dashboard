import { Permission } from './permission.types';

export interface Role {
  id: number | string;
  name: string;
  guard_name?: string;
  created_at?: string | null;
  updated_at?: string | null;
  users_count?: number;
  permissions?: Permission[];
  features?: Array<{
    id: number;
    slug: string;
    name: string;
    description: string;
  }>;
  users?: Array<{
    id: number;
    avatar: string | null;
    is_active: number;
    name: string;
    email: string;
    username: string;
    firstname: string | null;
    lastname: string | null;
    email_verified_at: string | null;
    last_login: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

export interface RolePayload {
  name: string;
  company_id?: number | string | null;
  feature_ids?: number[];
  permissions?: string[];
}
