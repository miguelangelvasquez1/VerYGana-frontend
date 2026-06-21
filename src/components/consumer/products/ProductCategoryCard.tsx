import { ProductCategoryResponseDTO } from "@/types/products/ProductCategory.types";

interface ProductCategoryCardProps {
  category: ProductCategoryResponseDTO;
}

const ProductCategoryCard: React.FC<ProductCategoryCardProps> = ({ category }) => {
  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="w-20 h-20 rounded-full overflow-hidden shadow-md transition-transform duration-200 group-hover:scale-110">
        <img
          src={category.imageUrl}
          alt={category.name}
          className="w-full h-full object-cover"
        />
      </div>

      <h2 className="text-xs text-center font-semibold text-gray-700 leading-tight">
        {category.name}
      </h2>
    </div>
  );
};

export default ProductCategoryCard;
