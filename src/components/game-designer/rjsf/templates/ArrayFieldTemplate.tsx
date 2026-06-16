'use client';

import { ArrayFieldTemplateProps } from "@rjsf/utils";
import { Plus, Trash2, GripVertical } from "lucide-react";

export default function CustomArrayFieldTemplate({
  title,
  items,
  canAdd,
  onAddClick,
  uiSchema,
}: ArrayFieldTemplateProps) {
  const arrayColor = uiSchema?.['ui:color'] || 'violet';

  const colorClasses = {
    indigo: {
      button: 'bg-indigo-600 hover:bg-indigo-700',
      border: 'border-indigo-200',
      bg: 'bg-indigo-50',
    },
    purple: {
      button: 'bg-purple-600 hover:bg-purple-700',
      border: 'border-purple-200',
      bg: 'bg-purple-50',
    },
    violet: {
      button: 'bg-violet-600 hover:bg-violet-700',
      border: 'border-violet-200',
      bg: 'bg-violet-50',
    },
    blue: {
      button: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-200',
      bg: 'bg-blue-50',
    },
  };

  const colors = colorClasses[arrayColor as keyof typeof colorClasses] || colorClasses.violet;

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-gray-800">
            {title}
          </h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {items.length} elemento{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {items.map((element) => {
          const itemProps = element.props as any;
          return (
            <div
              key={element.key}
              className="group relative bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
            >
              <div className="absolute left-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>

              <div className="pl-6">
                {element}
              </div>

              {itemProps.onDropIndexClick && (
                <button
                  type="button"
                  onClick={itemProps.onDropIndexClick(itemProps.index)}
                  className="absolute top-3 right-3 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Eliminar elemento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {canAdd && (
        <button
          type="button"
          onClick={onAddClick}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium text-sm focus:outline-none cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Agregar {title ? title.toLowerCase().replace(/s$/, '') : 'elemento'}
        </button>
      )}

      {items.length === 0 && (
        <div className={`${colors.bg} border-2 ${colors.border} border-dashed rounded-lg p-8 text-center`}>
          <p className="text-sm text-gray-600">
            No hay elementos. Haz clic en "Agregar" para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}
