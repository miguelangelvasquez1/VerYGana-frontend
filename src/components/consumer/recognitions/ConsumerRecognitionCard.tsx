'use client';

import { useState } from 'react';
import { CheckCircle, Copy, Gift, MapPin, Package, Store } from 'lucide-react';
import type { ConsumerRecognition, ConsumerRecognitionItem } from '@/types/recognitions/Recognition.types';
import { PurchaseItemStatus } from '@/types/purchases/purchaseItem.types';
import { purchaseItemStatusColor, purchaseItemStatusLabel } from '@/components/purchases/purchaseItemMeta';
import { formatColombiaDate, formatColombiaDateTime } from '@/utils/keys';
import { getRecognitionStatusMeta } from '@/utils/recognitions';

// Regalo de VERYGANA visto por el beneficiario. Nunca se muestran precios ni
// datos del fondo, y nunca se dice "ganaste" ni "compraste".

const isClosed = (r: Pick<ConsumerRecognition, 'status'>) => r.status === 'EXPIRED' || r.status === 'CANCELLED';

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 break-all rounded-lg bg-gray-50 px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-admin-midnight">
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50"
      >
        {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

function ItemBlock({ item, index, total, closed }: { item: ConsumerRecognitionItem; index: number; total: number; closed: boolean }) {
  const isPhysicalPending = item.status === PurchaseItemStatus.PENDING && !!item.claimExpiresAt;

  return (
    <li className="space-y-2 rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">{total > 1 ? `Unidad ${index + 1}` : 'Tu producto'}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            purchaseItemStatusColor[item.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {purchaseItemStatusLabel[item.status] ?? item.status}
        </span>
      </div>

      {!closed && item.code && <CopyCode code={item.code} />}

      {!closed && isPhysicalPending && (
        <p className="flex items-start gap-2 rounded-lg bg-admin-blue/10 p-3 text-xs leading-relaxed text-admin-midnight">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Es un producto físico. Preséntate en el comercio con tu documento y muestra el PIN que te llegó por correo
            antes del <strong>{formatColombiaDateTime(item.claimExpiresAt)}</strong>.
          </span>
        </p>
      )}
    </li>
  );
}

export default function ConsumerRecognitionCard({ recognition }: { recognition: ConsumerRecognition }) {
  const closed = isClosed(recognition);
  const status = getRecognitionStatusMeta(recognition.status);

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow ${
        closed ? 'border-gray-100 opacity-60' : 'border-admin-gold/30 hover:shadow-md'
      }`}
    >
      {/* Franja superior */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 ${
          closed ? 'bg-gray-100 text-gray-500' : 'bg-linear-to-r from-admin-navy to-admin-midnight text-white'
        }`}
      >
        <p className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
          <Gift className={`h-4 w-4 ${closed ? '' : 'text-admin-yellow'}`} />
          VERYGANA te otorgó un reconocimiento
        </p>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            {recognition.imageUrl ? (
              <img
                src={recognition.imageUrl}
                alt={recognition.productName}
                className={`h-full w-full object-cover ${closed ? 'grayscale' : ''}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 sm:text-lg">{recognition.productName}</h3>
            {recognition.commercialName && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                <Store className="h-3.5 w-3.5" />
                {recognition.commercialName}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Otorgado el {formatColombiaDate(recognition.createdAt)}
              {recognition.deliveredAt && ` · Entregado el ${formatColombiaDate(recognition.deliveredAt)}`}
            </p>
          </div>
        </div>

        <blockquote className="rounded-xl border-l-4 border-admin-gold bg-admin-yellow/5 px-4 py-3 text-sm italic text-gray-700">
          “{recognition.reason}”
        </blockquote>

        {!closed && (
          <p className="text-xs text-gray-500">
            VERYGANA adquirió este producto para ti. No pagas dinero ni llaves.
          </p>
        )}

        {recognition.items.length > 0 && (
          <ul className="space-y-2">
            {recognition.items.map((item, i) => (
              <ItemBlock
                key={item.itemId}
                item={item}
                index={i}
                total={recognition.items.length}
                closed={closed}
              />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
