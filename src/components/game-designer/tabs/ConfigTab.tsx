'use client';

import React, { useCallback } from 'react';
import { Gamepad2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { type DesignerBrandingDetail } from '@/services/GameDesignerService';

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
}

export const ConfigTab: React.FC<Props> = ({ detail, gameConfig, onFormChange }) => {
  const canEdit = ['APPROVED', 'DESIGN_IN_PROGRESS', 'CHANGES_REQUESTED'].includes(detail.status);

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

  return (
    <div className="p-5 space-y-5">
      {!detail.gameSchema ? (
        <div className="py-8 text-center">
          <Gamepad2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">El esquema de configuración no está disponible para esta solicitud.</p>
        </div>
      ) : (
        <div className="rjsf-wrapper">
          <div className="flex justify-end mb-2">
            {canEdit ? (
              <div className="relative group">
                <button type="button" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Info size={13} />
                  Guardado automático
                </button>
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Los cambios se guardan automáticamente mientras editas. No necesitas hacer nada extra.
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Solo lectura en el estado actual</span>
            )}
          </div>
          <Form
            schema={detail.gameSchema.jsonSchema as any}
            uiSchema={detail.gameSchema.uiSchema as any}
            formData={gameConfig}
            disabled={!canEdit}
            validator={validator}
            widgets={rjsfWidgets}
            templates={rjsfTemplates}
            formContext={{ brandingRequestId: detail.id }}
            onChange={onFormChange}
            transformErrors={transformErrors}
            onError={() => toast.error('Hay campos con errores. Corrígelos antes de enviar.')}
          >
            <></>
          </Form>
        </div>
      )}
    </div>
  );
};

export default ConfigTab;
