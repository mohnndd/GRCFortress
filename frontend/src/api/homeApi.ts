import { apiClient } from './client';
import type { CircularSummary } from './circularApi';

export interface PendingStepDto {
  stepId: number;
  documentTitle: string;
  documentNumber: string;
  documentType: 'POLICY' | 'PROCEDURE';
  departmentName: string;
  stepOrder: number;
  totalSteps: number;
  activatedAt: string | null;
  isDelegated: boolean;
  originalAssignee: string | null;
}

export interface DashboardStats {
  totalPolicies: number;
  openObservations: number;
  totalRisks: number;
  totalCirculars: number;
}

export interface DashboardData {
  pendingApprovalSteps: PendingStepDto[];
  recentCirculars: CircularSummary[];
  stats: DashboardStats;
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>('/api/v1/dashboard');
  return data;
}
