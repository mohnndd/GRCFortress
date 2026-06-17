import { apiClient } from './client';

export interface Contract {
  id: number;
  contractNumber: string;
  title: string;
  counterparty: string;
  contractType: string;
  departmentOwner: string;
  value: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  status: string;
  description: string | null;
  attachmentName: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractRequest {
  title: string;
  counterparty: string;
  contractType: string;
  departmentOwner: string;
  value?: number | null;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  renewalDate?: string | null;
  status: string;
  description?: string;
}

export async function listContracts(): Promise<Contract[]> {
  const { data } = await apiClient.get<Contract[]>('/api/v1/contracts');
  return data;
}

export async function createContract(req: ContractRequest): Promise<Contract> {
  const { data } = await apiClient.post<Contract>('/api/v1/contracts', req);
  return data;
}

export async function updateContract(id: number, req: ContractRequest): Promise<Contract> {
  const { data } = await apiClient.put<Contract>(`/api/v1/contracts/${id}`, req);
  return data;
}

export async function uploadContractAttachment(id: number, file: File): Promise<Contract> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<Contract>(`/api/v1/contracts/${id}/attachment`, form);
  return data;
}

export function contractAttachmentUrl(id: number): string {
  return `${apiClient.defaults.baseURL}/api/v1/contracts/${id}/attachment`;
}

export async function deleteContract(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/contracts/${id}`);
}

export function contractsExportUrl(): string {
  return `${apiClient.defaults.baseURL}/api/v1/contracts/export`;
}
