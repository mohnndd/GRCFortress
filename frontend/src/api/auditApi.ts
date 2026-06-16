import { apiClient } from './client';

export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export interface AuditLogEntry {
  id: number;
  eventType: string;
  username: string | null;
  detail: string | null;
  ipAddress: string | null;
  outcome: AuditOutcome;
  createdAt: string;
}

export interface AuditTrailPage {
  content: AuditLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditTrailQuery {
  page: number;
  size: 10 | 50 | 100;
  actor?: string;
  event?: string;
}

export async function listAuditTrail(query: AuditTrailQuery): Promise<AuditTrailPage> {
  const { data } = await apiClient.get<AuditTrailPage>('/api/v1/audit-trail', {
    params: query,
  });
  return data;
}
