import { apiClient } from './client';

export interface RiskDomain {
  id: number;
  name: string;
  description: string | null;
  categories: RiskCategory[];
}

export interface RiskCategory {
  id: number;
  name: string;
}

export interface RiskSummary {
  id: number;
  riskNumber: string;
  title: string;
  description: string | null;
  domainId: number | null;
  domainName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  riskOwnerUsername: string | null;
  status: string;
  inherentLikelihood: number;
  inherentImpactFinancial: number;
  inherentImpactOperational: number;
  inherentImpactRegulatory: number;
  inherentImpactReputational: number;
  inherentCompositeImpact: number;
  inherentScore: number;
  residualLikelihood: number;
  residualImpactFinancial: number;
  residualImpactOperational: number;
  residualImpactRegulatory: number;
  residualImpactReputational: number;
  residualCompositeImpact: number;
  residualScore: number;
  targetRiskScore: number | null;
  treatmentOption: string | null;
  treatmentPlan: string | null;
  riskVelocity: string | null;
  relatedRegulations: string | null;
  reviewFrequency: string;
  nextReviewDate: string | null;
  lastReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export type RiskCreateRequest = {
  title: string;
  description?: string;
  status?: string;
  domainId?: number | null;
  categoryId?: number | null;
  riskOwnerUsername?: string;
  inherentLikelihood: number;
  inherentImpactFinancial: number;
  inherentImpactOperational: number;
  inherentImpactRegulatory: number;
  inherentImpactReputational: number;
  residualLikelihood: number;
  residualImpactFinancial: number;
  residualImpactOperational: number;
  residualImpactRegulatory: number;
  residualImpactReputational: number;
  targetRiskScore?: number | null;
  treatmentOption?: string;
  treatmentPlan?: string;
  riskVelocity?: string;
  relatedRegulations?: string;
  reviewFrequency?: string;
  nextReviewDate?: string | null;
  lastReviewDate?: string | null;
};

export async function listRiskDomains(): Promise<RiskDomain[]> {
  const { data } = await apiClient.get<RiskDomain[]>('/api/v1/risks/domains');
  return data;
}

export async function listRisks(): Promise<RiskSummary[]> {
  const { data } = await apiClient.get<RiskSummary[]>('/api/v1/risks');
  return data;
}

export async function createRisk(req: RiskCreateRequest): Promise<RiskSummary> {
  const { data } = await apiClient.post<RiskSummary>('/api/v1/risks', req);
  return data;
}

export async function updateRisk(id: number, req: RiskCreateRequest): Promise<RiskSummary> {
  const { data } = await apiClient.put<RiskSummary>(`/api/v1/risks/${id}`, req);
  return data;
}

export async function deleteRisk(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/risks/${id}`);
}
