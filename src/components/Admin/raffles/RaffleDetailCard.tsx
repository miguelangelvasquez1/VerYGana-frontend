import { useState } from "react";
import { RaffleResponseDTO } from "@/types/raffles/raffle.types";
import { PrizeResponseDTO } from "@/types/raffles/prize.types";
import { RaffleRuleResponseDTO } from "@/types/raffles/raffleRule.types";
import ConfirmDialog from "@/components/generic/ConfirmDialog";

type TabType = "general" | "prizes" | "rules" | "draw";

interface Props {
  raffle: RaffleResponseDTO;
  onDraw?: (raffleId: number) => Promise<void>;
  onCancel?: (raffleId: number) => Promise<void>;
}

export default function RaffleDetailCard({
  raffle,
  onDraw,
  onCancel,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"draw" | "cancel" | null>(
    null
  );

  const openConfirm = (action: "draw" | "cancel") => {
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    if (confirmAction === "draw" && onDraw) {
      await onDraw(raffle.id);
    }

    if (confirmAction === "cancel" && onCancel) {
      await onCancel(raffle.id);
    }

    setIsConfirmOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">

      {raffle.imageUrl && (
        <div className="w-full aspect-[2/1] rounded-xl overflow-hidden mb-4">
          <img
            src={raffle.imageUrl}
            alt={raffle.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      {/* HEADER */}
      <div className="relative">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {raffle.title}
          </h2>
          <div className="flex items-center">
            <h5 className="text-sm text-gray-950">
              Estado :
            </h5>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              {raffle.raffleStatus}
            </span>
          </div>
          <div className="flex items-center">
            <h5 className="text-sm text-gray-950">
              Tipo :
            </h5>
            <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
              {raffle.raffleType}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {raffle.raffleStatus === "ACTIVE" && (
            <button
              onClick={() => openConfirm("draw")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
            >
              Realizar Sorteo
            </button>
          )}

          {raffle.raffleStatus !== "CANCELLED" &&
            raffle.raffleStatus !== "COMPLETED" && (
              <button
                onClick={() => openConfirm("cancel")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
              >
                Cancelar Rifa
              </button>
            )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b pb-2">
        <TabButton label="General" value="general" />
        <TabButton label="Premios" value="prizes" />
        <TabButton label="Reglas" value="rules" />
        <TabButton label="Sorteo" value="draw" />
      </div>

      {/* CONTENT */}
      <div className="min-h-[300px]">
        {activeTab === "general" && <GeneralTab raffle={raffle} />}
        {activeTab === "prizes" && <PrizesTab prizes={raffle.prizes} />}
        {activeTab === "rules" && <RulesTab rules={raffle.rules} />}
        {activeTab === "draw" && <DrawTab raffle={raffle} />}
      </div>

      {/* CONFIRM */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={
          confirmAction === "draw"
            ? "Confirmar Sorteo"
            : "Confirmar Cancelación"
        }
        description={
          confirmAction === "draw"
            ? "Esta acción ejecutará el sorteo y no podrá revertirse."
            : "Esta acción cancelará la rifa permanentemente."
        }
        variant="danger"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onClose={() => setIsConfirmOpen(false)}
        requireTextConfirmation
        confirmationText="CONFIRMAR"
      />
    </div>
  );

  function TabButton({
    label,
    value,
  }: {
    label: string;
    value: TabType;
  }) {
    const isActive = activeTab === value;

    return (
      <button
        onClick={() => setActiveTab(value)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition ${isActive
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
      >
        {label}
      </button>
    );
  }
}

/* ================= GENERAL ================= */

function GeneralTab({ raffle }: { raffle: RaffleResponseDTO }) {
  const progress =
    raffle.maxTotalTickets > 0
      ? (raffle.totalTicketsIssued / raffle.maxTotalTickets) * 100
      : 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="font-semibold">Descripción</p>
        <p className="mt-1 text-gray-600">{raffle.description}</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p><strong>Inicio:</strong> {new Date(raffle.startDate).toLocaleString()}</p>
        <p><strong>Fin:</strong> {new Date(raffle.endDate).toLocaleString()}</p>
        <p><strong>Fecha Sorteo:</strong> {new Date(raffle.drawDate).toLocaleString()}</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p><strong>Máx Tickets por usuario:</strong> {raffle.maxTicketsPerUser}</p>
        <p><strong>Máx Tickets totales:</strong> {raffle.maxTotalTickets}</p>
        <p><strong>Emitidos:</strong> {raffle.totalTicketsIssued}</p>
        <p><strong>Participantes:</strong> {raffle.totalParticipants}</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p><strong>Requiere Mascota:</strong> {raffle.requiresPet ? "Sí" : "No"}</p>
        <p><strong>Método de Sorteo:</strong> {raffle.drawMethod}</p>
      </div>

      <div className="col-span-2 mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso de tickets</span>
          <span>{progress.toFixed(1)}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ================= PRIZES ================= */

function PrizesTab({ prizes }: { prizes: PrizeResponseDTO[] }) {
  if (!prizes.length) {
    return <p className="text-gray-500">No hay premios configurados.</p>;
  }

  const sorted = [...prizes].sort((a, b) => a.position - b.position);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {sorted.map((prize) => (
        <div
          key={prize.id}
          className="group border border-gray-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all"
        >
          {prize.imageUrl && (
            <img
              src={prize.imageUrl}
              alt={prize.title}
              loading="lazy"
              decoding="async"
              className="w-full aspect-square object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300"
            />
          )}

          <h3 className="font-semibold text-lg">{prize.title}</h3>

          <p className="text-sm text-gray-600 mt-1">
            {prize.description}
          </p>

          <div className="mt-3 text-sm space-y-1">
            <p><strong>Marca: </strong> {prize.brand}</p>
            <p><strong>Tipo: </strong> {prize.prizeType}</p>
            <p><strong>Valor: </strong>{prize.value.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
            })}</p>
            <p><strong>Posición: </strong> #{prize.position}</p>
            <p><strong>Cantidad:</strong> {prize.quantity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= RULES ================= */

function RulesTab({ rules }: { rules: RaffleRuleResponseDTO[] }) {
  if (!rules.length) {
    return <p className="text-gray-500">No hay reglas configuradas.</p>;
  }

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "Compra";
      case "ADS_WATCHED":
        return "Visualización de Anuncios";
      case "GAME_ACHIEVEMENT":
        return "Logro en Juego";
      case "REFERRAL":
        return "Referido";
      default:
        return type;
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-blue-100 text-blue-700";
      case "ADS_WATCHED":
        return "bg-yellow-100 text-yellow-700";
      case "GAME_ACHIEVEMENT":
        return "bg-purple-100 text-purple-700";
      case "REFERRAL":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {rules.map((rule) => {
        const earning = rule.ticketEarningRuleResponseDTO;

        const progress =
          rule.maxTicketsBySource > 0
            ? (rule.currentTicketsBySource / rule.maxTicketsBySource) * 100
            : 0;

        return (
          <div
            key={rule.id}
            className="border rounded-xl p-6 bg-gray-50 shadow-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-semibold text-gray-800 text-lg">
                  {earning.ruleName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {earning.description}
                </p>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${rule.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                {rule.isActive ? "Activa" : "Inactiva"}
              </span>
            </div>

            {/* Tipo y prioridad */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${getRuleTypeColor(
                  earning.ruleType
                )}`}
              >
                {getRuleTypeLabel(earning.ruleType)}
              </span>

              <span className="text-xs text-gray-500">
                Prioridad: {earning.priority}
              </span>
            </div>

            {/* Tickets otorgados */}
            <div className="grid md:grid-cols-2 gap-6 text-sm mb-5">
              <div>
                <p className="text-gray-500 text-xs">
                  Tickets que otorga esta regla
                </p>
                <p className="font-semibold text-gray-800 mt-1 text-lg">
                  {earning.ticketsToAward}
                </p>
              </div>

              {/* Condicional según tipo */}
              {earning.ruleType === "PURCHASE" &&
                earning.minPurchaseAmount !== null && (
                  <div>
                    <p className="text-gray-500 text-xs">
                      Monto mínimo de compra
                    </p>
                    <p className="font-semibold text-gray-800 mt-1">
                      ${earning.minPurchaseAmount.toLocaleString()}
                    </p>
                  </div>
                )}

              {earning.ruleType === "ADS_WATCHED" &&
                earning.minAdsWatched !== null && (
                  <div>
                    <p className="text-gray-500 text-xs">
                      Anuncios mínimos vistos
                    </p>
                    <p className="font-semibold text-gray-800 mt-1">
                      {earning.minAdsWatched}
                    </p>
                  </div>
                )}

              {earning.ruleType === "GAME_ACHIEVEMENT" &&
                earning.achievementType && (
                  <div>
                    <p className="text-gray-500 text-xs">
                      Tipo de logro requerido
                    </p>
                    <p className="font-semibold text-gray-800 mt-1">
                      {earning.achievementType}
                    </p>
                  </div>
                )}

              {earning.ruleType === "REFERRAL" &&
                earning.referralAddedQuantity !== null && (
                  <div>
                    <p className="text-gray-500 text-xs">
                      Referidos requeridos
                    </p>
                    <p className="font-semibold text-gray-800 mt-1">
                      {earning.referralAddedQuantity}
                    </p>
                  </div>
                )}
            </div>

            {/* Uso de tickets por fuente */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  Tickets generados por esta regla:
                  {" "}
                  {rule.currentTicketsBySource}
                </span>
                <span>
                  Límite:
                  {" "}
                  {rule.maxTicketsBySource}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}



/* ================= DRAW ================= */

function DrawTab({ raffle }: { raffle: RaffleResponseDTO }) {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Método:</strong> {raffle.drawMethod}
      </p>

      <div>
        <p className="font-semibold mt-4">
          Términos y Condiciones
        </p>
        <p className="whitespace-pre-wrap text-gray-600">
          {raffle.termsAndConditions}
        </p>
      </div>
    </div>
  );
}
