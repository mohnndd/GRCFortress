import { apiClient } from './client';

export interface FaqPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface FaqRequest {
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  isPublished: boolean;
}

export async function listFaqPages(): Promise<FaqPage[]> {
  const { data } = await apiClient.get<FaqPage[]>('/api/v1/faq');
  return data;
}

export async function listAllFaqPages(): Promise<FaqPage[]> {
  const { data } = await apiClient.get<FaqPage[]>('/api/v1/faq/all');
  return data;
}

export async function getFaqPage(slug: string): Promise<FaqPage> {
  const { data } = await apiClient.get<FaqPage>(`/api/v1/faq/${slug}`);
  return data;
}

export async function createFaqPage(req: FaqRequest): Promise<FaqPage> {
  const { data } = await apiClient.post<FaqPage>('/api/v1/faq', req);
  return data;
}

export async function updateFaqPage(id: number, req: FaqRequest): Promise<FaqPage> {
  const { data } = await apiClient.put<FaqPage>(`/api/v1/faq/${id}`, req);
  return data;
}

export async function deleteFaqPage(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/faq/${id}`);
}
