import React from "react";

interface CategoryListProps {
  node: any;
  onNavigate: (name: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({
  node,
  onNavigate,
  onBack,
  canGoBack,
}) => {
  if (!node) return null;

  return (
    <div className="p-4">
      <div className="flex items-center mb-2">
        {canGoBack && (
          <button
            className="mr-2 text-[#FFDE59] hover:underline"
            onClick={onBack}
          >
            ← Retour
          </button>
        )}
        <h2 className="text-lg font-bold text-[#ffffff]">{node.name}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {node.children?.map((child) => (
          <button
            key={child.name}
            className="bg-[#18122b99] text-[#fff] rounded px-3 py-2 hover:bg-[#2a2250] transition"
            onClick={() => onNavigate(child.name)}
          >
            {child.icon && <span className="mr-2">{child.icon}</span>}
            {child.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
