import api from './axiosConfig';

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
  const { data } = await api.get('/faq');
  return data;
}

export async function listAllFaqPages(): Promise<FaqPage[]> {
  const { data } = await api.get('/faq/all');
  return data;
}

export async function getFaqPage(slug: string): Promise<FaqPage> {
  const { data } = await api.get(`/faq/${slug}`);
  return data;
}

export async function createFaqPage(req: FaqRequest): Promise<FaqPage> {
  const { data } = await api.post('/faq', req);
  return data;
}

export async function updateFaqPage(id: number, req: FaqRequest): Promise<FaqPage> {
  const { data } = await api.put(`/faq/${id}`, req);
  return data;
}

export async function deleteFaqPage(id: number): Promise<void> {
  await api.delete(`/faq/${id}`);
}
