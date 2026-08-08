'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ClipboardCheck, Loader2, Mail, Phone, RefreshCw, X } from 'lucide-react';
import {
  getPendingNegotiations,
  resolveNegotiation,
  type PendingNegotiation,
} from '@/services/ComplianceService';
import type { AnnualIncomeRange, LegalRepDocType, PersonType } from '@/services/commercial/OnboardingService';

function formatCOP(cents: number | null): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
}

const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  NATURAL: 'Persona Natural',
  JURIDICA: 'Persona Jurídica',
};

const DOC_TYPE_LABELS: Record<LegalRepDocType, string> = {
  CC: 'Cédula de Ciudadanía',
  CE: 'Cédula de Extranjería',
  PP: 'Pasaporte',
};

const INCOME_RANGE_LABELS: Record<AnnualIncomeRange, string> = {
  LESS_THAN_500_SMMLV: 'Menos de 500 SMMLV',
  FROM_500_TO_5000_SMMLV: '500 a 5.000 SMMLV',
  FROM_5000_TO_50000_SMMLV: '5.000 a 50.000 SMMLV',
  MORE_THAN_50000_SMMLV: 'Más de 50.000 SMMLV',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// El backend manda el paso crudo del enum (ej. "CONTRACT_PENDING") — solo lo
// volvemos legible, sin mantener un mapa de labels aparte del wizard comercial.
function formatStepLabel(step: string): string {
  return step
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-xs text-gray-700">{value}</p>
    </div>
  );
}

function ConfirmResolveModal({
  negotiation,
  onCancel,
  onConfirm,
  loading,
}: {
  negotiation: PendingNegotiation;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Marcar como resuelto</h3>
          <button
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          ¿Confirmas que la negociación con <span className="font-semibold text-gray-900">{negotiation.companyName}</span>{' '}
          quedó resuelta? Desaparecerá de este listado y el comercial ya podrá generar su contrato.
        </p>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function NegotiationCard({
  negotiation,
  resolving,
  onRequestResolve,
}: {
  negotiation: PendingNegotiation;
  resolving: boolean;
  onRequestResolve: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const details = negotiation.integrationDetails ?? negotiation.specialNegotiationDetails;

  return (
    <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{negotiation.companyName}</p>
            {negotiation.pep && (
              <span
                title="Representante legal declarado como PEP"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700"
              >
                <AlertTriangle className="w-3 h-3" />
                PEP
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Mail className="w-3 h-3" /> {negotiation.email}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Phone className="w-3 h-3" /> {negotiation.phoneNumber}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
            Ruta {negotiation.route}
          </span>
          <span className="text-[10px] text-gray-400">{formatStepLabel(negotiation.currentStep)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-600">{negotiation.routeExplanation}</p>

      {details && (
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">
            {negotiation.route === 'D' ? 'Necesidad de integración' : 'Condiciones solicitadas'}
          </p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{details}</p>
        </div>
      )}

      {negotiation.plan && (
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Plan aceptado</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-700">
            <span className="font-semibold text-gray-900">{negotiation.plan.planName}</span>
            {negotiation.plan.monthlyFeeCents != null && <span>Tarifa mensual: {formatCOP(negotiation.plan.monthlyFeeCents)}</span>}
            {negotiation.plan.investmentAmountCents != null && <span>Inversión: {formatCOP(negotiation.plan.investmentAmountCents)}</span>}
            <span>Comisión por venta: {negotiation.plan.saleCommissionPct}%</span>
            {negotiation.plan.contractDurationMonths != null && (
              <span>Duración: {negotiation.plan.contractDurationMonths} meses</span>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ocultar detalle jurídico' : 'Ver detalle jurídico'}
      </button>

      {expanded && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
          <DetailRow label="Tipo de persona" value={PERSON_TYPE_LABELS[negotiation.legalIdentification.personType]} />
          <DetailRow label="NIT" value={negotiation.legalIdentification.nit} />
          {negotiation.legalIdentification.companyName && (
            <DetailRow label="Razón social" value={negotiation.legalIdentification.companyName} />
          )}
          {negotiation.legalIdentification.mercantileRegistration && (
            <DetailRow label="Matrícula mercantil" value={negotiation.legalIdentification.mercantileRegistration} />
          )}
          <DetailRow
            label="Representante legal"
            value={`${negotiation.legalIdentification.legalRepFirstName} ${negotiation.legalIdentification.legalRepLastName}`}
          />
          <DetailRow
            label="Documento"
            value={`${DOC_TYPE_LABELS[negotiation.legalIdentification.legalRepDocType]} ${negotiation.legalIdentification.legalRepDocNumber}`}
          />
          <div className="col-span-2">
            <DetailRow label="Actividad económica" value={negotiation.legalIdentification.economicActivityDescription} />
          </div>
          {negotiation.legalIdentification.ciiuCode && (
            <DetailRow label="Código CIIU" value={negotiation.legalIdentification.ciiuCode} />
          )}
          <div className="col-span-2">
            <DetailRow label="Dirección" value={negotiation.legalIdentification.address} />
          </div>
          {(negotiation.legalIdentification.municipalityName || negotiation.legalIdentification.departmentName) && (
            <DetailRow
              label="Ubicación"
              value={[negotiation.legalIdentification.municipalityName, negotiation.legalIdentification.departmentName]
                .filter(Boolean)
                .join(', ')}
            />
          )}
          {negotiation.legalIdentification.annualIncomeRange && (
            <DetailRow label="Ingresos anuales" value={INCOME_RANGE_LABELS[negotiation.legalIdentification.annualIncomeRange]} />
          )}
          <div className="col-span-2">
            <DetailRow label="Clasificado el" value={formatDate(negotiation.classifiedAt)} />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onRequestResolve}
          disabled={resolving}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition"
        >
          {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Marcar como resuelto
        </button>
      </div>
    </div>
  );
}

interface Props {
  // Notifica al padre la cantidad actual — se usa para el contador en la
  // pestaña "Negociaciones", sin duplicar el fetch en dos componentes.
  onCountChange?: (count: number) => void;
}

export default function NegotiationsPanel({ onCountChange }: Props) {
  const [negotiations, setNegotiations] = useState<PendingNegotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<PendingNegotiation | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  // Evita el doble fetch de React Strict Mode en el montaje inicial.
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPendingNegotiations();
      setNegotiations(data);
      onCountChange?.(data.length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load();
  }, [load]);

  const handleConfirmResolve = async () => {
    if (!confirmTarget) return;
    setResolvingId(confirmTarget.onboardingId);
    try {
      await resolveNegotiation(confirmTarget.onboardingId);
      setConfirmTarget(null);
      await load();
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {negotiations.length} negociaci{negotiations.length !== 1 ? 'ones' : 'ón'} pendiente{negotiations.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={load}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-red-500">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">Error al cargar negociaciones.</p>
            <button onClick={load} className="cursor-pointer text-xs text-indigo-600 hover:underline">
              Reintentar
            </button>
          </div>
        ) : negotiations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No hay negociaciones pendientes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {negotiations.map((n) => (
              <NegotiationCard
                key={n.onboardingId}
                negotiation={n}
                resolving={resolvingId === n.onboardingId}
                onRequestResolve={() => setConfirmTarget(n)}
              />
            ))}
          </div>
        )}
      </div>

      {confirmTarget && (
        <ConfirmResolveModal
          negotiation={confirmTarget}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleConfirmResolve}
          loading={resolvingId === confirmTarget.onboardingId}
        />
      )}
    </>
  );
}
