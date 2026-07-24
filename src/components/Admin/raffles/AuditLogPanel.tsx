"use client";

import { useState } from "react";
import { Search, History, ShieldAlert } from "lucide-react";
import {
  getTicketAuditLogs,
  getAuditLogsBetWeenDates,
  getSuspiciousActivity,
} from "@/services/admin/AdminRaffleService";
import {
  AuditAction,
  TicketAuditLogResponseDTO,
  SuspiciousIpActivityResponseDTO,
} from "@/types/raffles/ticketAuditLog.types";

const PAGE_SIZE = 10;

const ACTION_STYLES: Record<AuditAction, string> = {
  [AuditAction.ISSUED]: "bg-green-50 text-green-700 border-green-200",
  [AuditAction.EXPIRED]: "bg-gray-100 text-gray-500 border-gray-200",
  [AuditAction.WON]: "bg-yellow-50 text-yellow-700 border-yellow-200",
  [AuditAction.CANCELLED]: "bg-red-50 text-red-700 border-red-200",
  [AuditAction.TRANSFERRED]: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function AuditLogPanel() {
  /* ── Historial de un boleto ── */
  const [ticketId, setTicketId] = useState("");
  const [ticketLogs, setTicketLogs] = useState<TicketAuditLogResponseDTO[]>([]);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ticketSearched, setTicketSearched] = useState(false);

  const handleSearchTicket = async () => {
    const id = Number(ticketId);
    if (!id) return;
    setLoadingTicket(true);
    setTicketSearched(true);
    try {
      setTicketLogs(await getTicketAuditLogs(id));
    } catch {
      setTicketLogs([]);
    } finally {
      setLoadingTicket(false);
    }
  };

  /* ── Historial general por rango de fechas ── */
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [logs, setLogs] = useState<TicketAuditLogResponseDTO[]>([]);
  const [logsPage, setLogsPage] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsSearched, setLogsSearched] = useState(false);

  const loadLogs = async (page: number) => {
    if (!from || !to) return;
    setLoadingLogs(true);
    setLogsSearched(true);
    try {
      const res = await getAuditLogsBetWeenDates(from, to, page, PAGE_SIZE);
      setLogs(res.data);
      setLogsTotalPages(res.meta.totalPages);
      setLogsPage(page);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  /* ── Actividad sospechosa ── */
  const [since, setSince] = useState("");
  const [threshold, setThreshold] = useState(10);
  const [suspicious, setSuspicious] = useState<SuspiciousIpActivityResponseDTO[]>([]);
  const [loadingSuspicious, setLoadingSuspicious] = useState(false);
  const [suspiciousSearched, setSuspiciousSearched] = useState(false);

  const loadSuspicious = async () => {
    if (!since) return;
    setLoadingSuspicious(true);
    setSuspiciousSearched(true);
    try {
      const res = await getSuspiciousActivity(since, threshold);
      setSuspicious(res);
    } catch {
      setSuspicious([]);
    } finally {
      setLoadingSuspicious(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ Historial de un boleto ═══ */}
      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Search size={16} className="text-purple-600" />
          Historial de un boleto
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ID del boleto</label>
            <input
              type="number"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Ej: 1024"
              className="border px-3 py-2 rounded-lg text-sm w-48"
            />
          </div>
          <button
            onClick={handleSearchTicket}
            disabled={!ticketId || loadingTicket}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
          >
            {loadingTicket ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {ticketSearched && !loadingTicket && (
          ticketLogs.length === 0 ? (
            <p className="text-sm text-gray-400">No se encontraron registros para este boleto.</p>
          ) : (
            <AuditLogTable logs={ticketLogs} />
          )
        )}
      </section>

      {/* ═══ Historial general ═══ */}
      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <History size={16} className="text-purple-600" />
          Historial general
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={() => loadLogs(0)}
            disabled={!from || !to || loadingLogs}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
          >
            {loadingLogs ? "Cargando..." : "Consultar"}
          </button>
        </div>

        {logsSearched && !loadingLogs && (
          logs.length === 0 ? (
            <p className="text-sm text-gray-400">No hay registros en el rango seleccionado.</p>
          ) : (
            <>
              <AuditLogTable logs={logs} showTicketId />
              {logsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400">
                    Página {logsPage + 1} de {logsTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadLogs(logsPage - 1)}
                      disabled={logsPage === 0}
                      className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => loadLogs(logsPage + 1)}
                      disabled={logsPage >= logsTotalPages - 1}
                      className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </section>

      {/* ═══ Actividad sospechosa ═══ */}
      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <ShieldAlert size={16} className="text-purple-600" />
          Actividad sospechosa
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Umbral de boletos</label>
            <input
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="border px-3 py-2 rounded-lg text-sm w-32"
            />
          </div>
          <button
            onClick={loadSuspicious}
            disabled={!since || loadingSuspicious}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
          >
            {loadingSuspicious ? "Cargando..." : "Consultar"}
          </button>
        </div>

        {suspiciousSearched && !loadingSuspicious && (
          suspicious.length === 0 ? (
            <p className="text-sm text-gray-400">No se encontró actividad sospechosa con estos parámetros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">IP</th>
                    <th className="px-4 py-3 text-right">Boletos emitidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suspicious.map((s) => (
                    <tr key={s.ipAddress} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700">{s.ipAddress}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{s.ticketCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
    </div>
  );
}

function AuditLogTable({
  logs,
  showTicketId,
}: {
  logs: TicketAuditLogResponseDTO[];
  showTicketId?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            {showTicketId && <th className="px-4 py-3 text-left">Boleto</th>}
            <th className="px-4 py-3 text-left">Acción</th>
            <th className="px-4 py-3 text-left">Origen</th>
            <th className="px-4 py-3 text-left">IP</th>
            <th className="px-4 py-3 text-left">Metadata</th>
            <th className="px-4 py-3 text-left">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              {showTicketId && <td className="px-4 py-3 text-gray-600">#{log.ticketId}</td>}
              <td className="px-4 py-3">
                <span className={`inline-flex text-xs border px-2 py-0.5 rounded-full ${ACTION_STYLES[log.action]}`}>
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {log.sourceType} #{log.sourceId}
              </td>
              <td className="px-4 py-3 font-mono text-gray-500">{log.ipAddress}</td>
              <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={log.metadata}>
                {log.metadata}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(log.createdAt).toLocaleString("es-CO")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
