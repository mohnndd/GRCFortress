import { apiClient } from './client';

export type IncidentPriority = 'P1' | 'P2' | 'P3';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'CONTAINED' | 'CLOSED' | 'CANCELLED';

export interface IncidentSummary {
  id: number;
  incidentNumber: string;
  title: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  departmentId: number | null;
  departmentName: string | null;
  reportedBy: string;
  assignedTo: string | null;
  detectedAt: string | null;
  resolvedAt: string | null;
  requiresRegulatoryNotification: boolean;
  regulatoryBody: string | null;
  notifiedAt: string | null;
  notificationAttachmentName: string | null;
  rcaRequired: boolean;
  rcaCompleted: boolean;
  rcaOpensObservation: boolean;
  linkedObservationId: number | null;
  createdAt: string;
  createdBy: string | null;
}

export interface IncidentUpdateEntry {
  id: number;
  author: string;
  content: string;
  newStatus: string | null;
  createdAt: string;
}

export interface IncidentDetail extends IncidentSummary {
  description: string | null;
  rcaSummary: string | null;
  updates: IncidentUpdateEntry[];
}

export interface IncidentCreateRequest {
  title: string;
  description: string;
  priority: IncidentPriority;
  departmentId: number | null;
  assignedTo: string;
  detectedAt: string | null;
  requiresRegulatoryNotification: boolean;
  regulatoryBody: string;
  notifiedAt: string | null;
}

export interface IncidentUpdateRequest extends IncidentCreateRequest {
  status: IncidentStatus;
  resolvedAt: string | null;
}

export interface ProgressRequest {
  content: string;
  newStatus: string;
}

export interface RcaRequest {
  rcaRequired: boolean;
  rcaCompleted: boolean;
  rcaSummary: string;
  rcaOpensObservation: boolean;
}

export async function listIncidents(): Promise<IncidentSummary[]> {
  const { data } = await apiClient.get<IncidentSummary[]>('/api/v1/incidents');
  return data;
}

export async function getIncident(id: number): Promise<IncidentDetail> {
  const { data } = await apiClient.get<IncidentDetail>(`/api/v1/incidents/${id}`);
  return data;
}

export async function createIncident(req: IncidentCreateRequest): Promise<IncidentSummary> {
  const { data } = await apiClient.post<IncidentSummary>('/api/v1/incidents', req);
  return data;
}

export async function updateIncident(id: number, req: IncidentUpdateRequest): Promise<IncidentSummary> {
  const { data } = await apiClient.put<IncidentSummary>(`/api/v1/incidents/${id}`, req);
  return data;
}

export async function addProgress(id: number, req: ProgressRequest): Promise<IncidentDetail> {
  const { data } = await apiClient.post<IncidentDetail>(`/api/v1/incidents/${id}/progress`, req);
  return data;
}

export async function uploadNotificationAttachment(id: number, file: File): Promise<IncidentSummary> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<IncidentSummary>(`/api/v1/incidents/${id}/notification-attachment`, form);
  return data;
}

export async function fetchNotificationAttachment(id: number): Promise<string> {
  const response = await apiClient.get<Blob>(`/api/v1/incidents/${id}/notification-attachment`, { responseType: 'blob' });
  return URL.createObjectURL(response.data as Blob);
}

export async function setRca(id: number, req: RcaRequest): Promise<IncidentDetail> {
  const { data } = await apiClient.put<IncidentDetail>(`/api/v1/incidents/${id}/rca`, req);
  return data;
}

export async function deleteIncident(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/incidents/${id}`);
}

export function incidentExportUrl(): string {
  return `${apiClient.defaults.baseURL}/api/v1/incidents/export`;
}
