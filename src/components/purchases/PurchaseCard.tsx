import { ConsumerPurchaseResponseDTO, PurchaseStatus } from "@/types/purchases/purchase.types";
import PurchaseItemsPreview from "./PurchaseItemsPreview";
import PurchaseActions from "./PurchaseActions";
import { formatCents } from "@/utils/currency";

interface Props {
  purchase: ConsumerPurchaseResponseDTO;
}

const statusLabel: Record<PurchaseStatus, string> = {
  [PurchaseStatus.PENDING]: "Pendiente",
  [PurchaseStatus.PROCCESSING]: "En proceso",
  [PurchaseStatus.COMPLETED]: "Completado",
  [PurchaseStatus.FAILED]: "Fallido",
};

const statusColor: Record<PurchaseStatus, string> = {
  [PurchaseStatus.PENDING]: "text-yellow-600 bg-yellow-50",
  [PurchaseStatus.PROCCESSING]: "text-blue-600 bg-blue-50",
  [PurchaseStatus.COMPLETED]: "text-green-600 bg-green-50",
  [PurchaseStatus.FAILED]: "text-red-600 bg-red-50",
};

const PurchaseCard = ({ purchase }: Props) => {
  const hasKeys = purchase.keysValueCents > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">
            Pedido realizado el{" "}
            <span className="font-medium text-gray-900">
              {new Date(purchase.createdAt).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
          <p className="text-xs text-gray-400">Ref: {purchase.referenceId}</p>
          {purchase.deliveryEmail && (
            <p className="text-xs text-gray-400">
              Enviado a: <span className="text-gray-600">{purchase.deliveryEmail}</span>
            </p>
          )}
        </div>

        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[purchase.status]}`}
        >
          {statusLabel[purchase.status]}
        </span>
      </div>

      {/* Productos */}
      <PurchaseItemsPreview items={purchase.items} />

      {/* Resumen financiero */}
      <div className="border-t pt-3 space-y-1 text-sm">
        {hasKeys && (
          <div className="flex justify-between text-gray-500">
            <span>Pagado con llaves</span>
            <span>${formatCents(purchase.keysValueCents)}</span>
          </div>
        )}
        {hasKeys && (
          <div className="flex justify-between text-gray-500">
            <span>Pagado con tarjeta</span>
            <span>${formatCents(purchase.cashCents)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900">
          <span>Total</span>
          <span>${formatCents(purchase.totalCents)}</span>
        </div>
      </div>

      {/* Acciones */}
      <PurchaseActions purchase={purchase} />
    </div>
  );
};

export default PurchaseCard;
