"use client";

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  getTicketEarningRulesList,
  countActiveTicketEarningRules,
  updateTicketEarningRule,
  createTicketEarningRule,
} from "@/services/admin/AdminRaffleService";

import {
  TicketEarningRuleResponseDTO,
  UpdateTicketEarningRuleRequestDTO,
  CreateTicketEarningRuleRequestDTO,
} from "@/types/raffles/ticketEarningRule.types";

import CreateTicketEarningRuleForm from "./CreateTicketEarningRuleForm";
import TicketRuleCard from "./TicketRuleCard";

const RULE_TYPES = [
  "PURCHASE",
  "ADS_WATCHED",
  "GAME_ACHIEVEMENT",
  "REFERRAL",
];

export default function TicketRulesManagement() {
  const [rules, setRules] = useState<TicketEarningRuleResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();

  const [page, setPage] = useState(0);
  const size = 10;

  const [stats, setStats] = useState({
    active: 0,
    total: 0,
  });

  /* ================= LOAD ================= */

  const loadStats = async (): Promise<void> => {
    const active = await countActiveTicketEarningRules();
    setStats((prev) => ({ ...prev, active }));
  };

  const loadRules = async (): Promise<void> => {
    try {
      setLoading(true);

      const data = await getTicketEarningRulesList(
        typeFilter,
        activeFilter,
        size,
        page
      );

      setRules(data ?? []);
      setStats((prev) => ({ ...prev, total: data?.length ?? 0 }));
    } catch (err) {
      console.error(err);
      setError("Error cargando reglas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadRules();
  }, [typeFilter, activeFilter, page]);

  /* ================= UPDATE ================= */

  const handleUpdateRule = async (
    id: number,
    data: UpdateTicketEarningRuleRequestDTO
  ): Promise<void> => {
    const loadingToast = toast.loading("Actualizando regla...");

    try {
      await updateTicketEarningRule(id, data);
      toast.dismiss(loadingToast);
      toast.success("Regla actualizada");
      await loadRules();
      await loadStats();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Error al actualizar");
    }
  };

  /* ================= CREATE ================= */

  const handleCreateRule = async (
    data: CreateTicketEarningRuleRequestDTO
  ): Promise<void> => {
    const loadingToast = toast.loading("Creando regla...");

    try {
      await createTicketEarningRule(data);

      toast.dismiss(loadingToast);
      toast.success("Regla creada correctamente");

      setShowCreate(false);
      await loadRules();
      await loadStats();
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error("Error al crear la regla");
    }
  };

  const resetFilters = () => {
    setTypeFilter(undefined);
    setActiveFilter(undefined);
    setPage(0);
  };

  /* ================= UI STATES ================= */

  if (loading && rules.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">
            Gestión de Reglas de Tickets
          </h2>
          <p className="text-gray-600">
            Administra las reglas de obtención de tickets
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={18} />
          Crear Regla
        </button>
      </div>

      {/* STATS */}
      <div className="flex gap-6 text-sm text-gray-600">
        <span>Total mostradas: {stats.total}</span>
        <span>Activas: {stats.active}</span>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow border flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select
            value={typeFilter ?? ""}
            onChange={(e) => {
              setPage(0);
              setTypeFilter(
                e.target.value === "" ? undefined : e.target.value
              );
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos</option>
            {RULE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            value={
              activeFilter === undefined
                ? ""
                : activeFilter
                ? "true"
                : "false"
            }
            onChange={(e) => {
              setPage(0);
              if (e.target.value === "") {
                setActiveFilter(undefined);
              } else {
                setActiveFilter(e.target.value === "true");
              }
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
        </div>

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Limpiar filtros
        </button>
      </div>

      {/* LISTA */}
      <div className="grid gap-6">
        {rules.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-10">
            No se encontraron reglas
          </div>
        )}

        {rules.map((rule) => (
          <TicketRuleCard
            key={rule.id}
            rule={rule}
            onUpdate={handleUpdateRule}
            onRefresh={loadRules}
          />
        ))}
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center gap-4">
        <button
          disabled={page === 0}
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="px-4 py-2">Página {page + 1}</span>

        <button
          disabled={rules.length < size}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* MODAL */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <CreateTicketEarningRuleForm onSubmit={handleCreateRule} />
        </Modal>
      )}
    </div>
  );
}

/* ================= MODAL ================= */

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}
