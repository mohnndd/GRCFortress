import api from './axiosConfig';

export interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export interface RolePermission {
  id: number;
  roleId: number;
  roleName: string;
  httpMethod: string;
  pathPattern: string;
  label: string | null;
}

export interface Endpoint {
  httpMethod: string;
  pathPattern: string;
  controller: string;
}

export async function listRoles(): Promise<Role[]> {
  const { data } = await api.get('/roles');
  return data;
}

export async function createRole(name: string, description: string): Promise<Role> {
  const { data } = await api.post('/roles', { name, description });
  return data;
}

export async function updateRole(id: number, description: string, isActive: boolean): Promise<Role> {
  const { data } = await api.put(`/roles/${id}`, { description, isActive });
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/roles/${id}`);
}

export async function listPermissions(roleId: number): Promise<RolePermission[]> {
  const { data } = await api.get(`/roles/${roleId}/permissions`);
  return data;
}

export async function addPermission(roleId: number, httpMethod: string, pathPattern: string, label: string): Promise<RolePermission> {
  const { data } = await api.post(`/roles/${roleId}/permissions`, { httpMethod, pathPattern, label });
  return data;
}

export async function deletePermission(permId: number): Promise<void> {
  await api.delete(`/roles/permissions/${permId}`);
}

export async function listEndpoints(): Promise<Endpoint[]> {
  const { data } = await api.get('/roles/endpoints');
  return data;
}
