import { PurchaseResponseDTO } from "@/types/purchases/purchase.types";
import PurchaseItemsPreview from "./PurchaseItemsPreview";
import PurchaseActions from "./PurchaseActions";

interface Props {
  purchase: PurchaseResponseDTO;
}

const PurchaseCard = ({ purchase }: Props) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Pedido realizado el{" "}
            <span className="font-medium text-gray-900">
              {new Date(purchase.createdAt).toLocaleDateString()}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            Referencia: {purchase.referenceId}
          </p>
        </div>

        <p className="text-lg font-semibold text-gray-900">
          ${purchase.total.toLocaleString()}
        </p>
      </div>

      {/* Productos */}
      <PurchaseItemsPreview items={purchase.items} />

      {/* Acciones */}
      <PurchaseActions purchase={purchase} />
    </div>
  );
};

export default PurchaseCard;
