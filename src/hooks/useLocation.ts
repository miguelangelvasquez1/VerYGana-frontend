import { useState, useEffect } from 'react';
import { adService, Department, Municipality } from '@/lib/api/adService';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const data = await adService.getDepartments();
        setDepartments(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar departamentos');
        console.error('Error fetching departments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return { departments, loading, error };
}

export function useMunicipalities(departmentCode: string | null) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentCode) {
      setMunicipalities([]);
      return;
    }

    const fetchMunicipalities = async () => {
      try {
        setLoading(true);
        const data = await adService.getMunicipalities(departmentCode);
        setMunicipalities(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar municipios');
        console.error('Error fetching municipalities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipalities();
  }, [departmentCode]);

  return { municipalities, loading, error };
}