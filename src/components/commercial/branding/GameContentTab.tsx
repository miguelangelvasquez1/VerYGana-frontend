'use client';

import React from 'react';
import { Loader2, Lock, Puzzle } from 'lucide-react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';

import type { GameBriefRequirements } from '@/services/BrandingRequestService';
import { BRIEF_WIDGETS, RJSF_TEMPLATES } from '@/components/game-designer/rjsf/registry';

interface Props {
  requirements: GameBriefRequirements;
  content: Record<string, unknown>;
  /** Solo en borrador: después de enviar, el contenido ya viajó al diseñador. */
  editable: boolean;
  saving: boolean;
  onChange: (content: Record<string, unknown>) => void;
  onSave: () => void;
}

/**
 * El contenido del juego dentro del detalle de una solicitud.
 *
 * El asistente de creación tiene su propio paso, pero una solicitud creada antes de
 * que ese paso existiera —o dejada a medias— no tenía dónde completarse: el
 * anunciante veía el detalle sin ningún lugar donde escribir las palabras, y el
 * envío lo rechazaba por falta de contenido sin ofrecer cómo arreglarlo.
 */
export const GameContentTab: React.FC<Props> = ({
  requirements,
  content,
  editable,
  saving,
  onChange,
  onSave,
}) => (
  <div className="p-5 space-y-4">
    <div className="flex items-start gap-2">
      <Puzzle size={18} className="text-blue-600 shrink-0 mt-0.5" />
      <div>
        <h3 className="font-medium text-gray-900">Contenido de {requirements.gameName}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Esto solo lo sabe tu marca, así que nadie puede completarlo por vos. El
          diseñador lo recibe cargado y puede corregir lo que no funcione en el juego;
          vos ves el resultado en la vista previa antes de que la campaña se publique.
        </p>
      </div>
    </div>

    {!editable && (
      <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <Lock size={15} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600">
          La solicitud ya fue enviada, así que el contenido queda como está. Si algo
          hay que cambiar, pedilo por comentarios: el diseñador lo ajusta antes de
          entregar.
        </p>
      </div>
    )}

    <Form
      schema={(requirements.jsonSchema ?? {}) as RJSFSchema}
      uiSchema={(requirements.uiSchema ?? {}) as Record<string, unknown>}
      formData={content}
      disabled={!editable}
      validator={validator}
      // El backend valida lo mismo al guardar; esto es para verlo mientras se escribe.
      liveValidate={editable}
      showErrorList={false}
      widgets={BRIEF_WIDGETS}
      templates={RJSF_TEMPLATES}
      onChange={e => onChange(e.formData ?? {})}
    >
      {/* Sin botón propio: el guardado va abajo, junto al resto de la pestaña */}
      <></>
    </Form>

    {editable && (
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Guardando…' : 'Guardar contenido'}
        </button>
      </div>
    )}
  </div>
);

export default GameContentTab;
