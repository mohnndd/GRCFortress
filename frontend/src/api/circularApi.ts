import { apiClient } from './client';

export interface CircularSummary {
  id: number;
  circularNumber: string;
  issuer: string;
  description: string;
  departmentId: number | null;
  departmentName: string | null;
  attachmentFileName: string | null;
  attachmentFileType: string | null;
  attachmentFileSizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function listCirculars(): Promise<CircularSummary[]> {
  const { data } = await apiClient.get<CircularSummary[]>('/api/v1/circulars');
  return data;
}

export async function createCircular(params: {
  issuer: string;
  description: string;
  departmentId: number | null;
  attachment: File | null;
}): Promise<CircularSummary> {
  const form = new FormData();
  form.append('issuer', params.issuer);
  form.append('description', params.description);
  if (params.departmentId != null) form.append('departmentId', String(params.departmentId));
  if (params.attachment) form.append('attachment', params.attachment);
  const { data } = await apiClient.post<CircularSummary>('/api/v1/circulars', form);
  return data;
}

export async function updateCircular(id: number, params: {
  issuer: string;
  description: string;
  departmentId: number | null;
  attachment: File | null;
}): Promise<CircularSummary> {
  const form = new FormData();
  form.append('issuer', params.issuer);
  form.append('description', params.description);
  if (params.departmentId != null) form.append('departmentId', String(params.departmentId));
  if (params.attachment) form.append('attachment', params.attachment);
  const { data } = await apiClient.put<CircularSummary>(`/api/v1/circulars/${id}`, form);
  return data;
}

export async function deleteCircular(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/circulars/${id}`);
}

export async function fetchCircularAttachment(id: number): Promise<string> {
  const response = await apiClient.get(`/api/v1/circulars/${id}/attachment`, { responseType: 'blob' });
  return URL.createObjectURL(response.data);
}
