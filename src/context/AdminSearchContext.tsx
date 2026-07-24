'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AdminSearchContextValue {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  placeholder: string;
  setPlaceholder: (value: string) => void;
}

const AdminSearchContext = createContext<AdminSearchContextValue | null>(null);

export function AdminSearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [placeholder, setPlaceholder] = useState('Buscar...');

  return (
    <AdminSearchContext.Provider
      value={{ searchTerm, setSearchTerm, placeholder, setPlaceholder }}
    >
      {children}
    </AdminSearchContext.Provider>
  );
}

export function useAdminSearch() {
  const ctx = useContext(AdminSearchContext);
  if (!ctx) {
    throw new Error('useAdminSearch must be used within an AdminSearchProvider');
  }
  return ctx;
}

/**
 * Registra la barra de búsqueda del header para la sección admin montada,
 * fijando su placeholder y limpiando el término al salir de la sección
 * para que no se filtre hacia otra página.
 */
export function useAdminSectionSearch(placeholder: string) {
  const { searchTerm, setSearchTerm, setPlaceholder } = useAdminSearch();

  useEffect(() => {
    setPlaceholder(placeholder);
    setSearchTerm('');
    return () => setSearchTerm('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder]);

  return { searchTerm, setSearchTerm };
}
