import { apiClient } from './client';

export interface Decision {
  id: number;
  decisionNumber: string;
  title: string;
  decisionDate: string;
  decisionMaker: string;
  relatedRisk: string | null;
  relatedPolicyControl: string | null;
  backgroundContext: string | null;
  alternativesConsidered: string | null;
  decisionOutcome: string | null;
  justification: string | null;
  impactAssessment: string | null;
  actionsRequired: string | null;
  owner: string | null;
  dueDate: string | null;
  reviewDate: string | null;
  status: string;
  attachmentName: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionRequest {
  title: string;
  decisionDate: string;
  decisionMaker: string;
  relatedRisk: string;
  relatedPolicyControl: string;
  backgroundContext: string;
  alternativesConsidered: string;
  decisionOutcome: string;
  justification: string;
  impactAssessment: string;
  actionsRequired: string;
  owner: string;
  dueDate: string | null;
  reviewDate: string | null;
  status: string;
}

export async function listDecisions(): Promise<Decision[]> {
  const { data } = await apiClient.get<Decision[]>('/api/v1/decisions');
  return data;
}

export async function createDecision(req: DecisionRequest): Promise<Decision> {
  const { data } = await apiClient.post<Decision>('/api/v1/decisions', req);
  return data;
}

export async function updateDecision(id: number, req: DecisionRequest): Promise<Decision> {
  const { data } = await apiClient.put<Decision>(`/api/v1/decisions/${id}`, req);
  return data;
}

export async function uploadDecisionAttachment(id: number, file: File): Promise<Decision> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<Decision>(`/api/v1/decisions/${id}/attachment`, form);
  return data;
}

export function decisionAttachmentUrl(id: number): string {
  return `${apiClient.defaults.baseURL}/api/v1/decisions/${id}/attachment`;
}

export async function deleteDecision(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/decisions/${id}`);
}
