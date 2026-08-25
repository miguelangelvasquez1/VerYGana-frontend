"use client";

import React, { useState } from "react";
import {
  activeTicketEarningRule,
  deactivateTicketEarningRule,
  deleteTicketEarningRule,
} from "@/services/admin/AdminRaffleService";

import {
  TicketEarningRuleResponseDTO,
  UpdateTicketEarningRuleRequestDTO,
} from "@/types/raffles/ticketEarningRule.types";

import toast from "react-hot-toast";

import {
  CheckCircle2,
  XCircle,
  Trash2,
  Power,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Users,
  Trophy,
  Clock,
  Tag,
  Award,
  Info,
} from "lucide-react";

/* ============================================================
   PROPS
   ============================================================ */

interface TicketRuleCardProps {
  rule: TicketEarningRuleResponseDTO;

  onUpdate: (
      id: number,
      data: UpdateTicketEarningRuleRequestDTO
  ) => Promise<void>;

  onRefresh: () => Promise<void>;
}

/* ============================================================
   CONFIGURACIÓN VISUAL
   ============================================================ */

interface RuleVisualConfig {
  label: string;
  icon: React.ReactNode;

  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentText: string;
  accentIconBg: string;
}

const RULE_VISUAL_CONFIG: Record<string, RuleVisualConfig> = {
  PURCHASE: {
    label: "Por compra",
    icon: <ShoppingCart className="w-4 h-4" />,
    accent: "bg-blue-500",
    accentSoft: "bg-blue-50",
    accentBorder: "border-blue-200",
    accentText: "text-blue-700",
    accentIconBg: "bg-blue-100 text-blue-700",
  },

  DAILY_LOGIN: {
    label: "Login diario",
    icon: <Calendar className="w-4 h-4" />,
    accent: "bg-amber-500",
    accentSoft: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-700",
    accentIconBg: "bg-amber-100 text-amber-700",
  },

  REFERRAL: {
    label: "Por referido",
    icon: <Users className="w-4 h-4" />,
    accent: "bg-purple-500",
    accentSoft: "bg-purple-50",
    accentBorder: "border-purple-200",
    accentText: "text-purple-700",
    accentIconBg: "bg-purple-100 text-purple-700",
  },

  ADS_WATCHED: {
    label: "Anuncios vistos",
    icon: <Trophy className="w-4 h-4" />,
    accent: "bg-cyan-500",
    accentSoft: "bg-cyan-50",
    accentBorder: "border-cyan-200",
    accentText: "text-cyan-700",
    accentIconBg: "bg-cyan-100 text-cyan-700",
  },

  GAME_ACHIEVEMENT: {
    label: "Logro del juego",
    icon: <Award className="w-4 h-4" />,
    accent: "bg-rose-500",
    accentSoft: "bg-rose-50",
    accentBorder: "border-rose-200",
    accentText: "text-rose-700",
    accentIconBg: "bg-rose-100 text-rose-700",
  },
};

/* ============================================================
   COMPONENTE
   ============================================================ */

