import { apiClient } from './client';

export interface LoginResponse {
  mfaRequired: boolean;
  mfaToken: string | null;
  tokens: TokenResponse | null;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface CurrentUser {
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  mustChangePassword: boolean;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/login', { username, password });
  return data;
}

export async function verifyMfa(mfaToken: string, code: string): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/api/v1/auth/mfa/verify', { mfaToken, code });
  return data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser>('/api/v1/auth/me');
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/api/v1/auth/change-password', { currentPassword, newPassword });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/api/v1/auth/logout', { refreshToken });
}
