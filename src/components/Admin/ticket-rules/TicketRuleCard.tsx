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

interface TicketRuleCardProps {
  rule: TicketEarningRuleResponseDTO;
  onUpdate: (
    id: number,
    data: UpdateTicketEarningRuleRequestDTO
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const TicketRuleCard: React.FC<TicketRuleCardProps> = ({
  rule,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);

  /* ================= TOGGLE ACTIVE ================= */

  const handleToggle = async () => {
    try {
      setLoading(true);

      if (rule.active) {
        await deactivateTicketEarningRule(rule.id);
        toast.success("Regla desactivada");
      } else {
        await activeTicketEarningRule(rule.id);
        toast.success("Regla activada");
      }

      await onRefresh();
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar esta regla?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteTicketEarningRule(rule.id);
      toast.success("Regla eliminada correctamente");
      await onRefresh();
    } catch {
      toast.error("Error al eliminar la regla");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CONDITION RENDER ================= */

  const renderCondition = () => {
    switch (rule.ruleType) {
      case "PURCHASE":
        return (
          <p>
            <strong>Monto mínimo de compra:</strong> {rule.minPurchaseAmount}
          </p>
        );

      case "ADS_WATCHED":
        return (
          <p>
            <strong>Anuncios mínimos visualizados:</strong> {rule.minAdsWatched}
          </p>
        );

      case "GAME_ACHIEVEMENT":
        return (
          <p>
            <strong>Tipo de logro:</strong> {rule.achievementType}
          </p>
        );

      case "REFERRAL":
        return (
          <p>
            <strong>Cantidad de referidos requerida:</strong>{" "}
            {rule.referralAddedQuantity}
          </p>
        );

      default:
        return null;
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="bg-white rounded-xl shadow p-6 border">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{rule.ruleName}</h3>
          <p className="text-sm text-gray-500">{rule.description}</p>
        </div>

        <span
          className={`px-3 py-1 text-xs rounded-full ${
            rule.active
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {rule.active ? "Activa" : "Inactiva"}
        </span>
      </div>

      {/* BODY */}
      <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <p>
            <strong>Tipo:</strong> {rule.ruleType}
          </p>
          <p>
            <strong>Prioridad:</strong> {rule.priority}
          </p>
          <p>
            <strong>Tickets que otorga:</strong> {rule.ticketsToAward}
          </p>
        </div>

        <div>
          {renderCondition()}
          <p>
            <strong>Fecha de creación:</strong>{" "}
            {new Date(rule.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Última actualización:</strong>{" "}
            {new Date(rule.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleToggle}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {rule.active ? "Desactivar" : "Activar"}
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default TicketRuleCard;
