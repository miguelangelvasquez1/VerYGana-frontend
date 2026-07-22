'use client';

import React, { useState } from 'react';
import { ShieldAlert, FileText } from 'lucide-react';
import SecurityEventsPanel from './SecurityEventsPanel';
import OtherAuditEventsPanel from './OtherAuditEventsPanel';

type Section = 'security' | 'other';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'security', label: 'Seguridad', icon: <ShieldAlert size={16} /> },
  { id: 'other', label: 'Otros eventos', icon: <FileText size={16} /> },
];

function SectionButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function SecurityAuditHub() {
  const [section, setSection] = useState<Section>('security');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-100 px-4">
          {SECTIONS.map((s) => (
            <SectionButton
              key={s.id}
              label={s.label}
              icon={s.icon}
              active={section === s.id}
              onClick={() => setSection(s.id)}
            />
          ))}
        </div>
      </div>

      {section === 'security' && <SecurityEventsPanel />}
      {section === 'other' && <OtherAuditEventsPanel />}
    </div>
  );
}
