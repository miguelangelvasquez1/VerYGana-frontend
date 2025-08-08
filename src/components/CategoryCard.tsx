interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-20 h-20 rounded-full overflow-hidden shadow-md">
        <img
          src={category.imageUrl}
          alt={category.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h2 className="text-sm text-center font-medium">{category.name}</h2>
    </div>
  );
};

export default CategoryCard;
