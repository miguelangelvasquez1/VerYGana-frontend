// components/campaigns/StepIndicator.tsx
'use client';

import React from 'react';
import { Check, Gamepad2, DollarSign, Settings, Upload } from 'lucide-react';

type Step = 'select-game' | 'campaign-details' | 'game-config' | 'upload-assets';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { 
    key: 'select-game', 
    label: 'Seleccionar Juego',
    icon: <Gamepad2 className="w-5 h-5" />
  },
  { 
    key: 'campaign-details', 
    label: 'Detalles de Campaña',
    icon: <DollarSign className="w-5 h-5" />
  },
  { 
    key: 'game-config', 
    label: 'Configuración del Juego',
    icon: <Settings className="w-5 h-5" />
  },
  { 
    key: 'upload-assets', 
    label: 'Subir Assets',
    icon: <Upload className="w-5 h-5" />
  },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                    ${isUpcoming ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                <p
                  className={`
                    mt-2 text-xs sm:text-sm font-medium text-center
                    ${isCurrent ? 'text-blue-600' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${isUpcoming ? 'text-gray-400' : ''}
                  `}
                >
                  {step.label}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2">
                  <div
                    className={`
                      h-full transition-all
                      ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}