import type { ReactNode } from 'react';

interface TableScrollProps {
  /** Nombre accesible de la región, por ejemplo "Tabla de usuarios, desplazable". */
  label: string;
  className?: string;
  children: ReactNode;
}

// Contenedor de una tabla ancha (spec 014, RN-4): la tabla se desliza dentro de su caja y las sombras de los
// bordes (`.table-scroll`, en globals.css) avisan de que hay más contenido a ese lado. Es una región con foco
// para poder desplazarla con el teclado. Componente de servidor: no tiene estado. `overscroll-x-contain` (que el
// gesto de deslizar no se encadene a la página) es del celular: desde `lg` no va, porque cambia cómo se pinta la
// página y el escritorio no debe cambiar (CA-11, `e2e/panels/lg-parity.spec.ts`).
export default function TableScroll({ label, className = '', children }: TableScrollProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`table-scroll overflow-x-auto max-lg:overscroll-x-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#03548C] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