const TicketRuleCard: React.FC<TicketRuleCardProps> = ({
                                                         rule,
                                                         onRefresh,
                                                       }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const visual =
      RULE_VISUAL_CONFIG[rule.ruleType] ||
      {
        label: rule.ruleType,
        icon: <Tag className="w-4 h-4" />,
        accent: "bg-slate-500",
        accentSoft: "bg-slate-50",
        accentBorder: "border-slate-200",
        accentText: "text-slate-700",
        accentIconBg: "bg-slate-100 text-slate-700",
      };

  /* ============================================================
     TOGGLE
     ============================================================ */

  const handleToggle = async () => {
    try {
      setLoading(true);

      if (rule.active) {
        await deactivateTicketEarningRule(rule.id);
        toast.success("Regla desactivada correctamente");
      } else {
        await activeTicketEarningRule(rule.id);
        toast.success("Regla activada correctamente");
      }

      await onRefresh();
    } catch {
      toast.error("No se pudo cambiar el estado de la regla");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     DELETE
     ============================================================ */

  const handleDelete = async () => {
    try {
      setLoading(true);

      await deleteTicketEarningRule(rule.id);

      toast.success("Regla eliminada correctamente");

      setShowDeleteConfirm(false);

      await onRefresh();
    } catch {
      toast.error("No se pudo eliminar la regla");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     FECHAS
     ============================================================ */

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ============================================================
     CONDICIÓN
     ============================================================ */

  const renderCondition = () => {
    switch (rule.ruleType) {
      case "PURCHASE":
        return (
            <ConditionValue
                label="Monto mínimo"
                value={
                  rule.minPurchaseAmount != null
                      ? `$${rule.minPurchaseAmount.toLocaleString("es-CO")}`
                      : "No definido"
                }
                accent={visual.accentText}
            />
        );

      case "DAILY_LOGIN":
        return (
            <ConditionValue
                label="Frecuencia"
                value="Una vez al día"
                accent={visual.accentText}
            />
        );

      case "REFERRAL":
        return (
            <ConditionValue
                label="Referidos requeridos"
                value={
                  rule.referralAddedQuantity != null
                      ? `${rule.referralAddedQuantity} usuarios`
                      : "No definido"
                }
                accent={visual.accentText}
            />
        );

      case "ADS_WATCHED":
        return (
            <ConditionValue
                label="Anuncios mínimos"
                value={
                  rule.minAdsWatched != null
                      ? `${rule.minAdsWatched}`
                      : "No definido"
                }
                accent={visual.accentText}
            />
        );

      case "GAME_ACHIEVEMENT":
        return (
            <ConditionValue
                label="Tipo de logro"
                value={rule.achievementType || "No definido"}
                accent={visual.accentText}
            />
        );

      default:
        return (
            <ConditionValue
                label="Condición"
                value="Sin condición específica"
                accent={visual.accentText}
            />
        );
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
      <>
        <article
            className="
          relative
          overflow-hidden
          bg-white
          rounded-2xl
          border
          border-slate-200
          shadow-sm
          transition-all
          duration-200
          hover:shadow-lg
          hover:border-slate-300
        "
        >
          {/* ======================================================
            ACENTO SUPERIOR
        ====================================================== */}

          <div className={`h-1 ${visual.accent}`} />

          {/* ======================================================
            HEADER
        ====================================================== */}

          <div className="px-5 pt-5 pb-4 sm:px-6">
            <div
                className="
              flex
              flex-col
              md:flex-row
              md:items-start
              md:justify-between
              gap-4
            "
            >
              {/* IDENTIDAD */}

              <div className="flex items-start gap-3.5 min-w-0">
                {/* ICONO */}

                <div
                    className={`
                  w-11
                  h-11
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  shrink-0
                  ${visual.accentIconBg}
                `}
                >
                  {visual.icon}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                        className="
                      text-lg
                      font-bold
                      text-slate-900
                      leading-tight
                    "
                    >
                      {rule.ruleName}
                    </h3>

                    {/* ESTADO */}

                    <span
                        className={`
                      inline-flex
                      items-center
                      gap-1.5
                      px-2.5
                      py-1
                      rounded-full
                      text-xs
                      font-semibold
                      ${
                            rule.active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                        }
                    `}
                    >
                    {rule.active ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                        <XCircle className="w-3.5 h-3.5" />
                    )}

                      {rule.active ? "Activa" : "Inactiva"}
                  </span>
                  </div>

                  <p
                      className="
                    mt-1.5
                    text-sm
                    text-slate-500
                    leading-relaxed
                    max-w-2xl
                  "
                  >
                    {rule.description || "Sin descripción"}
                  </p>

                  {/* TIPO */}

                  <div
                      className={`
                    inline-flex
                    items-center
                    gap-1.5
                    mt-3
                    px-2.5
                    py-1
                    rounded-lg
                    ${visual.accentSoft}
                    ${visual.accentText}
                    text-xs
                    font-semibold
                    border
                    ${visual.accentBorder}
                  `}
                  >
                    {visual.icon}

                    {visual.label}
                  </div>
                </div>
              </div>

              {/* PRIORIDAD */}

              <div
                  className="
                shrink-0
                flex
                items-center
                gap-2
                md:pt-1
              "
              >
                <div
                    className="
                  px-3
                  py-2
                  rounded-xl
                  bg-slate-50
                  border
                  border-slate-200
                "
                >
                  <p className="text-[11px] text-slate-400">
                    Prioridad
                  </p>

                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    Nivel {rule.priority}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================
            INFORMACIÓN PRINCIPAL
        ====================================================== */}

          <div
              className="
            mx-5
            sm:mx-6
            rounded-xl
            border
            border-slate-200
            overflow-hidden
          "
          >
            <div
                className="
              grid
              grid-cols-1
              md:grid-cols-3
              divide-y
              md:divide-y-0
              md:divide-x
              divide-slate-200
            "
            >
              {/* TICKETS */}

              <div
                  className="
                p-4
                bg-emerald-50/60
              "
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                      className="
                    w-7
                    h-7
                    rounded-lg
                    bg-emerald-100
                    text-emerald-700
                    flex
                    items-center
                    justify-center
                  "
                  >
                    <Award className="w-4 h-4" />
                  </div>

                  <span
                      className="
                    text-xs
                    font-semibold
                    text-emerald-700
                  "
                  >
                  Beneficio
                </span>
                </div>

                <p className="text-xs text-slate-500">
                  Tickets que otorga
                </p>

                <p
                    className="
                  text-2xl
                  font-extrabold
                  text-emerald-700
                  mt-0.5
                "
                >
                  +{rule.ticketsToAward}
                </p>
              </div>

              {/* CONDICIÓN */}

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                      className={`
                    w-7
                    h-7
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    ${visual.accentIconBg}
                  `}
                  >
                    <Info className="w-4 h-4" />
                  </div>

                  <span
                      className="
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                  >
                  Condición
                </span>
                </div>

                {renderCondition()}
              </div>

              {/* ACTUALIZACIÓN */}

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                      className="
                    w-7
                    h-7
                    rounded-lg
                    bg-slate-100
                    text-slate-500
                    flex
                    items-center
                    justify-center
                  "
                  >
                    <Clock className="w-4 h-4" />
                  </div>

                  <span
                      className="
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                  >
                  Actualización
                </span>
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  {formatDate(rule.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================
            METADATA
        ====================================================== */}

          <div
              className="
            px-5
            sm:px-6
            py-3.5
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-2
          "
          >
            <div
                className="
              flex
              items-center
              gap-1.5
              text-xs
              text-slate-400
            "
            >
              <Clock className="w-3.5 h-3.5" />

              Creada el {formatDate(rule.createdAt)}
            </div>

            <span
                className="
              text-xs
              text-slate-400
            "
            >
            ID #{rule.id}
          </span>
          </div>

          {/* ======================================================
            ACCIONES
        ====================================================== */}

          <div
              className="
            px-5
            sm:px-6
            py-3.5
            bg-slate-50
            border-t
            border-slate-200
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-end
            gap-2
          "
          >
            {/* DESACTIVAR / ACTIVAR */}

            <button
                type="button"
                onClick={handleToggle}
                disabled={loading}
                className={`
              inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              border
              transition-all
              duration-200
              active:scale-[0.98]
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${
                    rule.active
                        ? `
                    bg-white
                    text-slate-700
                    border-slate-300
                    hover:bg-amber-50
                    hover:text-amber-700
                    hover:border-amber-200
                  `
                        : `
                    bg-emerald-600
                    text-white
                    border-emerald-600
                    hover:bg-emerald-700
                  `
                }
            `}
            >
              <Power className="w-4 h-4" />

              {loading
                  ? "Procesando..."
                  : rule.active
                      ? "Desactivar"
                      : "Activar"}
            </button>

            {/* ELIMINAR */}

            <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="
              inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              text-rose-600
              bg-white
              border
              border-slate-300
              hover:bg-rose-50
              hover:border-rose-200
              transition-all
              duration-200
              active:scale-[0.98]
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            >
              <Trash2 className="w-4 h-4" />

              Eliminar
            </button>
          </div>
        </article>

        {/* ========================================================
          MODAL DELETE
      ======================================================== */}

        {showDeleteConfirm && (
            <div
                className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            p-4
            bg-slate-900/55
            backdrop-blur-sm
          "
                role="dialog"
                aria-modal="true"
                aria-labelledby={`delete-rule-title-${rule.id}`}
            >
              <div
                  className="
              w-full
              max-w-md
              bg-white
              rounded-2xl
              shadow-2xl
              border
              border-slate-200
              overflow-hidden
            "
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                        className="
                    w-11
                    h-11
                    rounded-xl
                    bg-rose-50
                    border
                    border-rose-100
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                    >
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>

                    <div>
                      <h3
                          id={`delete-rule-title-${rule.id}`}
                          className="
                      text-lg
                      font-bold
                      text-slate-900
                    "
                      >
                        ¿Eliminar regla?
                      </h3>

                      <p
                          className="
                      mt-1.5
                      text-sm
                      leading-relaxed
                      text-slate-600
                    "
                      >
                        Estás a punto de eliminar la regla{" "}
                        <strong className="text-slate-800">
                          "{rule.ruleName}"
                        </strong>
                        .
                      </p>
                    </div>
                  </div>

                  <div
                      className="
                  mt-5
                  px-4
                  py-3
                  rounded-xl
                  bg-rose-50
                  border
                  border-rose-100
                  text-sm
                  text-rose-700
                  leading-relaxed
                "
                  >
                    Esta acción es permanente y no se puede
                    deshacer.
                  </div>
                </div>

                <div
                    className="
                px-6
                py-4
                bg-slate-50
                border-t
                border-slate-100
                flex
                flex-col-reverse
                sm:flex-row
                sm:justify-end
                gap-2
              "
                >
                  <button
                      type="button"
                      onClick={() =>
                          setShowDeleteConfirm(false)
                      }
                      disabled={loading}
                      className="
                  px-4
                  py-2.5
                  rounded-xl
                  text-sm
                  font-semibold
                  text-slate-700
                  bg-white
                  border
                  border-slate-300
                  hover:bg-slate-100
                  transition-colors
                  disabled:opacity-50
                "
                  >
                    Cancelar
                  </button>

                  <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="
                  px-4
                  py-2.5
                  rounded-xl
                  text-sm
                  font-semibold
                  text-white
                  bg-rose-600
                  hover:bg-rose-700
                  transition-colors
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
                  >
                    {loading
                        ? "Eliminando..."
                        : "Eliminar regla"}
                  </button>
                </div>
              </div>
            </div>
        )}
      </>
  );
};

/* ================================================================
   CONDITION VALUE
   ================================================================ */

function ConditionValue({
                          label,
                          value,
                          accent,
                        }: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
      <div>
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p
            className={`
          text-base
          font-bold
          mt-0.5
          ${accent}
        `}
        >
          {value}
        </p>
      </div>
  );
}

export default TicketRuleCard;