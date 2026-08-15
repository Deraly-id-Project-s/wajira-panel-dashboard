import { apiClient } from '@/lib/api/client';
import { LaravelApiResponse, ensureSuccess } from '@/lib/api/response';

export interface CompanyPivot {
  module_id: number;
  company_id: number;
}

export interface ModuleCompany {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  code: string;
  description: string;
  type: string;
  created_at: string | null;
  updated_at: string | null;
  pivot: CompanyPivot;
}

export interface ModuleFeature {
  id: number;
  slug?: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Module {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  created_at: string | null;
  updated_at: string | null;
  features?: ModuleFeature[];
  companies?: ModuleCompany[];
}

export const fetchAllModules = async (): Promise<Module[]> => {
  const response = await apiClient.get<LaravelApiResponse<Module[]>>('/wapi/global/module');
  return ensureSuccess(response.data);
};

export const fetchModuleDetail = async (id: number | string): Promise<Module> => {
  const response = await apiClient.get<LaravelApiResponse<Module>>(`/wapi/global/module/${id}`);
  return ensureSuccess(response.data);
};
