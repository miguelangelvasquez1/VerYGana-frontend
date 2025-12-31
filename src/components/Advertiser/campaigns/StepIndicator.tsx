// components/campaigns/StepIndicator.tsx
'use client';

import React from 'react';
import { Check } from 'lucide-react';

type Step = 'select-game' | 'campaign-details' | 'upload-assets';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps = [
  { id: 'select-game' as Step, label: 'Seleccionar Juego', number: 1 },
  { id: 'campaign-details' as Step, label: 'Detalles', number: 2 },
  { id: 'upload-assets' as Step, label: 'Subir Assets', number: 3 },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2 md:space-x-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = step.id === currentStep;
          const isUpcoming = index > currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div
                className={`flex items-center ${
                  isCurrent
                    ? 'text-blue-600'
                    : isCompleted
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  } transition-all duration-300`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <span className="ml-2 text-xs md:text-sm font-medium hidden sm:inline">
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 transition-all duration-300 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}