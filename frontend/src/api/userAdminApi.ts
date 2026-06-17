import { apiClient } from './client';

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  mfaEnabled: boolean;
  enabled: boolean;
  accountLocked: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  mfaEnabled: boolean;
}

export async function listUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>('/api/v1/users');
  return data;
}

export async function createUser(request: CreateUserRequest): Promise<UserSummary> {
  const { data } = await apiClient.post<UserSummary>('/api/v1/users', request);
  return data;
}

export async function resetPassword(id: number): Promise<UserSummary> {
  const { data } = await apiClient.post<UserSummary>(`/api/v1/users/${id}/reset-password`);
  return data;
}

export async function unlockUser(id: number): Promise<UserSummary> {
  const { data } = await apiClient.post<UserSummary>(`/api/v1/users/${id}/unlock`);
  return data;
}
