import { apiClient } from './client';

export interface Department {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  stakeholderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRequest {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface Stakeholder {
  id: number;
  departmentId: number;
  positionTitle: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  phoneNumber: string;
  emailUsername: string;
  email: string;
  isHead: boolean;
}

export interface StakeholderRequest {
  positionTitle: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  phoneNumber: string;
  emailUsername: string;
}

export async function listDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>('/api/v1/departments');
  return data;
}

export async function createDepartment(req: DepartmentRequest): Promise<Department> {
  const { data } = await apiClient.post<Department>('/api/v1/departments', req);
  return data;
}

export async function updateDepartment(id: number, req: DepartmentRequest): Promise<Department> {
  const { data } = await apiClient.put<Department>(`/api/v1/departments/${id}`, req);
  return data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/departments/${id}`);
}

export async function listStakeholders(departmentId: number): Promise<Stakeholder[]> {
  const { data } = await apiClient.get<Stakeholder[]>(`/api/v1/departments/${departmentId}/stakeholders`);
  return data;
}

export async function addStakeholder(departmentId: number, req: StakeholderRequest): Promise<Stakeholder> {
  const { data } = await apiClient.post<Stakeholder>(`/api/v1/departments/${departmentId}/stakeholders`, req);
  return data;
}

export async function updateStakeholder(
  departmentId: number,
  stakeholderId: number,
  req: StakeholderRequest,
): Promise<Stakeholder> {
  const { data } = await apiClient.put<Stakeholder>(
    `/api/v1/departments/${departmentId}/stakeholders/${stakeholderId}`,
    req,
  );
  return data;
}

export async function deleteStakeholder(departmentId: number, stakeholderId: number): Promise<void> {
  await apiClient.delete(`/api/v1/departments/${departmentId}/stakeholders/${stakeholderId}`);
}

export async function designateHead(departmentId: number, stakeholderId: number): Promise<Stakeholder> {
  const { data } = await apiClient.put<Stakeholder>(
    `/api/v1/departments/${departmentId}/stakeholders/${stakeholderId}/designate-head`,
  );
  return data;
}
