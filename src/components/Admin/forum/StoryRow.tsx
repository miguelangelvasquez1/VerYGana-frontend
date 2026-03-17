'use client';

import React, { useState } from 'react';
import { useUpdateImpactStory } from '@/hooks/useImpactStory';
import type { ImpactStoryResponse, StoryStatus } from '@/types/impactStory.types';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StoryStatus, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Publicada', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  DRAFT:     { label: 'Borrador',  cls: 'bg-amber-100  text-amber-700  border-amber-200'  },
  ARCHIVED:  { label: 'Archivada', cls: 'bg-gray-100   text-gray-500   border-gray-200'   },
};

// The two statuses the admin can toggle between from the row
const STATUS_NEXT: Record<StoryStatus, { next: StoryStatus; label: string; cls: string }> = {
  PUBLISHED: {
    next: 'ARCHIVED',
    label: 'Archivar',
    cls: 'hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300',
  },
  DRAFT: {
    next: 'PUBLISHED',
    label: 'Publicar',
    cls: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300',
  },
  ARCHIVED: {
    next: 'PUBLISHED',
    label: 'Publicar',
    cls: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateStr));
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StoryRowProps {
  story: ImpactStoryResponse;
  onEdit:   () => void;
  onDelete: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoryRow({ story, onEdit, onDelete }: StoryRowProps) {
  const updateMutation = useUpdateImpactStory();
  const [optimisticStatus, setOptimisticStatus] = useState<StoryStatus>(story.status);

  const cover = story.mediaFiles.find((m) => m.isCover) ?? story.mediaFiles[0];
  const currentStatus  = STATUS_CONFIG[optimisticStatus];
  const transition     = STATUS_NEXT[optimisticStatus];
  const isTogglingStatus = updateMutation.isPending;

  const handleToggleStatus = async () => {
    const nextStatus = transition.next;
    // Optimistic update
    setOptimisticStatus(nextStatus);
    try {
      await updateMutation.mutateAsync({ id: story.id, status: nextStatus });
    } catch {
      // Revert on error
      setOptimisticStatus(optimisticStatus);
    }
  };

  return (
    <tr className="hover:bg-gray-50/60 transition-colors group">

      {/* ── Thumbnail ── */}
      <td className="px-5 py-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          {cover ? (
            cover.mediaType === 'VIDEO' ? (
              <div className="w-full h-full relative bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            ) : (
              <img
                src={cover.publicUrl}
                alt={cover.altText || story.title}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path strokeLinecap="round" d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          )}
        </div>
      </td>

      {/* ── Title + meta ── */}
      <td className="px-4 py-3 max-w-xs">
        <p className="font-semibold text-gray-800 truncate">{story.title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{story.description}</p>
        {story.location && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {story.location}
          </span>
        )}
      </td>

      {/* ── Category ── */}
      <td className="px-4 py-3 hidden md:table-cell">
        {story.category ? (
          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
            {story.category}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* ── Beneficiaries ── */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="font-semibold text-gray-700">
          {story.beneficiariesCount.toLocaleString('es-CO')}
        </span>
      </td>

      {/* ── Investment ── */}
      <td className="px-4 py-3 hidden lg:table-cell">
        {story.investedAmount > 0 ? (
          <span className="text-gray-700 font-medium text-xs">
            {formatMoney(story.investedAmount, story.investedCurrency)}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* ── Status badge + toggle ── */}
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          {/* Current status badge */}
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStatus.cls}`}>
            {currentStatus.label}
          </span>

          {/* Toggle button */}
          <button
            type="button"
            disabled={isTogglingStatus}
            onClick={handleToggleStatus}
            className={`
              inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md
              border border-transparent text-gray-400
              transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
              ${transition.cls}
            `}
            title={`${transition.label} historia`}
          >
            {isTogglingStatus ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} opacity={0.3}/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round"/>
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d={optimisticStatus === 'PUBLISHED'
                    ? 'M5 8l7 7 7-7'     // arrow down → archivar
                    : 'M5 15l7-7 7 7'    // arrow up → publicar
                  }
                />
              </svg>
            )}
            {transition.label}
          </button>
        </div>
      </td>

      {/* ── Date ── */}
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap hidden sm:table-cell">
        {formatDate(story.storyDate)}
      </td>

      {/* ── Actions ── */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBtn onClick={onEdit} title="Editar" color="blue">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </ActionBtn>
          <ActionBtn onClick={onDelete} title="Eliminar" color="red">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6"/>
              <path strokeLinecap="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </ActionBtn>
        </div>
      </td>
    </tr>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

function ActionBtn({
  onClick, title, color, children,
}: {
  onClick: () => void;
  title: string;
  color: 'blue' | 'red';
  children: React.ReactNode;
}) {
  const cls = color === 'blue'
    ? 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-400'
    : 'hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-gray-400';
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg border border-transparent transition-all ${cls}`}
    >
      {children}
    </button>
  );
}