'use client';

import { useState } from 'react';
import { Dialog } from '@/components/shared/Dialog';
import { useDeclaration } from '@/hooks/commercial/useTaxProfile';
import type { DisclosureContext } from '@/types/commercial/Declaration.types';

// Texto del compromiso de formalización, solo para leer: sin casilla ni botón de aceptar.
// Abrirlo no envía nada a la API más que la lectura del texto.
export function CommitmentTextDialog({
  linkText,
  context = 'TAX_PROFILE',
}: {
  linkText: string;
  context?: DisclosureContext;
}) {
  const [open, setOpen] = useState(false);
  const declaration = useDeclaration('FORMALIZATION_COMMITMENT', context, { enabled: open });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-[#03548C] underline underline-offset-2 hover:text-[#023e69]"
      >
        {linkText}
      </button>
      <Dialog open={open} title="Compromiso de formalización" onClose={() => setOpen(false)} size="lg">
        <div className="flex flex-col gap-4">
          {declaration.isPending && (
            <p className="text-sm text-gray-500" role="status">
              Cargando el texto…
            </p>
          )}
          {declaration.isError && (
            <div className="flex flex-col items-start gap-2" role="alert">
              <p className="text-sm text-red-600">No pudimos cargar el texto</p>
              <button
                type="button"
                onClick={() => declaration.refetch()}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reintentar
              </button>
            </div>
          )}
          {declaration.data && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">
              {declaration.data.fullText}
            </p>
          )}
          <p className="text-xs text-gray-500">Este compromiso se manifiesta al aprobar el contrato</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
