import Image from "next/image";
import { ConsumerPurchaseResponseDTO, PurchaseStatus } from "@/types/purchases/purchase.types";
import PurchaseItemsPreview from "./PurchaseItemsPreview";
import PurchaseActions from "./PurchaseActions";
import { formatPesos } from "@/utils/currency";

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
    <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 space-y-4">

      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-sm sm:text-base text-gray-500">
            Pedido realizado el{" "}
            <span className="font-medium text-gray-900">
              {new Date(purchase.createdAt).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
          <p className="text-xs sm:text-sm text-gray-400 truncate">Ref: {purchase.referenceId}</p>
          {purchase.deliveryEmail && (
            <p className="text-xs sm:text-sm text-gray-400 truncate">
              Enviado a: <span className="text-gray-600">{purchase.deliveryEmail}</span>
            </p>
          )}
        </div>

        <span
          className={`text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor[purchase.status]}`}
        >
          {statusLabel[purchase.status]}
        </span>
      </div>

      {/* Productos */}
      <PurchaseItemsPreview items={purchase.items} />

      {/* Resumen financiero */}
      <div className="border-t pt-3 space-y-2 text-sm sm:text-base">
        {hasKeys && (
          <div className="flex justify-between text-gray-500">
            <span className="flex items-center gap-2">
              <Image
                src="/logos/llave.png"
                alt="llave"
                width={24}
                height={24}
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              Llaves utilizadas
            </span>
            <span>{purchase.keysValueCents / 1000}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900">
          <span className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">💵</span>
            Total pagado
          </span>
          <span>${formatPesos(purchase.cashCents)}</span>
        </div>
      </div>

      {/* Acciones */}
      <PurchaseActions purchase={purchase} />
    </div>
  );
};

export default PurchaseCard;
