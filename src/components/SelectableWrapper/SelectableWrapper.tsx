import React, { ReactNode, useState } from "react";

interface SelectableWrapperProps {
  children: ReactNode;
  onSelectionChange: (selectedItems: any[]) => void;
  className?: string;
}

const SelectableWrapper: React.FC<SelectableWrapperProps> = ({
  children,
  onSelectionChange,
  className = "",
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  return (
    <div
      className={`${className} relative`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setIsSelecting(true);
          console.log("🖱️ Début sélection");
        }
      }}
      onMouseMove={(e) => {
        if (isSelecting) {
          console.log("📏 Sélection en cours");
        }
      }}
      onMouseUp={() => {
        if (isSelecting) {
          setIsSelecting(false);
          console.log("✅ Fin sélection");
          onSelectionChange([]);
        }
      }}
    >
      {children}

      {/* Rectangle de sélection */}
      {isSelecting && selectionBox && <div className="selection-rectangle" />}
    </div>
  );
};

export default SelectableWrapper;
