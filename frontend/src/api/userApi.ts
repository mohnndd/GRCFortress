import { apiClient } from './client';

export interface ManagedUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  enabled: boolean;
  accountLocked: boolean;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lastLoginAt: string | null;
  roles: string[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  mfaEnabled: boolean;
  roleIds: number[];
}

export interface UpdateUserRequest {
  email: string;
  fullName: string;
  enabled: boolean;
  accountLocked: boolean;
  mfaEnabled: boolean;
  roleIds: number[];
}

export async function listUsers(): Promise<ManagedUser[]> {
  const { data } = await apiClient.get<ManagedUser[]>('/api/v1/users');
  return data;
}

export async function createUser(req: CreateUserRequest): Promise<ManagedUser> {
  const { data } = await apiClient.post<ManagedUser>('/api/v1/users', req);
  return data;
}

export async function updateUser(id: number, req: UpdateUserRequest): Promise<ManagedUser> {
  const { data } = await apiClient.put<ManagedUser>(`/api/v1/users/${id}`, req);
  return data;
}

export async function resetPassword(id: number, newPassword: string): Promise<void> {
  await apiClient.post(`/api/v1/users/${id}/reset-password`, { newPassword });
}

export async function unlockUser(id: number): Promise<ManagedUser> {
  const { data } = await apiClient.post<ManagedUser>(`/api/v1/users/${id}/unlock`);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/users/${id}`);
}
