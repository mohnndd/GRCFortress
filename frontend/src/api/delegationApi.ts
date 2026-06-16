import { apiClient } from './client';

export interface Delegation {
  id: number;
  delegatorUsername: string;
  delegateUsername: string;
  reason: string | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function getDelegationsGiven(): Promise<Delegation[]> {
  const { data } = await apiClient.get<Delegation[]>('/api/v1/delegations/given');
  return data;
}

export async function getDelegationsReceived(): Promise<Delegation[]> {
  const { data } = await apiClient.get<Delegation[]>('/api/v1/delegations/received');
  return data;
}

export async function createDelegation(req: {
  delegateUsername: string;
  reason?: string;
  validFrom: string;
  validUntil?: string | null;
}): Promise<Delegation> {
  const { data } = await apiClient.post<Delegation>('/api/v1/delegations', req);
  return data;
}

export async function revokeDelegation(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/delegations/${id}`);
}
