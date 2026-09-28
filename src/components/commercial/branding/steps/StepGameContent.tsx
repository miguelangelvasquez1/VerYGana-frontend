'use client';

import React from 'react';
import { Puzzle } from 'lucide-react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';

import type { GameBriefRequirements } from '@/services/BrandingRequestService';

import { BRIEF_WIDGETS, RJSF_TEMPLATES } from '@/components/game-designer/rjsf/registry';

interface Props {
  /** Lo carga el wizard: necesita saber si este paso existe antes de pintar el stepper. */
  requirements: GameBriefRequirements;
  gameName: string;
  requestId: number | null;
  content: Record<string, unknown>;
  submitting: boolean;
  onChange: (content: Record<string, unknown>) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * El contenido que solo la marca puede dar: las preguntas de la trivia con su
 * respuesta correcta, las palabras de la sopa de letras, las imágenes del memoria.
 *
 * Hasta ahora no se pedía en ningún lado, pero el esquema sí se lo exige al
 * diseñador para poder entregar — así que el diseñador terminaba inventándolo. El
 * formulario no está escrito campo por campo: se genera con el mismo RJSF y los
 * mismos widgets que usa el diseñador, a partir del esquema recortado que devuelve
 * el backend. Un juego nuevo aparece acá solo, sin tocar este archivo.
 */
export const StepGameContent: React.FC<Props> = ({
  requirements,
  gameName,
  requestId,
  content,
  submitting,
  onChange,
  onBack,
  onNext,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-start gap-2">
        <Puzzle size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-gray-900">Contenido de {gameName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Esto solo lo sabe tu marca, así que nadie puede completarlo por vos.
          </p>
        </div>
      </div>

      {/*
        Reemplaza un texto genérico que no decía nada accionable. Cada línea responde
        una pregunta concreta que el anunciante se hace acá: cuándo puedo corregirlo,
        quién lo va a tocar después, y qué hago si el juego no queda como lo escribí.
      */}
      <ul className="text-sm text-gray-600 space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <li className="flex gap-2">
          <span className="text-gray-400 shrink-0">1.</span>
          <span>
            <b className="font-medium text-gray-800">Se guarda al continuar.</b> Podés
            volver y cambiarlo mientras la solicitud siga en borrador; una vez enviada,
            ya no.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-400 shrink-0">2.</span>
          <span>
            <b className="font-medium text-gray-800">No pasa directo al juego.</b>{' '}
            Cuando se apruebe la solicitud, esto aparece cargado en el formulario del
            diseñador. Si encuentra algo que no funciona —una respuesta correcta
            marcada en la opción equivocada, una palabra que no entra en el tablero— lo
            corrige ahí.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-400 shrink-0">3.</span>
          <span>
            <b className="font-medium text-gray-800">Vos tenés la última palabra.</b>{' '}
            Antes de que la campaña se publique vas a poder jugar una vista previa con
            tu contenido ya montado. Si algo no quedó como lo escribiste, pedís cambios
            desde ahí.
          </span>
        </li>
      </ul>

      <Form
        schema={(requirements.jsonSchema ?? {}) as RJSFSchema}
        uiSchema={(requirements.uiSchema ?? {}) as Record<string, unknown>}
        formData={content}
        validator={validator}
        // El backend valida lo mismo al guardar; esto es para que el anunciante lo
        // vea mientras escribe y no al final, con el paso ya cerrado.
        liveValidate
        showErrorList={false}
        widgets={BRIEF_WIDGETS}
        templates={RJSF_TEMPLATES}
        formContext={{ brandingRequestId: requestId }}
        onChange={e => onChange(e.formData ?? {})}
      >
        {/* Sin botón propio: el wizard maneja la navegación */}
        <></>
      </Form>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60 cursor-pointer"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? 'Guardando…' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};
