'use client';

import { useState } from 'react';
import { LayoutGrid, Inbox } from 'lucide-react';
import PetRequestsInbox from './PetRequestsInbox';

type Tab = 'catalog' | 'requests';

const TABS: { value: Tab; label: string; Icon: typeof LayoutGrid }[] = [
  { value: 'catalog',  label: 'Editor de catálogo', Icon: LayoutGrid },
  { value: 'requests', label: 'Solicitudes',         Icon: Inbox      },
];

export default function PetCatalogEditor() {
  const [tab, setTab] = useState<Tab>('catalog');

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-4 py-2 shrink-0"
        style={{ background: '#0b1440' }}
      >
        {TABS.map(({ value, label, Icon }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
              style={
                active
                  ? { background: 'linear-gradient(135deg, #00a4ff, #0089d6)', color: '#fff' }
                  : { color: 'rgba(255,255,255,0.55)' }
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'catalog' ? (
          <iframe
            src="https://assets-abokamato.s3.us-east-2.amazonaws.com/PetVirtual/S3AdminPortal/index.html"
            className="w-full h-full border-none"
            title="Pet Catalog Editor"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <PetRequestsInbox />
          </div>
        )}
      </div>
    </div>
  );
}
