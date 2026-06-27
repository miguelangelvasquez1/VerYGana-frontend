'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const PREVIEW_COUNT = 3;

function getFieldTitle(property: string, schema: any): string | null {
  const parts = property.replace(/^\./, '').split('.').filter(Boolean);
  let node = schema;
  for (const part of parts) {
    node = node?.properties?.[part];
    if (!node) return null;
  }
  return node?.title ?? null;
}

interface ErrorItem {
  message: string;
  property?: string;
  stack?: string;
}

interface Props {
  errors: ErrorItem[];
  schema?: any;
}

export default function ErrorListTemplate({ errors, schema }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!errors.length) return null;

  const visible = expanded ? errors : errors.slice(0, PREVIEW_COUNT);
  const hidden = errors.length - PREVIEW_COUNT;

  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-100">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-sm font-medium text-red-700">
          {errors.length} {errors.length === 1 ? 'campo requiere atención' : 'campos requieren atención'}
        </span>
      </div>
      <ul className="px-4 py-2 space-y-1">
        {visible.map((error, i) => {
          const title = schema && error.property ? getFieldTitle(error.property, schema) : null;
          return (
            <li key={i} className="flex items-start gap-2 text-xs text-red-600 py-0.5">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
              <span>
                {title && <span className="font-medium">{title}: </span>}
                {error.message}
              </span>
            </li>
          );
        })}
      </ul>
      {errors.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1 px-4 py-2 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors border-t border-red-100 cursor-pointer"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Mostrar menos</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Ver {hidden} {hidden === 1 ? 'error más' : 'errores más'}</>
          )}
        </button>
      )}
    </div>
  );
}
