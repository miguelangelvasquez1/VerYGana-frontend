import { PurchaseItemResponseDTO } from "@/types/purchases/purchaseItem.types";

interface Props {
  items: PurchaseItemResponseDTO[];
}

const PurchaseItemsPreview = ({ items }: Props) => {
  return (
    <div className="flex gap-4 overflow-x-auto">
      {items.map((item) => (
        <div key={item.id} className="w-20 flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="w-20 h-20 object-cover rounded-lg border"
          />
        </div>
      ))}
    </div>
  );
};

export default PurchaseItemsPreview;
