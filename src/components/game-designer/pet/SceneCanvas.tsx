'use client';

import React, { useRef, useState } from 'react';
import { Film, ImageOff, Move } from 'lucide-react';
import type { PetSceneCanvas, PetSceneObject } from '@/services/PetRequestService';

/**
 * Referencia visual de una escena, dibujada con DOM y CSS.
 *
 * Es deliberadamente NO el juego: `ScenePreviewModal` carga el build de Unity
 * —varios MB de wasm— y además solo muestra lo que ya está guardado en el
 * servidor, así que para colocar un objeto había que guardar, esperar el build y
 * volver. Esto se dibuja al instante y sobre lo que hay en el formulario, sin
 * guardar. A cambio no simula nada: ni animaciones, ni el sprite de la mascota,
 * ni el orden real de dibujado del juego. Sirve para situar y medir, y la
 * previsualización sigue siendo la verdad.
 */

const AZUL = '#00a4ff';

/** Los campos numéricos pueden estar en NaN mientras se escriben. */
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export interface Box {
  /** Coordenadas de pantalla (Y siempre hacia abajo), en unidades del lienzo. */
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Pasa un objeto a un rectángulo de pantalla.
 *
 * Se calcula por el centro para que los cuatro combos de `anchor`/`yAxis`
 * salgan de la misma fórmula. Con `anchor = TOP_LEFT`, x/y marcan la esquina
 * más cercana al origen: la superior izquierda si la Y crece hacia abajo, la
 * inferior izquierda si crece hacia arriba.
 */
export function objectBox(o: PetSceneObject, canvas: PetSceneCanvas): Box {
  const scale = o.scaleMultiplier == null || !(o.scaleMultiplier > 0) ? 1 : o.scaleMultiplier;
  const width = num(o.width) * scale;
  const height = num(o.height) * scale;

  const cx = canvas.anchor === 'CENTER' ? num(o.x) : num(o.x) + width / 2;
  const cy = canvas.anchor === 'CENTER' ? num(o.y) : num(o.y) + height / 2;
  const sy = canvas.yAxis === 'UP' ? canvas.height - cy : cy;

  return { left: cx - width / 2, top: sy - height / 2, width, height };
}

/** Inversa de {@link objectBox}: de dónde quedó el rectángulo a x/y del objeto. */
export function boxToPosition(box: Box, canvas: PetSceneCanvas): { x: number; y: number } {
  const cx = box.left + box.width / 2;
  const sy = box.top + box.height / 2;
  const cy = canvas.yAxis === 'UP' ? canvas.height - sy : sy;

  return canvas.anchor === 'CENTER'
    ? { x: Math.round(cx), y: Math.round(cy) }
    : { x: Math.round(cx - box.width / 2), y: Math.round(cy - box.height / 2) };
}

/** Un objeto fuera del marco no se ve en el juego; el lienzo lo señala. */
export function isOutside(box: Box, canvas: PetSceneCanvas): boolean {
  return (
    box.left + box.width <= 0 ||
    box.top + box.height <= 0 ||
    box.left >= canvas.width ||
    box.top >= canvas.height
  );
}

const isVideo = (o: PetSceneObject) =>
  o.type?.toLowerCase().includes('video') || /\.(mp4|mov)(\?|$)/i.test(o.url ?? '');

/**
 * Miniatura estática de una escena, para la lista.
 *
 * Con solo el nombre y "3 objetos" no hay forma de distinguir una escena de otra
 * sin abrirla; esto da el golpe de vista por unos pocos divs.
 */
export function SceneThumb({
  objects,
  canvas,
}: {
  objects: PetSceneObject[];
  canvas: PetSceneCanvas;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-[#1b1f2a]"
      style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
    >
      {objects.map((o, i) => {
        const box = objectBox(o, canvas);
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(box.left / canvas.width) * 100}%`,
              top: `${(box.top / canvas.height) * 100}%`,
              width: `${(box.width / canvas.width) * 100}%`,
              height: `${(box.height / canvas.height) * 100}%`,
              zIndex: i + 1,
            }}
          >
            {o.url && !isVideo(o) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.url} alt="" className="h-full w-full object-fill" />
            ) : (
              <div className="h-full w-full border border-dashed border-white/25 bg-white/10" />
            )}
          </div>
        );
      })}
      {objects.length === 0 && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40">
          Sin objetos
        </span>
      )}
    </div>
  );
}

type DragMode = 'move' | 'resize';

interface DragState {
  mode: DragMode;
  index: number;
  pointerX: number;
  pointerY: number;
  box: Box;
  /** Unidades del lienzo por píxel de pantalla, fijado al empezar el arrastre. */
  perPx: number;
  scale: number;
}

export function SceneCanvas({
  objects,
  canvas,
  selected,
  onSelect,
  onChange,
  className = 'w-full',
}: {
  objects: PetSceneObject[];
  canvas: PetSceneCanvas;
  selected: number | null;
  onSelect: (index: number | null) => void;
  /** Se llama en cada paso del arrastre: el formulario es la fuente de verdad. */
  onChange: (index: number, patch: Partial<PetSceneObject>) => void;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  /**
   * Assets cuya url no carga, por url.
   *
   * Sin esto un objeto con la clave mal puesta se dibujaba como una caja vacía,
   * indistinguible de una imagen transparente, y el fallo solo aparecía en la
   * consola del juego —que el diseñador no mira— como un 404.
   */
  const [broken, setBroken] = useState<Record<string, true>>({});

  const startDrag = (e: React.PointerEvent, index: number, mode: DragMode) => {
    const frame = frameRef.current;
    if (!frame) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = frame.getBoundingClientRect();
    const o = objects[index];
    dragRef.current = {
      mode,
      index,
      pointerX: e.clientX,
      pointerY: e.clientY,
      box: objectBox(o, canvas),
      perPx: canvas.width / rect.width,
      scale: o.scaleMultiplier == null || !(o.scaleMultiplier > 0) ? 1 : o.scaleMultiplier,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    // El preventDefault de arriba cancela el foco automático, y sin foco en el
    // marco las flechas no llegan a `onKeyDown`.
    frame.focus();
    onSelect(index);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    // Con Shift, rejilla de 10: mover a mano deja coordenadas como 437 y alinear
    // dos objetos entre sí a ojo es imposible.
    const snap = (v: number) => (e.shiftKey ? Math.round(v / 10) * 10 : Math.round(v));

    const dx = (e.clientX - drag.pointerX) * drag.perPx;
    const dy = (e.clientY - drag.pointerY) * drag.perPx;

    if (drag.mode === 'move') {
      const moved: Box = { ...drag.box, left: drag.box.left + dx, top: drag.box.top + dy };
      const { x, y } = boxToPosition(moved, canvas);
      onChange(drag.index, { x: snap(x), y: snap(y) });
      return;
    }

    // El tirador cambia el tamaño en pantalla, pero lo que se guarda es el tamaño
    // base: el juego le aplica encima `scaleMultiplier`. Sin dividir, un objeto a
    // escala 2 crecía al doble de lo que se arrastraba.
    const width = Math.max(1, snap((drag.box.width + dx) / drag.scale));
    const height = Math.max(1, snap((drag.box.height + dy) / drag.scale));

    // Se recalcula x/y para dejar clavada la esquina superior izquierda de la
    // pantalla. Con el defecto (Y hacia abajo, x/y en la esquina) sale lo mismo
    // que no tocarlas, pero con el origen abajo o en el centro la caja crecería
    // hacia el lado contrario al que se arrastra.
    const resized: Box = {
      ...drag.box,
      width: width * drag.scale,
      height: height * drag.scale,
    };
    const { x, y } = boxToPosition(resized, canvas);
    onChange(drag.index, { width, height, x, y });
  };

  // La captura del puntero se libera sola al soltar; solo hay que olvidar el arrastre.
  const endDrag = () => { dragRef.current = null; };

  /** Flechas para ajustar al píxel lo que el ratón no acierta. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (selected == null || !objects[selected]) return;
    const step = e.shiftKey ? 10 : 1;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[e.key];
    if (!move) return;
    e.preventDefault();

    const box = objectBox(objects[selected], canvas);
    const { x, y } = boxToPosition(
      { ...box, left: box.left + move[0], top: box.top + move[1] },
      canvas,
    );
    onChange(selected, { x, y });
  };

  const pct = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div
      ref={frameRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={() => onSelect(null)}
      className={`relative select-none overflow-hidden rounded-xl border border-gray-200 bg-[#1b1f2a] outline-none focus:ring-2 ${className}`}
      style={{
        aspectRatio: `${canvas.width} / ${canvas.height}`,
        // Rejilla de referencia cada 10% del alto/ancho del área.
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)',
        backgroundSize: '10% 10%',
        '--tw-ring-color': AZUL,
      } as React.CSSProperties}
    >
      {objects.map((o, i) => {
        const box = objectBox(o, canvas);
        const active = selected === i;
        const outside = isOutside(box, canvas);
        const video = isVideo(o);
        const failed = !!o.url && broken[o.url] === true;

        return (
          <div
            key={i}
            onPointerDown={e => startDrag(e, i, 'move')}
            title={`${o.objectId || `Objeto ${i + 1}`} · ${o.x}, ${o.y}`}
            className={`absolute cursor-move ${active ? 'z-40' : ''}`}
            style={{
              left: pct(box.left, canvas.width),
              top: pct(box.top, canvas.height),
              width: pct(box.width, canvas.width),
              height: pct(box.height, canvas.height),
              // El orden de la lista es el orden de dibujado que se asume; es el
              // mismo que ordenan las flechas de cada fila.
              zIndex: active ? 40 : i + 1,
            }}
          >
            {o.url && !video && !failed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={o.url}
                alt=""
                draggable={false}
                onError={() => setBroken(b => ({ ...b, [o.url as string]: true }))}
                className="pointer-events-none h-full w-full object-fill"
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center gap-1 overflow-hidden border border-dashed text-[10px] ${
                  failed
                    ? 'border-red-400 bg-red-500/25 text-red-100'
                    : video
                      ? 'border-violet-300/70 bg-violet-500/20 text-violet-100'
                      : 'border-white/30 bg-white/10 text-white/60'
                }`}
              >
                {/* El video no se carga a propósito: el objetivo es no descargar
                    medios pesados solo para situar una caja. */}
                {video && !failed
                  ? <Film className="h-3.5 w-3.5 shrink-0" />
                  : <ImageOff className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate px-1">
                  {o.objectId || `#${i + 1}`}{failed ? ' · no carga' : ''}
                </span>
              </div>
            )}

            <div
              className={`pointer-events-none absolute inset-0 ${
                active
                  ? 'ring-2 ring-[#00a4ff]'
                  : outside
                    ? 'ring-1 ring-red-400'
                    : 'ring-1 ring-white/25'
              }`}
            />

            {active && (
              <>
                {/* Encima de la caja, salvo si está pegada al borde superior: el
                    marco recorta lo que se salga y la etiqueta desaparecería. */}
                <span
                  className={`pointer-events-none absolute left-0 whitespace-nowrap rounded bg-[#00a4ff] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow ${
                    box.top < canvas.height * 0.06 ? 'top-0' : '-top-6'
                  }`}
                >
                  {o.objectId || `#${i + 1}`} · {num(o.x)},{num(o.y)} · {num(o.width)}×{num(o.height)}
                </span>
                {/* Tirador de tamaño en la esquina inferior derecha de la pantalla,
                    sea cual sea el sistema de coordenadas: es donde la mano lo busca. */}
                <span
                  onPointerDown={e => startDrag(e, i, 'resize')}
                  className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-white bg-[#00a4ff] shadow"
                />
              </>
            )}
          </div>
        );
      })}

      {objects.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-white/40">
          <Move className="h-4 w-4" /> Añade un objeto para verlo aquí
        </p>
      )}

      {/* Esquinas del área, para leer el sistema de coordenadas de un vistazo. */}
      <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/40 px-1 py-0.5 text-[10px] font-mono text-white/50">
        {canvas.yAxis === 'UP' ? `0,${canvas.height}` : '0,0'}
      </span>
      <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/40 px-1 py-0.5 text-[10px] font-mono text-white/50">
        {canvas.yAxis === 'UP' ? `${canvas.width},0` : `${canvas.width},${canvas.height}`}
      </span>
    </div>
  );
}
