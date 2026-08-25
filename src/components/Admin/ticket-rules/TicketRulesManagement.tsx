"use client";

import React, { useEffect, useState } from "react";
import { Plus, X, Filter, RotateCcw, AlertCircle } from "lucide-react";
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

/* ============================================================
   CONSTANTES
   ============================================================ */

const RULE_TYPES = [
  "PURCHASE",
  "DAILY_LOGIN",
  "REFERRAL",
];

const RULE_TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Por Compra",
  DAILY_LOGIN: "Login Diario",
  REFERRAL: "Por Referido",
};

const RULE_TYPE_COLORS: Record<string, string> = {
  PURCHASE: "bg-blue-50 text-blue-700 border-blue-200",
  DAILY_LOGIN: "bg-amber-50 text-amber-700 border-amber-200",
  REFERRAL: "bg-purple-50 text-purple-700 border-purple-200",
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function TicketRulesManagement() {
  const [rules, setRules] = useState<TicketEarningRuleResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();

  const [page, setPage] = useState(0);
  const size = 10;

  const [stats, setStats] = useState({
    active: 0,
    total: 0,
  });

  /* ============================================================
     LOAD DATA
     ============================================================ */

  const loadStats = async (): Promise<void> => {
    try {
      const active = await countActiveTicketEarningRules();
      setStats((prev) => ({ ...prev, active }));
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadRules = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

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
      setError("Error al cargar las reglas de tickets");
      toast.error("Error al cargar las reglas");
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

  /* ============================================================
     ACTIONS
     ============================================================ */

  const handleUpdateRule = async (
      id: number,
      data: UpdateTicketEarningRuleRequestDTO
  ): Promise<void> => {
    const loadingToast = toast.loading("Actualizando regla...");

    try {
      await updateTicketEarningRule(id, data);
      toast.dismiss(loadingToast);
      toast.success("Regla actualizada correctamente");
      await loadRules();
      await loadStats();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Error al actualizar la regla");
    }
  };

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

  /* ============================================================
     RENDER
     ============================================================ */

  return (
      <div className="space-y-8">

        {/* ==================================================
          HEADER
      ================================================== */}

        <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-4
      ">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Reglas de Tickets
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona las reglas para la asignación de tickets en las rifas
            </p>
          </div>

          <button
              onClick={() => setShowCreate(true)}
              className="
    inline-flex
    items-center
    gap-2
    cursor-pointer
    px-5
    py-2.5
    bg-[#00A4FF]
    hover:bg-[#0089D6]
    text-white
    font-semibold
    rounded-xl
    text-sm
    shadow-sm
    transition-all
    active:scale-95
    whitespace-nowrap
  "
          >
            <Plus className="w-4 h-4" />
            Crear Regla
          </button>
        </div>

        {/* ==================================================
          STATS
      ================================================== */}

        <div className="
        grid
        grid-cols-1
        sm:grid-cols-3
        gap-4
      ">
          <StatCard
              label="Total de reglas"
              value={stats.total}
              color="blue"
          />
          <StatCard
              label="Reglas activas"
              value={stats.active}
              color="emerald"
          />
          <StatCard
              label="Reglas inactivas"
              value={stats.total - stats.active}
              color="slate"
          />
        </div>

        {/* ==================================================
          FILTROS
      ================================================== */}

        <div className="
        bg-white
        rounded-2xl
        border
        border-slate-100
        shadow-sm
        p-5
        space-y-4
      ">
          <div className="
          flex
          flex-wrap
          items-center
          gap-4
        ">
            <div className="flex items-center gap-2 text-slate-500">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex flex-wrap items-center gap-3">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Tipo
                </label>
                <select
                    value={typeFilter ?? ""}
                    onChange={(e) => {
                      setPage(0);
                      setTypeFilter(
                          e.target.value === "" ? undefined : e.target.value
                      );
                    }}
                    className="
                  border
                  border-slate-200
                  rounded-xl
                  px-3
                  py-1.5
                  text-sm
                  bg-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-emerald-500/20
                  focus:border-emerald-500
                  transition-all
                  min-w-[140px]
                "
                >
                  <option value="">Todos los tipos</option>
                  {RULE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {RULE_TYPE_LABELS[type]}
                      </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Estado
                </label>
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
                    className="
                  border
                  border-slate-200
                  rounded-xl
                  px-3
                  py-1.5
                  text-sm
                  bg-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-emerald-500/20
                  focus:border-emerald-500
                  transition-all
                  min-w-[140px]
                "
                >
                  <option value="">Todos los estados</option>
                  <option value="true">Activas</option>
                  <option value="false">Inactivas</option>
                </select>
              </div>

              <button
                  onClick={resetFilters}
                  className="
                inline-flex
                items-center
                gap-1.5
                cursor-pointer
                px-4
                py-1.5
                mt-5
                text-sm
                text-slate-500
                hover:text-slate-700
                bg-slate-100
                hover:bg-slate-200
                rounded-xl
                transition-all
              "
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar
              </button>
            </div>
          </div>

          {/* Resultados */}
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
            Mostrando {rules.length} regla{rules.length !== 1 ? "s" : ""}
            {typeFilter && ` · Tipo: ${RULE_TYPE_LABELS[typeFilter]}`}
            {activeFilter !== undefined && ` · ${activeFilter ? "Activas" : "Inactivas"}`}
          </div>
        </div>

        {/* ==================================================
          LISTA DE REGLAS
      ================================================== */}

        {loading && rules.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        ) : error ? (
            <div className="
          flex
          items-start
          gap-3
          rounded-2xl
          border
          border-rose-200/80
          bg-rose-50/70
          p-4
          text-sm
          text-rose-900
        ">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">Error al cargar las reglas</p>
                <p className="leading-relaxed">{error}</p>
              </div>
              <button
                  onClick={loadRules}
                  className="
              ml-auto
              shrink-0
              px-3
              py-1
              bg-rose-100
              hover:bg-rose-200
              text-rose-700
              rounded-lg
              text-xs
              font-medium
              transition-colors
            "
              >
                Reintentar
              </button>
            </div>
        ) : rules.length === 0 ? (
            <div className="
          text-center
          py-16
          bg-slate-50/60
          rounded-2xl
          border
          border-dashed
          border-slate-200
        ">
              <div className="
            w-16
            h-16
            bg-slate-100
            rounded-full
            flex
            items-center
            justify-center
            mx-auto
            mb-3
          ">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                No se encontraron reglas
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {typeFilter || activeFilter !== undefined
                    ? "Prueba ajustando los filtros"
                    : "Crea tu primera regla de tickets"}
              </p>
              {!typeFilter && activeFilter === undefined && (
                  <button
                      onClick={() => setShowCreate(true)}
                      className="
                mt-4
                inline-flex
                items-center
                gap-2
                cursor-pointer
                px-4
                py-2
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                font-medium
                rounded-xl
                text-sm
                transition-all
              "
                  >
                    <Plus className="w-4 h-4" />
                    Crear regla
                  </button>
              )}
            </div>
        ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                  <TicketRuleCard
                      key={rule.id}
                      rule={rule}
                      onUpdate={handleUpdateRule}
                      onRefresh={loadRules}
                  />
              ))}
            </div>
        )}

        {/* ==================================================
          PAGINACIÓN
      ================================================== */}

        {rules.length > 0 && (
            <div className="
          flex
          items-center
          justify-center
          gap-3
          pt-4
          border-t
          border-slate-100
        ">
              <button
                  disabled={page === 0}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  className="
              cursor-pointer
              px-4
              py-2
              bg-slate-100
              hover:bg-slate-200
              disabled:opacity-40
              disabled:cursor-not-allowed
              disabled:hover:bg-slate-100
              text-slate-700
              font-medium
              rounded-xl
              text-sm
              transition-all
            "
              >
                Anterior
              </button>

              <span className="px-4 py-2 text-sm font-medium text-slate-600">
            Página <span className="text-slate-900 font-bold">{page + 1}</span>
          </span>

              <button
                  disabled={rules.length < size}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="
              cursor-pointer
              px-4
              py-2
              bg-slate-100
              hover:bg-slate-200
              disabled:opacity-40
              disabled:cursor-not-allowed
              disabled:hover:bg-slate-100
              text-slate-700
              font-medium
              rounded-xl
              text-sm
              transition-all
            "
              >
                Siguiente
              </button>
            </div>
        )}

        {/* ==================================================
          MODAL CREAR REGLA
      ================================================== */}

        {showCreate && (
            <div className="
          fixed
          inset-0
          bg-slate-900/60
          backdrop-blur-xs
          flex
          items-center
          justify-center
          z-50
          p-4
        ">
              <div className="
            bg-white
            rounded-3xl
            max-w-2xl
            w-full
            relative
            shadow-2xl
            overflow-hidden
            max-h-[90vh]
            flex
            flex-col
            border
            border-slate-100
            animate-in
            fade-in
            zoom-in-95
            duration-200
          ">
                <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="
                cursor-pointer
                absolute
                top-4
                right-4
                z-50
                p-2
                text-slate-400
                hover:text-slate-700
                bg-white/80
                hover:bg-slate-100
                rounded-xl
                transition-all
              "
                    aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                  <CreateTicketEarningRuleForm onSubmit={handleCreateRule} />
                </div>
              </div>
            </div>
        )}
      </div>
  );
}

/* ================================================================
   STAT CARD
   ================================================================ */

function StatCard({
                    label,
                    value,
                    color,
                  }: {
  label: string;
  value: number;
  color: "blue" | "emerald" | "slate";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  const iconColors = {
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    slate: "text-slate-500",
  };

  return (
      <div className={`
      rounded-2xl
      border
      p-5
      ${colors[color]}
      transition-all
    `}>
        <p className="text-sm font-medium opacity-80">{label}</p>
        <p className="text-3xl font-extrabold mt-1">{value}</p>
      </div>
  );
}