import { useState } from "react";
import { KeyRound } from "lucide-react";
import { ConsumerPurchaseItemResponseDTO, PurchaseItemStatus } from "@/types/purchases/purchaseItem.types";
import DeliveredCodeModal from "./DeliveredCodeModal";

interface Props {
  items: ConsumerPurchaseItemResponseDTO[];
}

const PurchaseItemsPreview = ({ items }: Props) => {
  const [codeItem, setCodeItem] = useState<ConsumerPurchaseItemResponseDTO | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto py-1 pr-1">
      {items.map((item) => (
        <div key={item.id} className="w-20 flex-shrink-0 relative">
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="w-20 h-20 object-cover rounded-xl border border-gray-100 shadow-sm hover:scale-[1.03] transition-transform"
          />
          {item.status === PurchaseItemStatus.DELIVERED && (
            <button
              onClick={() => setCodeItem(item)}
              title="Ver código entregado"
              className="absolute bottom-1 right-1 w-7 h-7 flex items-center justify-center bg-[#03548C] text-white rounded-full shadow-sm hover:bg-[#03548C]/90 active:scale-95 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

      {codeItem && (
        <DeliveredCodeModal item={codeItem} onClose={() => setCodeItem(null)} />
      )}
    </div>
  );
};

export default PurchaseItemsPreview;
