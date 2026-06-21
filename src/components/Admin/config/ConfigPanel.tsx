'use client';

import React, { useState } from 'react';
import { DollarSign, Shield } from 'lucide-react';
import SistemaTab from './tabs/SistemaTab';
import PreciosTab from './tabs/PreciosTab';

type Tab = 'sistema' | 'precios';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'sistema', label: 'Sistema', icon: <Shield size={16} /> },
  { id: 'precios', label: 'Precios', icon: <DollarSign size={16} /> },
];

function TabButton({
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

export default function ConfigPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('sistema');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-100 px-4">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {activeTab === 'sistema' && <SistemaTab />}
      {activeTab === 'precios' && <PreciosTab />}
    </div>
  );
}
