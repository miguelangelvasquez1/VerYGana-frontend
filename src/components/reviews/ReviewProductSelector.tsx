import { PurchaseItemToReviewResponseDTO } from "@/types/productReview.types";

interface Props {
  items: PurchaseItemToReviewResponseDTO[];
  onSelect: (item: PurchaseItemToReviewResponseDTO) => void;
}

export default function ReviewProductSelector({ items, onSelect }: Props) {
  if (items.length === 0) {
    return <p className="text-center">No pending reviews</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Select a product to review
      </h2>

      <ul className="space-y-3">
        {items.map(item => (
          <li
            key={item.purchaseItemId}
            onClick={() => onSelect(item)}
            className="flex gap-3 items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <img
              src={item.productImageUrl}
              className="w-12 h-12 rounded object-cover"
            />
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-xs text-gray-500">
                Delivered: {item.deliveredAt}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
