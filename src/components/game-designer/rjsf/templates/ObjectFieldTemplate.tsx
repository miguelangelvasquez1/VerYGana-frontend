'use client';

import { ObjectFieldTemplateProps } from "@rjsf/utils";
import { ChevronDown, ChevronRight, Box } from "lucide-react";
import { useState } from "react";

export default function CustomObjectFieldTemplate({
  title,
  description,
  properties,
  uiSchema,
}: ObjectFieldTemplateProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSection = !!title;

  const sectionIcon = uiSchema?.['ui:icon'];
  const sectionColor = uiSchema?.['ui:color'] || 'violet';

  const colorClasses = {
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      hover: 'hover:bg-blue-100',
    },
    purple: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      icon: 'text-purple-600',
      hover: 'hover:bg-purple-100',
    },
    violet: {
      border: 'border-violet-200',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      icon: 'text-violet-600',
      hover: 'hover:bg-violet-100',
    },
    green: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: 'text-green-600',
      hover: 'hover:bg-green-100',
    },
    orange: {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      icon: 'text-orange-600',
      hover: 'hover:bg-orange-100',
    },
    indigo: {
      border: 'border-indigo-200',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      icon: 'text-indigo-600',
      hover: 'hover:bg-indigo-100',
    },
  };

  const colors = colorClasses[sectionColor as keyof typeof colorClasses] || colorClasses.violet;

  if (!isSection) {
    return (
      <div className="space-y-4">
        {properties.map((prop, index) => (
          <div key={prop.name || index}>{prop.content}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className={`bg-white border-2 ${colors.border} rounded-xl shadow-sm overflow-hidden transition-all`}>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full px-6 py-4 flex items-center justify-between ${colors.hover} transition-colors`}
        >
          <div className="flex items-center gap-3">
            <div className={`${colors.bg} p-2.5 rounded-lg`}>
              {sectionIcon || <Box className={`w-5 h-5 ${colors.icon}`} />}
            </div>

            <div className="text-left">
              <h3 className={`text-lg font-semibold ${colors.text}`}>
                {title}
              </h3>
              {description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className={`${colors.icon} transition-transform duration-200`}>
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {!isCollapsed && (
          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((prop, index) => (
                <div
                  key={prop.name || index}
                  className={`
                    ${(prop.content.props as any)?.schema?.type === 'object' || (prop.content.props as any)?.schema?.type === 'array'
                      ? 'md:col-span-2'
                      : 'md:col-span-1'
                    }
                  `}
                >
                  {prop.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-end px-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {properties.length} campo{properties.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
