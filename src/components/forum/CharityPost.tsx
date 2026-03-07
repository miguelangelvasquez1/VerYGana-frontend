'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Users, DollarSign, MapPin, Tag, Calendar, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImpactStoryResponse, StoryMediaResponse } from '@/types/impactStory.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(dateStr));
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

const CATEGORY_COLORS: Record<string, string> = {
  'Educación':       'bg-blue-100 text-blue-700',
  'Salud':           'bg-red-100 text-red-700',
  'Medio Ambiente':  'bg-green-100 text-green-700',
  'Comunidad':       'bg-amber-100 text-amber-700',
  'Infraestructura': 'bg-slate-100 text-slate-700',
  'Emprendimiento':  'bg-purple-100 text-purple-700',
  'Alimentación':    'bg-orange-100 text-orange-700',
  'Tecnología':      'bg-cyan-100 text-cyan-700',
  'Otro':            'bg-gray-100 text-gray-600',
};

// ─── MediaSlide ───────────────────────────────────────────────────────────────

function MediaSlide({
  media,
  title,
  active,
}: {
  media: StoryMediaResponse;
  title: string;
  active: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  // Reset video when slide becomes inactive
  React.useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  if (media.mediaType === 'VIDEO') {
    return playing ? (
      <video
        src={media.publicUrl}
        controls
        autoPlay
        className="w-full h-full object-contain bg-black"
      />
    ) : (
      <>
        <img
          src={media.thumbnailUrl ?? media.publicUrl}
          alt={media.altText || title}
          className="w-full h-full object-contain"
          draggable={false}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {/* Play button */}
        <button
          onClick={() => setPlaying(true)}
          aria-label="Reproducir video"
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover:scale-110 group-active:scale-95 transition-transform duration-150">
            <Play className="w-7 h-7 text-emerald-700 ml-1" fill="currentColor" />
          </div>
        </button>
        {/* Video label */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          <Play className="w-3 h-3" fill="currentColor" /> Video
        </span>
      </>
    );
  }

  return (
    <img
      src={media.publicUrl}
      alt={media.altText || title}
      className="w-full h-full object-contain"
      draggable={false}
    />
  );
}

// ─── MediaCarousel ────────────────────────────────────────────────────────────

function MediaCarousel({
  files,
  title,
  category,
}: {
  files: StoryMediaResponse[];
  title: string;
  category?: string;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const total = files.length;

  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex((i) => (i + 1) % total),         [total]);

  // ── Touch handlers ──────────────────────────────────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      touchDeltaX.current < 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const catColor = CATEGORY_COLORS[category ?? ''] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="relative h-72 sm:h-80 md:h-96 bg-gray-900 overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Slides ── */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {files.map((media, i) => (
          <div key={media.id} className="relative w-full h-full flex-shrink-0">
            <MediaSlide media={media} title={title} active={i === index} />
          </div>
        ))}
      </div>

      {/* ── Category badge ── */}
      {category && (
        <span className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${catColor}`}>
          {category}
        </span>
      )}

      {/* ── Arrow buttons (only when > 1 slide) ── */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 active:scale-95
              flex items-center justify-center text-white backdrop-blur-sm
              transition-all duration-150 shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 active:scale-95
              flex items-center justify-center text-white backdrop-blur-sm
              transition-all duration-150 shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Dot indicators + counter ── */}
      {total > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex flex-col items-center gap-1.5">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {files.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir a imagen ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === index
                    ? 'w-5 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
          {/* Counter */}
          <span className="text-[11px] text-white/70 font-medium tabular-nums">
            {index + 1} / {total}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── CharityPost ──────────────────────────────────────────────────────────────

interface CharityPostProps {
  story: ImpactStoryResponse;
}

const DESCRIPTION_LIMIT = 180;

export default function CharityPost({ story }: CharityPostProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  // Sort: cover first, then by displayOrder
  const sortedMedia = [...story.mediaFiles].sort((a, b) => {
    if (a.isCover && !b.isCover) return -1;
    if (!a.isCover && b.isCover) return 1;
    return a.displayOrder - b.displayOrder;
  });

  const tagList = story.tags
    ? story.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const catColor = CATEGORY_COLORS[story.category ?? ''] ?? 'bg-gray-100 text-gray-600';
  const isLongDesc = story.description.length > DESCRIPTION_LIMIT;
  const displayedDesc = isLongDesc && !descExpanded
    ? story.description.slice(0, DESCRIPTION_LIMIT).trimEnd() + '…'
    : story.description;

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">

      {/* ── Carousel or placeholder ── */}
      {sortedMedia.length > 0 ? (
        <MediaCarousel files={sortedMedia} title={story.title} category={story.category} />
      ) : (
        // No media: show category badge inline
        null
      )}

      {/* ── Body ── */}
      <div className="p-5">

        {/* Category badge (only when no media) */}
        {story.category && sortedMedia.length === 0 && (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${catColor}`}>
            {story.category}
          </span>
        )}

        {/* Title */}
        <h2 className="text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-2">
          {story.title}
        </h2>

        {/* Meta: date · location · author */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(story.storyDate)}
          </span>
          {story.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {story.location}
            </span>
          )}
          {story.authorName && (
            <span className="text-gray-400">
              por <span className="font-medium text-gray-600">{story.authorName}</span>
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {displayedDesc}
          </p>
          {isLongDesc && (
            <button
              className="mt-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
              onClick={() => setDescExpanded((v) => !v)}
            >
              {descExpanded ? 'Ver menos ↑' : 'Ver más ↓'}
            </button>
          )}
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatChip
            icon={<Users className="w-3.5 h-3.5" />}
            label={`${story.beneficiariesCount.toLocaleString('es-CO')} beneficiados`}
            color="blue"
          />
          {story.investedAmount > 0 && (
            <StatChip
              icon={<DollarSign className="w-3.5 h-3.5" />}
              label={formatMoney(story.investedAmount, story.investedCurrency)}
              color="emerald"
            />
          )}
        </div>

        {/* Tags */}
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tagList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[11px] font-medium"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

      </div>
    </article>
  );
}

// ─── StatChip ─────────────────────────────────────────────────────────────────

function StatChip({
  icon, label, color,
}: {
  icon: React.ReactNode; label: string; color: 'blue' | 'emerald';
}) {
  const cls = color === 'blue'
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : 'bg-emerald-50 text-emerald-700 border-emerald-100';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cls}`}>
      {icon}{label}
    </span>
  );
}