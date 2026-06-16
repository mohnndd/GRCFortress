import { apiClient } from './client';

export type ObservationStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_CLOSURE' | 'CLOSED';

export interface ObservationListItem {
  id: number;
  observationNumber: string;
  name: string;
  status: ObservationStatus;
  creatorDepartmentName: string;
  receivingDepartmentName: string;
  proposedTargetDate: string | null;
  confirmedTargetDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface ObservationMessageDto {
  id: number;
  authorUsername: string;
  authorName: string | null;
  message: string;
  createdAt: string;
}

export interface ClosureRequestDto {
  id: number;
  evidenceFileName: string | null;
  evidenceFilePath: string | null;
  notes: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason: string | null;
  submittedBy: string | null;
  submittedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface ObservationDetail extends ObservationListItem {
  description: string | null;
  controlViolation: string | null;
  isRegulationRelated: boolean;
  regulationFileName: string | null;
  regulationFilePath: string | null;
  linkedCircularId: number | null;
  linkedCircularNumber: string | null;
  linkedCircularIssuer: string | null;
  messages: ObservationMessageDto[];
  closureRequests: ClosureRequestDto[];
  currentUserIsInCreatorDept: boolean;
  currentUserIsInReceivingDept: boolean;
}

export async function listObservations(): Promise<ObservationListItem[]> {
  const { data } = await apiClient.get<ObservationListItem[]>('/api/v1/observations');
  return data;
}

export async function getObservation(id: number): Promise<ObservationDetail> {
  const { data } = await apiClient.get<ObservationDetail>(`/api/v1/observations/${id}`);
  return data;
}

export async function createObservation(form: {
  name: string;
  description?: string;
  controlViolation?: string;
  isRegulationRelated: boolean;
  proposedTargetDate?: string;
  receivingDepartmentId: number;
  regulationFile?: File;
  linkedCircularId?: number | null;
}): Promise<ObservationListItem> {
  const fd = new FormData();
  fd.append('name', form.name);
  if (form.description) fd.append('description', form.description);
  if (form.controlViolation) fd.append('controlViolation', form.controlViolation);
  fd.append('isRegulationRelated', String(form.isRegulationRelated));
  if (form.proposedTargetDate) fd.append('proposedTargetDate', form.proposedTargetDate);
  fd.append('receivingDepartmentId', String(form.receivingDepartmentId));
  if (form.regulationFile) fd.append('regulationFile', form.regulationFile);
  if (form.linkedCircularId != null) fd.append('linkedCircularId', String(form.linkedCircularId));
  const { data } = await apiClient.post<ObservationListItem>('/api/v1/observations', fd, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

export async function confirmTargetDate(id: number, confirmedTargetDate: string): Promise<void> {
  await apiClient.post(`/api/v1/observations/${id}/confirm-date`, { confirmedTargetDate });
}

export async function postObservationMessage(id: number, message: string): Promise<ObservationMessageDto> {
  const { data } = await apiClient.post<ObservationMessageDto>(`/api/v1/observations/${id}/messages`, { message });
  return data;
}

export async function requestClosure(id: number, notes?: string, evidenceFile?: File): Promise<void> {
  const fd = new FormData();
  if (notes) fd.append('notes', notes);
  if (evidenceFile) fd.append('evidenceFile', evidenceFile);
  await apiClient.post(`/api/v1/observations/${id}/request-closure`, fd, {
    headers: { 'Content-Type': undefined },
  });
}

export async function acceptClosure(id: number): Promise<void> {
  await apiClient.post(`/api/v1/observations/${id}/accept-closure`, {});
}

export async function rejectClosure(id: number, rejectionReason?: string): Promise<void> {
  await apiClient.post(`/api/v1/observations/${id}/reject-closure`, { rejectionReason });
}

export async function fetchObservationFile(id: number, type: 'regulation'): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/api/v1/observations/${id}/files/${type}`, { responseType: 'blob' });
  return URL.createObjectURL(data);
}

export async function fetchEvidenceFile(id: number, closureRequestId: number): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/api/v1/observations/${id}/files/evidence/${closureRequestId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}
