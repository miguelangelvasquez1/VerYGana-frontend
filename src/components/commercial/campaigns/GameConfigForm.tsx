// components/campaigns/GameConfigForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Form from '@rjsf/core';
import CustomFieldTemplate from './ui/FieldTemplate';
import CustomObjectFieldTemplate from './ui/ObjectFieldTemplate';
import CustomArrayFieldTemplate from './ui/ArrayFieldTemplate';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Eye, 
  EyeOff,
  Loader2,
  Settings,
  Palette,
  Music,
  Type,
  Gamepad2
} from 'lucide-react';

// Import custom widgets
import { AssetWidget } from './widgets/AssetWidget';
import { ColorPickerWidget } from './widgets/ColorPickerWidget';
import { ImagePreviewWidget } from './widgets/ImagePreviewWidget';
import { CheckboxWidget } from './widgets/CheckboxWidget';
import RadioWidget from './widgets/RadioWidget';
import RangeWidget from './widgets/RangeWidget';
import { TextInputWidget } from './widgets/TextInputWidget';
import { number } from 'zod';
import { DecimalInputWidget } from './widgets/DecimalInputWidget';
import { NumberInputWidget } from './widgets/NumberInputWidget';

interface GameConfigFormProps {
  gameTitle: string;
  jsonSchema: RJSFSchema;
  uiSchema?: UiSchema;
  initialData?: any;
  loading?: boolean;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function GameConfigForm({
  gameTitle,
  jsonSchema,
  uiSchema = {},
  initialData,
  loading = false,
  onSubmit,
  onBack,
}: GameConfigFormProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Custom widgets registry
  const widgets = useMemo(() => ({
    assetUpload: AssetWidget,
    colorPicker: ColorPickerWidget,
    imagePreview: ImagePreviewWidget,
    range: RangeWidget,
    radio: RadioWidget,
    checkbox: CheckboxWidget,
    textInput: TextInputWidget,
    numberInput: NumberInputWidget,
    decimalInput: DecimalInputWidget,
  }), []);

  // Enhanced UI Schema with icons and colors for sections
  const enhancedUiSchema = useMemo(() => {
    return {
      ...uiSchema,
      game_config: {
        ...uiSchema?.game_config,
        'ui:icon': <Settings className="w-5 h-5 text-blue-600" />,
        'ui:color': 'blue',
      },
      branding: {
        ...uiSchema?.branding,
        'ui:icon': <Palette className="w-5 h-5 text-purple-600" />,
        'ui:color': 'purple',
      },
      audio: {
        ...uiSchema?.audio,
        'ui:icon': <Music className="w-5 h-5 text-green-600" />,
        'ui:color': 'green',
      },
      texts: {
        ...uiSchema?.texts,
        'ui:icon': <Type className="w-5 h-5 text-orange-600" />,
        'ui:color': 'orange',
      },
      game: {
        ...uiSchema?.game,
        'ui:icon': <Gamepad2 className="w-5 h-5 text-indigo-600" />,
        'ui:color': 'indigo',
      },
    };
  }, [uiSchema]);

  // Handle form data changes
  const normalizeEmptyStrings = (data: any): any => {
    if (Array.isArray(data)) {
      return data.map(normalizeEmptyStrings);
    }

    if (data && typeof data === "object") {
      const newObj: any = {};
      for (const key in data) {
        newObj[key] = normalizeEmptyStrings(data[key]);
      }
      return newObj;
    }

    if (data === "") {
      return null;
    }

    return data;
  };

  const handleFormChange = (e: any) => {
    const cleanedData = normalizeEmptyStrings(e.formData);
    setFormData(cleanedData);
  };

  // Handle form submission
  const handleFormSubmit = (e: any) => {
    setValidationErrors([]);
    onSubmit(e.formData);
  };

  // Handle validation errors
  const handleError = (errors: any) => {
    console.error('Form validation errors:', errors);
    setValidationErrors(errors);
    
    // Scroll to first error
    setTimeout(() => {
      const firstError = document.querySelector('[class*="border-red"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
        <span className="text-gray-700 font-medium">Cargando configuración del juego...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Configuración: {gameTitle}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Personaliza los elementos visuales, audio y contenido del juego
          </p>
        </div>
        
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-4 py-2 hover:bg-blue-50"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Ocultar Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Ver JSON
            </>
          )}
        </button>
      </div>

      {/* Validation Errors Summary */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800">
                Se encontraron {validationErrors.length} errores de validación
              </h4>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {validationErrors.slice(0, 5).map((error, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>{error.stack}</span>
                  </li>
                ))}
              </ul>
              {validationErrors.length > 5 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  + {validationErrors.length - 5} errores más
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="space-y-6">
            <Form
              schema={jsonSchema}
              uiSchema={enhancedUiSchema}
              formData={formData}
              validator={validator}
              widgets={widgets}
              onChange={handleFormChange}
              onSubmit={handleFormSubmit}
              onError={handleError}
              showErrorList={false}
              noHtml5Validate={true}
              templates={{
                FieldTemplate: CustomFieldTemplate,
                ObjectFieldTemplate: CustomObjectFieldTemplate,
                ArrayFieldTemplate: CustomArrayFieldTemplate,
              }}
            >
              {/* Custom Submit Buttons */}
              <div className="flex justify-between pt-6 mt-8 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all flex items-center font-medium text-sm shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all flex items-center font-semibold text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </Form>
          </div>
        </div>

        {/* JSON Preview Column */}
        {showPreview && (
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* JSON Display */}
              <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border-2 border-gray-800">
                <div className="bg-gray-800 px-5 py-3 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-sm font-mono text-gray-300 ml-2">config.json</p>
                  </div>
                  <span className="text-xs text-gray-400">Live Preview</span>
                </div>
                <div className="p-5 max-h-[calc(100vh-240px)] overflow-auto custom-scrollbar">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {JSON.stringify(formData, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Vista Previa en Tiempo Real
                </h4>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <p className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                    <span>Los cambios se reflejan automáticamente</span>
                  </p>
                  <p className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                    <span>Este JSON se enviará al servidor al continuar</span>
                  </p>
                  <p className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                    <span>Puedes copiar el contenido para pruebas</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 0, 0.5);
        }
      `}</style>
    </div>
  );
}