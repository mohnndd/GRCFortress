import { apiClient } from './client';

export interface SlaRule {
  id: number;
  processType: 'POLICY_APPROVAL' | 'PROCEDURE_APPROVAL' | 'TERMS_APPROVAL';
  businessDaysPerStep: number;
}

export interface ActiveStepStatus {
  stepId: number;
  documentTitle: string;
  documentNumber: string;
  processType: string;
  departmentName: string;
  stepOrder: number;
  totalSteps: number;
  activatedAt: string | null;
  businessDaysElapsed: number;
  slaBusinessDays: number;
  slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
}

export async function getSlaRules(): Promise<SlaRule[]> {
  const { data } = await apiClient.get<SlaRule[]>('/api/v1/sla/rules');
  return data;
}

export async function updateSlaRule(processType: string, businessDaysPerStep: number): Promise<SlaRule> {
  const { data } = await apiClient.put<SlaRule>(`/api/v1/sla/rules/${processType}`, { businessDaysPerStep });
  return data;
}

export async function getActiveSteps(): Promise<ActiveStepStatus[]> {
  const { data } = await apiClient.get<ActiveStepStatus[]>('/api/v1/sla/active-steps');
  return data;
}
