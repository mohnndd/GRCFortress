import { apiClient } from './client';

export type IntegrationType = 'EMAIL' | 'SMS';

export interface IntegrationSetting {
  type: IntegrationType;
  provider: string;
  enabled: boolean;
  config: Record<string, string>;
  hasSecrets: boolean;
}

export interface IntegrationSettingUpdate {
  provider: string;
  enabled: boolean;
  config: Record<string, string>;
  secrets?: Record<string, string> | null;
}

export async function getEmailSettings(): Promise<IntegrationSetting> {
  const { data } = await apiClient.get<IntegrationSetting>('/api/v1/admin/integrations/email');
  return data;
}

export async function updateEmailSettings(update: IntegrationSettingUpdate): Promise<IntegrationSetting> {
  const { data } = await apiClient.put<IntegrationSetting>('/api/v1/admin/integrations/email', update);
  return data;
}

export async function sendTestEmail(to: string): Promise<void> {
  await apiClient.post('/api/v1/admin/integrations/email/test', { to });
}

export async function getSmsSettings(): Promise<IntegrationSetting> {
  const { data } = await apiClient.get<IntegrationSetting>('/api/v1/admin/integrations/sms');
  return data;
}

export async function updateSmsSettings(update: IntegrationSettingUpdate): Promise<IntegrationSetting> {
  const { data } = await apiClient.put<IntegrationSetting>('/api/v1/admin/integrations/sms', update);
  return data;
}

export async function sendTestSms(to: string): Promise<void> {
  await apiClient.post('/api/v1/admin/integrations/sms/test', { to });
}
