import { apiClient } from './client';

export type ReportType = 'ISSUE' | 'SUGGESTION';
export type ReportedItemStatus = 'NEW' | 'UNDER_REVIEW' | 'IN_DEVELOPMENT' | 'DEPLOYED';

export interface ReportedItemSummary {
  id: number;
  reportType: ReportType;
  title: string;
  description: string;
  status: ReportedItemStatus;
  reporterUsername: string;
  attachmentFileName: string | null;
  attachmentFileType: string | null;
  attachmentFileSizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportedItemMessage {
  id: number;
  authorUsername: string;
  message: string;
  createdAt: string;
}

export interface ReportedItemDetail extends ReportedItemSummary {
  messages: ReportedItemMessage[];
}

export async function listReportedItems(): Promise<ReportedItemSummary[]> {
  const { data } = await apiClient.get<ReportedItemSummary[]>('/api/v1/reported-items');
  return data;
}

export async function createReportedItem(form: {
  reportType: ReportType;
  title: string;
  description: string;
  attachment?: File | null;
}): Promise<ReportedItemSummary> {
  const fd = new FormData();
  fd.append('reportType', form.reportType);
  fd.append('title', form.title);
  fd.append('description', form.description);
  if (form.attachment) {
    fd.append('attachment', form.attachment);
  }
  const { data } = await apiClient.post<ReportedItemSummary>('/api/v1/reported-items', fd, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

export async function getReportedItem(id: number): Promise<ReportedItemDetail> {
  const { data } = await apiClient.get<ReportedItemDetail>(`/api/v1/reported-items/${id}`);
  return data;
}

export async function updateReportedItemStatus(
  id: number,
  status: ReportedItemStatus,
): Promise<ReportedItemDetail> {
  const { data } = await apiClient.put<ReportedItemDetail>(`/api/v1/reported-items/${id}/status`, { status });
  return data;
}

export async function addReportedItemMessage(id: number, message: string): Promise<ReportedItemMessage> {
  const { data } = await apiClient.post<ReportedItemMessage>(`/api/v1/reported-items/${id}/messages`, { message });
  return data;
}

export async function fetchReportedItemAttachment(id: number): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/api/v1/reported-items/${id}/attachment`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}
