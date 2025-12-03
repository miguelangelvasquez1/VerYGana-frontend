// services/locationService.ts
import apiClient from '@/lib/api/client';

export interface Department {
  code: string;
  name: string;
  region?: string;
}

export interface Municipality {
  code: string;
  name: string;
  departmentCode: string;
  population?: number;
}

class LocationService {
  // Obtener todos los departamentos
  async getDepartments(): Promise<Department[]> {
    const response = await apiClient.get<Department[]>('/locations/departments');
    return response.data;
  }

  // Obtener un departamento por código
  async getDepartmentByCode(code: string): Promise<Department> {
    const response = await apiClient.get<Department>(`/locations/departments/${code}`);
    return response.data;
  }

  // Obtener municipios por departamento
  async getMunicipalities(departmentCode: string): Promise<Municipality[]> {
    const response = await apiClient.get<Municipality[]>(
      `/locations/departments/${departmentCode}/municipalities`
    );
    return response.data;
  }

  // Obtener un municipio específico por código
  async getMunicipalityByCode(code: string): Promise<Municipality> {
    const response = await apiClient.get<Municipality>(`/locations/municipalities/${code}`);
    return response.data;
  }

  // Buscar municipios por nombre
  async searchMunicipalities(query: string): Promise<Municipality[]> {
    const response = await apiClient.get<Municipality[]>('/locations/municipalities/search', {
      params: { q: query }
    });
    return response.data;
  }

  // Obtener todos los municipios (sin filtrar por departamento)
  async getAllMunicipalities(): Promise<Municipality[]> {
    const response = await apiClient.get<Municipality[]>('/locations/municipalities');
    return response.data;
  }
}

export const locationService = new LocationService();