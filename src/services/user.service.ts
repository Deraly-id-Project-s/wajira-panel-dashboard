import { User, CreateUserRequest, UpdateUserRequest, UserListParams, UserStatusResponse } from '@/types/user.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse, ApiResponseError } from '@/lib/api/response';

type UserRolePivot = {
  model_type?: string;
  model_id?: number;
  role_id?: number;
};

type UserRoleApiModel = {
  id: number;
  name: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
  pivot?: UserRolePivot;
};

type UserApiModel = {
  id: number;
  uuid?: string;
  avatar?: string | null;
  is_active?: number | boolean;
  name: string;
  email: string;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  roles?: UserRoleApiModel[];
  companies?: Array<{ id: number; name: string; slug: string }>;
  company_list?: string;
};

type UsersResponse = LaravelApiResponse<UserApiModel[] | UserApiModel>;
type UserItemResponse = LaravelApiResponse<UserApiModel>;
type UserStatusApiResponse = LaravelApiResponse<UserStatusResponse>;
type DeleteResponse = LaravelApiResponse<null>;

const basePath = '/wapi/users';

const mapUser = (payload: UserApiModel): User => ({
  id: payload.id,
  uuid: payload.uuid,
  name: payload.name,
  email: payload.email,
  username: payload.username,
  firstname: payload.firstname ?? undefined,
  lastname: payload.lastname ?? undefined,
  isActive: payload.is_active,
  emailVerifiedAt: payload.email_verified_at ?? null,
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
  roles: payload.roles?.map((role) => ({
    id: role.id,
    name: role.name,
    guard_name: role.guard_name,
    created_at: role.created_at,
    updated_at: role.updated_at,
  })),
  companies: payload.companies?.map((company) => ({
    id: company.id,
    name: company.name,
    slug: company.slug,
  })),
  company_list: payload.company_list,
});

const buildPayload = (payload: CreateUserRequest | UpdateUserRequest, opts?: { asUpdate?: boolean }) => {
  const body = new FormData();
  if (opts?.asUpdate) body.append('_method', 'PUT');

  if (payload.name !== undefined) body.append('name', payload.name);
  if (payload.email !== undefined) body.append('email', payload.email);
  if (payload.username !== undefined) body.append('username', payload.username);
  if (payload.firstname !== undefined) body.append('firstname', payload.firstname);
  if (payload.lastname !== undefined) body.append('lastname', payload.lastname);
  if (payload.roles !== undefined) body.append('roles', payload.roles);
  if (payload.password) body.append('password', payload.password);
  if ((payload as any).password_confirmation) body.append('password_confirmation', (payload as any).password_confirmation);
  if ((payload as any).company_ids !== undefined) {
    body.append('company_ids', JSON.stringify((payload as any).company_ids));
  }

  return body;
};

export const getUsers = async (params?: UserListParams): Promise<User[]> => {
  const response = await apiClient.get<UsersResponse>(basePath, {
    params,
  });
  const data = ensureSuccess(response.data);
  const list = Array.isArray(data) ? data : [data];
  return list.map(mapUser);
};

export const getUserById = async (id: number | string): Promise<User> => {
  const response = await apiClient.get<UserItemResponse>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapUser(data);
};

export const createUser = async (payload: CreateUserRequest): Promise<User> => {
  const body = buildPayload(payload);
  const response = await apiClient.post<UserItemResponse>(basePath, body);
  const data = ensureSuccess(response.data);
  return mapUser(data);
};

export const updateUser = async (payload: UpdateUserRequest): Promise<User> => {
  const body = buildPayload(payload, { asUpdate: true });
  const response = await apiClient.post<UserItemResponse>(`${basePath}/${payload.id}`, body);
  const data = ensureSuccess(response.data);
  return mapUser(data);
};

export const deleteUser = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<DeleteResponse>(`${basePath}/${id}`);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete user');
  }
};

export const assignRole = async (id: number | string, role: string): Promise<void> => {
  const body = new FormData();
  body.append('roles', role);
  const response = await apiClient.post<UserItemResponse>(`${basePath}/${id}/assign-role`, body);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to assign role');
  }
};

export const revokeRole = async (id: number | string, role: string): Promise<void> => {
  const body = new FormData();
  body.append('roles', role);
  const response = await apiClient.post<UserItemResponse>(`${basePath}/${id}/revoke-role`, body);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to revoke role');
  }
};

export const activateUser = async (id: number | string): Promise<void> => {
  const response = await apiClient.put<UserItemResponse>(`${basePath}/${id}/activate-user`);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to activate user');
  }
};

export const deactivateUser = async (id: number | string): Promise<void> => {
  const response = await apiClient.put<UserItemResponse>(`${basePath}/${id}/deactivate-user`);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to deactivate user');
  }
};

export const getUserPassword = async (id: number | string): Promise<string> => {
  const response = await apiClient.get<LaravelApiResponse<{ secure_password: string }>>(`${basePath}/${id}/get-user-password`);
  const data = ensureSuccess(response.data);
  return data.secure_password;
};

export const getUserStatus = async (status?: boolean): Promise<UserStatusResponse> => {
  const response = await apiClient.get<UserStatusApiResponse>(`${basePath}/action/get-status`, {
    params: status === undefined ? undefined : { status },
  });
  return ensureSuccess(response.data);
};

// === API: User list for selector ===
export interface UserOption {
  id: number;
  name: string;
}

export async function fetchUsersOptions(role?: string): Promise<UserOption[]> {
  const response = await apiClient.get<UsersResponse>(basePath, {
    params: role ? { role } : undefined,
  });
  const data = ensureSuccess(response.data);
  const list = Array.isArray(data) ? data : [data];
  return (list ?? []).map((u) => ({ id: u.id, name: u.name }));
}
