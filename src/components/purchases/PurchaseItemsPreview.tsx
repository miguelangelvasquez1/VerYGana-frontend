import { useState } from "react";
import { KeyRound } from "lucide-react";
import { ConsumerPurchaseItemResponseDTO, PurchaseItemStatus } from "@/types/purchases/purchaseItem.types";
import { purchaseItemStatusColor, purchaseItemStatusDot, purchaseItemStatusLabel } from "./purchaseItemMeta";
import DeliveredCodeModal from "./DeliveredCodeModal";

interface Props {
  items: ConsumerPurchaseItemResponseDTO[];
}

const PurchaseItemsPreview = ({ items }: Props) => {
  const [codeItem, setCodeItem] = useState<ConsumerPurchaseItemResponseDTO | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pt-11 pb-1 px-3">
      {items.map((item) => (
        <div key={item.id} className="w-20 flex-shrink-0 relative group">
          {/* Tooltip de estado: solo visible al pasar el mouse. Ancho fijo
              (en vez de whitespace-nowrap) para que las etiquetas largas
              envuelvan en vez de desbordar el carrusel; el padding del
              contenedor reserva espacio para que no se recorte
              (overflow-x-auto fuerza overflow-y a "auto", y el primer/último
              item no tiene columna vecina de donde "tomar prestado" espacio). */}
          <div className="pointer-events-none absolute -top-1 left-1/2 w-24 -translate-x-1/2 -translate-y-full opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-20">
            <span
              className={`block text-center text-[10px] leading-tight font-semibold px-2 py-1 rounded-lg shadow-md ring-1 ring-black/5 ${purchaseItemStatusColor[item.status]}`}
            >
              {purchaseItemStatusLabel[item.status]}
            </span>
          </div>

          <div className="relative">
            <img
              src={item.imageUrl}
              alt={item.productName}
              className="w-20 h-20 object-cover rounded-xl border border-gray-100 shadow-sm hover:scale-[1.03] transition-transform"
            />
            <span
              className={`absolute top-1 left-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${purchaseItemStatusDot[item.status]}`}
            />
            {item.status === PurchaseItemStatus.CLAIMED && (
              <button
                onClick={() => setCodeItem(item)}
                title="Ver código entregado"
                className="absolute bottom-1 right-1 w-7 h-7 flex items-center justify-center bg-[#03548C] text-white rounded-full shadow-sm hover:bg-[#03548C]/90 active:scale-95 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {codeItem && (
        <DeliveredCodeModal item={codeItem} onClose={() => setCodeItem(null)} />
      )}
    </div>
  );
};

export default PurchaseItemsPreview;
