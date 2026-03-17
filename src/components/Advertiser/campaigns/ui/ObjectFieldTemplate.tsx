// components/campaigns/ui/ObjectFieldTemplate.tsx
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
  
  // Determine if this is a root-level section (has title)
  const isSection = !!title;
  
  // Get section icon and color from uiSchema if available
  const sectionIcon = uiSchema?.['ui:icon'];
  const sectionColor = uiSchema?.['ui:color'] || 'blue';
  
  // Color mappings for different sections
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
  };
  
  const colors = colorClasses[sectionColor as keyof typeof colorClasses] || colorClasses.blue;

  // If it's not a section (nested object), render simple wrapper
  if (!isSection) {
    return (
      <div className="space-y-4">
        {properties.map((prop, index) => (
          <div key={prop.name || index}>{prop.content}</div>
        ))}
      </div>
    );
  }

  // Render as collapsible section
  return (
    <div className="space-y-1">
      {/* Section Header - Collapsible */}
      <div className={`bg-white border-2 ${colors.border} rounded-xl shadow-sm overflow-hidden transition-all`}>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full px-6 py-4 flex items-center justify-between ${colors.hover} transition-colors`}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`${colors.bg} p-2.5 rounded-lg`}>
              {sectionIcon || <Box className={`w-5 h-5 ${colors.icon}`} />}
            </div>
            
            {/* Title & Description */}
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

          {/* Collapse Icon */}
          <div className={`${colors.icon} transition-transform duration-200 ${isCollapsed ? '' : 'rotate-0'}`}>
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {/* Section Content - Collapsible */}
        {!isCollapsed && (
          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
            {/* 2-column grid on desktop, 1-column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((prop, index) => (
                <div 
                  key={prop.name || index}
                  className={`
                    ${(prop.content.props as any)?.schema?.type === 'object' || (prop.content.props as any)?.schema?.type === 'array' 
                      ? 'md:col-span-2' // Full width for nested objects/arrays
                      : 'md:col-span-1'  // Half width for simple fields
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

      {/* Field Count Badge (when collapsed) */}
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