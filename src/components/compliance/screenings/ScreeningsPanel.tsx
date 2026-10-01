'use client';

/**
 * Alertas de screening.
 *
 * Aquí el trabajo es comparar: el mismo nombre contra varias listas. Formato
 * ledger, identificadores en monoespaciada y la severidad marcada en el
 * borde izquierdo para poder barrer la columna sin leer.
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { ClipboardCheck, ShieldCheck } from 'lucide-react';
import {
  getUnresolvedHits,
  reviewScreening,
  ScreeningStatus,
  type PageResponse,
  type ScreeningResultResponseDTO,
  type ScreeningList,
} from '@/services/ComplianceService';
import {
  Btn,
  EmptyState,
  ErrorState,
  Ledger,
  LedgerBody,
  LedgerHead,
  LedgerRow,
  LedgerTable,
  Modal,
  Pager,
  PanelHeader,
  Ref,
  RefreshButton,
  SkeletonRows,
  StatusTag,
  Td,
  TextField,
  Th,
  ThSpine,
  type Tone,
} from '@/components/compliance/ui/primitives';

const PAGE_SIZE = 20;

// /hits solo devuelve HIT y FUZZY_HIT; NO_HIT se cubre porque el enum lo incluye.
const HIT_TONE: Record<ScreeningStatus, Tone> = {
  [ScreeningStatus.HIT]: 'flag',
  [ScreeningStatus.FUZZY_HIT]: 'hold',
  [ScreeningStatus.NO_HIT]: 'clear',
};
const HIT_LABEL: Record<ScreeningStatus, string> = {
  [ScreeningStatus.HIT]: 'Coincidencia',
  [ScreeningStatus.FUZZY_HIT]: 'Parcial',
  [ScreeningStatus.NO_HIT]: 'Sin coincidencia',
};

const LIST_LABELS: Record<ScreeningList, string> = {
  OFAC_SDN: 'OFAC SDN',
  UN: 'ONU',
  ATTORNEY_GENERAL: 'Fiscalía',
  COMPTROLLER: 'Contraloría',
  NATIONAL_POLICE: 'Policía Nacional',
};

function ReviewModal({
  hit,
  onClose,
  onConfirm,
  loading,
}: {
  hit: ScreeningResultResponseDTO;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState('');
  return (
    <Modal
      onClose={onClose}
      title="Marcar como revisada"
      subtitle={
        <span>
          {hit.queriedName} · {LIST_LABELS[hit.restrictiveList] ?? hit.restrictiveList}
        </span>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <StatusTag tone={HIT_TONE[hit.status]}>{HIT_LABEL[hit.status] ?? hit.status}</StatusTag>
        <Ref muted>{hit.queriedDocument}</Ref>
      </div>
      <TextField
        label="Notas de revisión"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Qué se verificó y con qué fuente. Opcional, pero queda en la auditoría."
      />
      <div className="mt-5 flex gap-3">
        <Btn className="flex-1" onClick={onClose} disabled={loading}>
          Cancelar
        </Btn>
        <Btn
          className="flex-1"
          variant="primary"
          icon={ClipboardCheck}
          loading={loading}
          onClick={() => onConfirm(notes.trim())}
        >
          Marcar revisada
        </Btn>
      </div>
    </Modal>
  );
}

export default function ScreeningsPanel() {
  const [page, setPage] = useState<PageResponse<ScreeningResultResponseDTO> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ScreeningResultResponseDTO | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      setPage(await getUnresolvedHits(p, PAGE_SIZE));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentPage);
  }, [currentPage, load]);

  const handleReview = async (notes: string) => {
    if (!reviewTarget) return;
    setActionLoading(reviewTarget.id);
    try {
      await reviewScreening(reviewTarget.id, notes);
      toast.success(`Alerta revisada — ${reviewTarget.queriedName}`);
      setReviewTarget(null);
      await load(currentPage);
    } catch {
      toast.error('No se pudo registrar la revisión. Intenta de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  const hits = page?.content ?? [];
  const totalPages = page?.totalPages ?? 1;

  return (
    <>
      <div className="space-y-6">
        <PanelHeader
          eyebrow="Listas restrictivas"
          title="Alertas de screening"
          description="Coincidencias contra OFAC, ONU y listas nacionales pendientes de revisión."
          count={loading ? 0 : page?.totalElements ?? 0}
          countLabel="Sin revisar"
          actions={<RefreshButton onClick={() => load(currentPage)} loading={loading} />}
        />

        {loading ? (
          <SkeletonRows rows={6} cols={6} />
        ) : error ? (
          <ErrorState
            message="No se pudieron cargar las alertas."
            onRetry={() => load(currentPage)}
          />
        ) : hits.length === 0 ? (
          <EmptyState
            tone="clear"
            icon={ShieldCheck}
            title="Sin alertas pendientes"
            hint="Ninguna coincidencia espera revisión en este momento."
          />
        ) : (
          <>
            <Ledger>
              <LedgerTable>
                <LedgerHead>
                  <ThSpine />
                  <Th>Nombre consultado</Th>
                  <Th>Documento</Th>
                  <Th>Lista</Th>
                  <Th>Severidad</Th>
                  <Th>Detectada</Th>
                  <Th align="right">Acción</Th>
                </LedgerHead>
                <LedgerBody>
                  {hits.map((hit, i) => (
                    <LedgerRow key={hit.id} index={i} tone={HIT_TONE[hit.status]}>
                      <Td className="font-medium text-cmp-ink">{hit.queriedName}</Td>
                      <Td>
                        <Ref muted>{hit.queriedDocument}</Ref>
                      </Td>
                      <Td className="text-cmp-slate">
                        {LIST_LABELS[hit.restrictiveList] ?? hit.restrictiveList}
                      </Td>
                      <Td>
                        <StatusTag tone={HIT_TONE[hit.status]}>
                          {HIT_LABEL[hit.status] ?? hit.status}
                        </StatusTag>
                      </Td>
                      <Td className="cmp-mono text-[11px] text-cmp-mute">
                        {new Date(hit.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Td>
                      <Td align="right">
                        <Btn
                          size="sm"
                          variant="primary"
                          icon={ClipboardCheck}
                          onClick={() => setReviewTarget(hit)}
                          disabled={actionLoading !== null}
                        >
                          Revisar
                        </Btn>
                      </Td>
                    </LedgerRow>
                  ))}
                </LedgerBody>
              </LedgerTable>
            </Ledger>

            <Pager
              page={currentPage}
              totalPages={totalPages}
              total={page?.totalElements}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {reviewTarget && (
          <ReviewModal
            key="review"
            hit={reviewTarget}
            onClose={() => setReviewTarget(null)}
            onConfirm={handleReview}
            loading={actionLoading === reviewTarget.id}
          />
        )}
      </AnimatePresence>
    </>
  );
}
