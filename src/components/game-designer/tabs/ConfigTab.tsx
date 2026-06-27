'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gamepad2, Info, Loader2, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { saveDesignerNotes, type DesignerBrandingDetail } from '@/services/GameDesignerService';

import TextInputWidget from '../rjsf/widgets/TextInputWidget';
import NumberInputWidget from '../rjsf/widgets/NumberInputWidget';
import ColorPickerWidget from '../rjsf/widgets/ColorPickerWidget';
import CheckboxWidget from '../rjsf/widgets/CheckboxWidget';
import RadioWidget from '../rjsf/widgets/RadioWidget';
import RangeWidget from '../rjsf/widgets/RangeWidget';
import DecimalInputWidget from '../rjsf/widgets/DecimalInputWidget';
import AssetWidget from '../rjsf/widgets/AssetWidget';
import ImagePreviewWidget from '../rjsf/widgets/ImagePreviewWidget';
import FieldTemplate from '../rjsf/templates/FieldTemplate';
import ObjectFieldTemplate from '../rjsf/templates/ObjectFieldTemplate';
import ArrayFieldTemplate from '../rjsf/templates/ArrayFieldTemplate';
import ErrorListTemplate from '../rjsf/templates/ErrorListTemplate';

const rjsfWidgets = {
  textInput: TextInputWidget,
  numberInput: NumberInputWidget,
  colorPicker: ColorPickerWidget,
  imagePreview: ImagePreviewWidget,
  checkbox: CheckboxWidget,
  radio: RadioWidget,
  range: RangeWidget,
  decimalInput: DecimalInputWidget,
  assetUpload: AssetWidget,
  switch: CheckboxWidget,
  slider: RangeWidget,
  color: ColorPickerWidget,
};

const rjsfTemplates = { FieldTemplate, ObjectFieldTemplate, ArrayFieldTemplate, ErrorListTemplate };

interface Props {
  detail: DesignerBrandingDetail;
  gameConfig: Record<string, unknown>;
  onFormChange: (e: { formData?: Record<string, unknown> }) => void;
  onValidated: (e: { formData?: Record<string, unknown> }) => void;
  submitting: boolean;
  showSubmitConfirm: boolean;
  setShowSubmitConfirm: (v: boolean) => void;
  onSubmitDesign: () => void;
  canSubmit: boolean;
  isChangesRequested: boolean;
}

export const ConfigTab: React.FC<Props> = ({
  detail,
  gameConfig,
  onFormChange,
  onValidated,
  submitting,
  showSubmitConfirm,
  setShowSubmitConfirm,
  onSubmitDesign,
  canSubmit,
  isChangesRequested,
}) => {
  const formRef = useRef<any>(null);
  const [notes, setNotes] = useState(detail.designerNotes ?? '');
  const [notesSaving, setNotesSaving] = useState(false);

  // Sync notes if we switch to a different request
  useEffect(() => {
    setNotes(detail.designerNotes ?? '');
  }, [detail.id]);

  const transformErrors = useCallback((errors: any[]) => {
    const uiSchema = detail.gameSchema?.uiSchema as Record<string, any> | undefined;
    if (!uiSchema) return errors;

    return errors.flatMap(error => {
      if (!['type', 'format', 'required'].includes(error.name)) return [error];

      const parts = (error.property ?? '').replace(/^\./, '').split('.').filter(Boolean);

      let uiNode: Record<string, any> = uiSchema;
      for (const part of parts) uiNode = uiNode[part] ?? {};
      if (uiNode['ui:widget'] !== 'assetUpload') return [error];

      // Check if there's already a valid asset value at this path
      if (error.name === 'type') {
        let val: unknown = gameConfig;
        for (const part of parts) val = (val as Record<string, unknown>)?.[part];
        if (val && typeof val === 'object' && 'assetId' in val && 'url' in val) return [];
      }

      return [{ ...error, message: 'Debes subir un asset' }];
    });
  }, [detail.gameSchema?.uiSchema, gameConfig]);

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await saveDesignerNotes(detail.id, notes);
      toast.success('Notas guardadas');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar las notas');
    } finally {
      setNotesSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-5">

      {/* RJSF form */}
      {!detail.gameSchema ? (
        <div className="py-8 text-center">
          <Gamepad2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">El esquema de configuración no está disponible para esta solicitud.</p>
        </div>
      ) : (
        <div className="rjsf-wrapper">
          <div className="flex justify-end mb-2">
            <div className="relative group">
              <button type="button" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
                <Info size={13} />
                Guardado automático
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Los cambios se guardan automáticamente mientras editas. No necesitas hacer nada extra.
              </div>
            </div>
          </div>
          <Form
            ref={formRef}
            schema={detail.gameSchema.jsonSchema as any}
            uiSchema={detail.gameSchema.uiSchema as any}
            formData={gameConfig}
            validator={validator}
            widgets={rjsfWidgets}
            templates={rjsfTemplates}
            formContext={{ brandingRequestId: detail.id }}
            onChange={onFormChange}
            onSubmit={onValidated}
            transformErrors={transformErrors}
            onError={() => toast.error('Hay campos con errores. Corrígelos antes de enviar.')}
          >
            <></>
          </Form>
        </div>
      )}

      {/* Notas para el anunciante */}
      <div className="pt-5 border-t border-gray-100 space-y-2">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Notas para el anunciante</p>
        {isChangesRequested && (
          <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
            El feedback del anunciante aparece en el banner de arriba. Usa este campo para responder o dejar notas adicionales.
          </p>
        )}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Instrucciones para el anunciante, comentarios sobre la integración..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{notes.length}/1000</span>
          <button
            onClick={handleSaveNotes}
            disabled={notesSaving}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {notesSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Guardar notas
          </button>
        </div>
      </div>

      {/* Enviar para revisión */}
      {canSubmit && (
        <div className="pt-5 border-t border-gray-100">
          {!showSubmitConfirm ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 text-sm">¿Listo para enviar al anunciante?</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  El anunciante revisará tu diseño y podrá aprobarlo o solicitar cambios.
                </p>
              </div>
              <button
                onClick={() => formRef.current?.submit()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors cursor-pointer shrink-0"
              >
                <Send size={15} />
                Enviar para revisión
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-900">¿Confirmas el envío al anunciante?</p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSubmitDesign}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Confirmar envío
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigTab;
