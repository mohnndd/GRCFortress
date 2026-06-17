import { apiClient } from './client';

export interface TermsDocument {
  id: number;
  documentNumber: string;
  title: string;
  product: string;
  owner: string;
  description: string | null;
  status: string;
  version: string;
  nextReview: string | null;
  attachmentName: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TermsDocumentRequest {
  title: string;
  product: string;
  owner: string;
  description?: string;
  status: string;
  version: string;
  nextReview?: string | null;
}

export async function listTermsDocuments(): Promise<TermsDocument[]> {
  const res = await apiClient.get<TermsDocument[]>('/api/v1/terms-documents');
  return res.data;
}

export async function createTermsDocument(req: TermsDocumentRequest): Promise<TermsDocument> {
  const res = await apiClient.post<TermsDocument>('/api/v1/terms-documents', req);
  return res.data;
}

export async function updateTermsDocument(id: number, req: TermsDocumentRequest): Promise<TermsDocument> {
  const res = await apiClient.put<TermsDocument>(`/api/v1/terms-documents/${id}`, req);
  return res.data;
}

export async function uploadTermsAttachment(id: number, file: File): Promise<TermsDocument> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<TermsDocument>(`/api/v1/terms-documents/${id}/attachment`, form);
  return res.data;
}

export function termsAttachmentUrl(id: number): string {
  return `${apiClient.defaults.baseURL}/api/v1/terms-documents/${id}/attachment`;
}

export async function deleteTermsDocument(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/terms-documents/${id}`);
}
