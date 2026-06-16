import { apiClient } from './client';
import type {
  PolicyListItem,
  PolicyDetail,
  ApprovalCycleDetail,
  PolicyStatus,
  StepStatus,
} from './policyApi';

// Re-export shared types under procedure-friendly aliases
export type ProcedureListItem = PolicyListItem & {
  procedureNumber: string;
  workflowFileName: string | null;
  slaFileName: string | null;
};
export type ProcedureDetail = PolicyDetail & {
  procedureNumber: string;
  workflowFileName: string | null;
  workflowFilePath: string | null;
  slaFileName: string | null;
  slaFilePath: string | null;
};
export type ProcedureStatus = PolicyStatus;
export type { StepStatus };

export async function listProcedures(): Promise<ProcedureListItem[]> {
  const { data } = await apiClient.get<ProcedureListItem[]>('/api/v1/procedures');
  return data;
}

export async function getProcedure(id: number): Promise<ProcedureDetail> {
  const { data } = await apiClient.get<ProcedureDetail>(`/api/v1/procedures/${id}`);
  return data;
}

export async function uploadProcedure(form: {
  files: File[];
  title: string;
  description?: string;
  category?: string;
  changeReason: string;
  changeSummary?: string;
  previousVersionId?: number;
  departmentId?: number;
  product?: string;
  workflowFile?: File;
  slaFile?: File;
}): Promise<ProcedureListItem> {
  const fd = new FormData();
  form.files.forEach((f) => fd.append('files', f));
  fd.append('title', form.title);
  if (form.description) fd.append('description', form.description);
  if (form.category) fd.append('category', form.category);
  fd.append('changeReason', form.changeReason);
  if (form.changeSummary) fd.append('changeSummary', form.changeSummary);
  if (form.previousVersionId != null) fd.append('previousVersionId', String(form.previousVersionId));
  if (form.departmentId != null) fd.append('departmentId', String(form.departmentId));
  if (form.product) fd.append('product', form.product);
  if (form.workflowFile) fd.append('workflowFile', form.workflowFile);
  if (form.slaFile) fd.append('slaFile', form.slaFile);
  const { data } = await apiClient.post<ProcedureListItem>('/api/v1/procedures', fd, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

export async function fetchProcedureAttachment(procedureId: number, type: 'workflow' | 'sla'): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/api/v1/procedures/${procedureId}/attachment/${type}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}

export async function fetchProcedureFileBlob(fileId: number): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/api/v1/procedures/files/${fileId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}

export async function getProcedureCycle(procedureId: number, versionId: number): Promise<ApprovalCycleDetail | null> {
  try {
    const { data } = await apiClient.get<ApprovalCycleDetail>(
      `/api/v1/procedures/${procedureId}/versions/${versionId}/cycle`,
    );
    return data;
  } catch (e: unknown) {
    if ((e as { response?: { status?: number } })?.response?.status === 404) return null;
    throw e;
  }
}

export async function procedurePreApprove(procedureId: number, versionId: number, comments?: string): Promise<void> {
  await apiClient.post(`/api/v1/procedures/${procedureId}/versions/${versionId}/pre-approve`, { comments });
}

export async function procedurePreReject(procedureId: number, versionId: number, comments?: string): Promise<void> {
  await apiClient.post(`/api/v1/procedures/${procedureId}/versions/${versionId}/pre-reject`, { comments });
}

// Step actions reuse the shared approval-steps controller
export { approveStep, rejectStep, delegateStep, postMessage } from './policyApi';
export type { ApprovalCycleDetail, ApprovalStepDetail, PolicyVersionFile as ProcedureVersionFile } from './policyApi';
