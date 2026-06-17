import { apiClient } from './client';

export type PolicyStatus =
  | 'DRAFT'
  | 'PENDING_PRE_APPROVAL'
  | 'IN_APPROVAL_CYCLE'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type PolicyVersionStatus =
  | 'DRAFT'
  | 'PENDING_PRE_APPROVAL'
  | 'IN_APPROVAL_CYCLE'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPERSEDED';

export type CycleStatus = 'IN_PROGRESS' | 'COMPLETED_APPROVED' | 'COMPLETED_REJECTED';
export type StepStatus = 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED';

export interface PolicyListItem {
  id: number;
  policyNumber: string;
  title: string;
  category: string | null;
  status: PolicyStatus;
  latestVersionNumber: string | null;
  latestVersionId: number | null;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  departmentId: number | null;
  departmentName: string | null;
  product: string | null;
}

export interface PolicyVersionFile {
  id: number;
  fileName: string;
  fileType: string;
  fileSizeBytes: number | null;
  sortOrder: number;
}

export interface PolicyVersionSummary {
  id: number;
  policyId: number;
  versionNumber: string;
  files: PolicyVersionFile[];
  changeReason: string;
  changeSummary: string | null;
  previousVersionId: number | null;
  status: PolicyVersionStatus;
  preApprovalRequired: boolean;
  preApprovalStatus: string | null;
  preApprovalAssigneeName: string | null;
  isCurrentUserPreApprover: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface PolicyDetail {
  id: number;
  policyNumber: string;
  title: string;
  description: string | null;
  category: string | null;
  status: PolicyStatus;
  versions: PolicyVersionSummary[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  departmentId: number | null;
  departmentName: string | null;
  product: string | null;
}

export interface TeamMember {
  id: number;
  positionTitle: string;
  firstName: string;
  lastName: string;
  emailUsername: string;
}

export interface StepMessage {
  id: number;
  authorUsername: string;
  authorName: string | null;
  message: string;
  createdAt: string;
}

export interface ApprovalStepDetail {
  id: number;
  stepOrder: number;
  departmentName: string;
  departmentId: number;
  assignedToName: string | null;
  assignedToEmailUsername: string | null;
  assignedToId: number | null;
  delegatedToName: string | null;
  delegatedToEmailUsername: string | null;
  delegatedToId: number | null;
  status: StepStatus;
  decision: string | null;
  comments: string | null;
  decidedAt: string | null;
  isCurrentUserActiveActor: boolean;
  departmentTeamMembers: TeamMember[];
  messages: StepMessage[];
}

export interface ApprovalCycleDetail {
  id: number;
  status: CycleStatus;
  currentStepOrder: number;
  initiatedAt: string;
  completedAt: string | null;
  steps: ApprovalStepDetail[];
}

// ── API calls ──────────────────────────────────────────────────────────────

export async function listPolicies(): Promise<PolicyListItem[]> {
  const { data } = await apiClient.get<PolicyListItem[]>('/api/v1/policies');
  return data;
}

export async function getPolicy(id: number): Promise<PolicyDetail> {
  const { data } = await apiClient.get<PolicyDetail>(`/api/v1/policies/${id}`);
  return data;
}

export async function uploadPolicy(form: {
  files: File[];
  title: string;
  description?: string;
  category?: string;
  changeReason: string;
  changeSummary?: string;
  previousVersionId?: number;
  departmentId?: number;
  product?: string;
}): Promise<PolicyListItem> {
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
  const { data } = await apiClient.post<PolicyListItem>('/api/v1/policies', fd, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

/** Fetch a file as a blob (handles JWT auth) and return an object URL. */
export async function fetchFileBlob(fileId: number): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/api/v1/policies/files/${fileId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}

export async function getCycle(policyId: number, versionId: number): Promise<ApprovalCycleDetail | null> {
  try {
    const { data } = await apiClient.get<ApprovalCycleDetail>(
      `/api/v1/policies/${policyId}/versions/${versionId}/cycle`,
    );
    return data;
  } catch (e: unknown) {
    if ((e as { response?: { status?: number } })?.response?.status === 404) return null;
    throw e;
  }
}

export async function preApprove(policyId: number, versionId: number, comments?: string): Promise<void> {
  await apiClient.post(`/api/v1/policies/${policyId}/versions/${versionId}/pre-approve`, { comments });
}

export async function preReject(policyId: number, versionId: number, comments?: string): Promise<void> {
  await apiClient.post(`/api/v1/policies/${policyId}/versions/${versionId}/pre-reject`, { comments });
}

export async function approveStep(stepId: number, comments?: string): Promise<void> {
  await apiClient.post(`/api/v1/approval-steps/${stepId}/approve`, { comments });
}

export async function rejectStep(stepId: number, comments?: string): Promise<void> {
  await apiClient.post(`/api/v1/approval-steps/${stepId}/reject`, { comments });
}

export async function delegateStep(stepId: number, stakeholderId: number): Promise<void> {
  await apiClient.post(`/api/v1/approval-steps/${stepId}/delegate`, { stakeholderId });
}

export async function postMessage(stepId: number, message: string): Promise<StepMessage> {
  const { data } = await apiClient.post<StepMessage>(`/api/v1/approval-steps/${stepId}/messages`, { message });
  return data;
}

export interface PolicyAcknowledgement {
  id: number;
  username: string;
  fullName: string | null;
  versionNumber: string | null;
  acknowledgedAt: string;
}

export async function acknowledgePoliciy(policyId: number): Promise<void> {
  await apiClient.post(`/api/v1/policies/${policyId}/acknowledge`);
}

export async function listAcknowledgements(policyId: number): Promise<PolicyAcknowledgement[]> {
  const { data } = await apiClient.get<PolicyAcknowledgement[]>(`/api/v1/policies/${policyId}/acknowledgements`);
  return data;
}
