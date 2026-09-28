'use client';

import React from 'react';
import { Quote } from 'lucide-react';

/**
 * El contenido que escribió la marca, en modo lectura.
 *
 * No se dibuja con RJSF a propósito: el diseñador ya tiene ese mismo contenido en su
 * formulario, editable y sembrado en el borrador. Esto es la copia original contra la
 * que comparar, así que se muestra como texto plano y sin controles — dos formularios
 * idénticos, uno editable y otro no, se confunden en dos segundos.
 */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Aplana lo que traiga el brief sin saber de qué juego es: no hay lógica por juego. */
const renderValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === '') return <span className="text-gray-400">—</span>;

  if (Array.isArray(value)) {
    return (
      <ol className="space-y-2 mt-1">
        {value.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gray-400 text-xs mt-0.5 shrink-0 w-5 text-right">{i + 1}.</span>
            <div className="min-w-0 flex-1">{renderValue(item)}</div>
          </li>
        ))}
      </ol>
    );
  }

  if (isRecord(value)) {
    return (
      <div className="space-y-0.5">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-sm">
            <span className="text-gray-500 shrink-0">{k}:</span>
            <span className="text-gray-900 min-w-0 break-words">{renderValue(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-gray-900 break-words">{String(value)}</span>;
};

interface Props {
  briefData: Record<string, unknown> | null;
}

export const BrandContentSection: React.FC<Props> = ({ briefData }) => {
  // Los juegos que no piden contenido escrito no muestran nada.
  const blocks = briefData ? Object.entries(briefData).filter(([, v]) => v != null) : [];
  if (blocks.length === 0) return null;

  return (
    <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-3">
      <div className="flex items-start gap-2">
        <Quote size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Contenido enviado por la marca</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Ya está cargado en tu formulario, en la pestaña Configuración. Podés
            corregirlo si algo no funciona en el juego —una respuesta correcta mal
            marcada, una palabra que no entra en el tablero—, pero el anunciante espera
            ver esto: si cambiás el sentido de algo, déjalo dicho en un comentario.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-blue-100 p-3 space-y-3 max-h-96 overflow-y-auto">
        {blocks.map(([block, value]) => (
          <div key={block}>
            {isRecord(value) ? (
              Object.entries(value).map(([field, fieldValue]) => (
                <div key={field}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field}</p>
                  {renderValue(fieldValue)}
                </div>
              ))
            ) : (
              <>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{block}</p>
                {renderValue(value)}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandContentSection;
