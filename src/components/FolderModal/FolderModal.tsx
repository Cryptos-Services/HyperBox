import React, { useState } from "react";

interface FolderModalProps {
  open: boolean;
  onConfirm: (folderName: string, icon: string) => void;
  onCancel: () => void;
}

const DEFAULT_ICONS = [
  "📁",
  "📂",
  "🗂️",
  "📋",
  "📊",
  "📈",
  "📉",
  "📦",
  "🏢",
  "🏠",
  "🎯",
  "⚡",
  "🔥",
  "💎",
  "🎨",
  "🛠️",
  "🔧",
  "⚙️",
  "🧰",
  "📱",
  "💻",
  "🖥️",
  "⌨️",
  "🖱️",
];

const FolderModal: React.FC<FolderModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [folderName, setFolderName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("📁");
  const [customIcon, setCustomIcon] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleConfirm = () => {
    if (folderName.trim()) {
      const iconToUse =
        showCustomInput && customIcon ? customIcon : selectedIcon;
      onConfirm(folderName.trim(), iconToUse);
      resetModal();
    }
  };

  const resetModal = () => {
    setFolderName("");
    setSelectedIcon("📁");
    setCustomIcon("");
    setShowCustomInput(false);
  };

  const handleCancel = () => {
    resetModal();
    onCancel();
  };

  if (!open) return null;

  return (
    <div
      className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 opacity-95"
      draggable="true"
      onDragStart={(e) => {
        // Seulement si on clique sur la zone de drag (header)
        if (!(e.target as HTMLElement).closest(".drag-handle")) {
          e.preventDefault();
          return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        e.dataTransfer.setData("offsetX", (e.clientX - rect.left).toString());
        e.dataTransfer.setData("offsetY", (e.clientY - rect.top).toString());
      }}
      onDragEnd={(e) => {
        const offsetX = parseInt(e.dataTransfer.getData("offsetX"));
        const offsetY = parseInt(e.dataTransfer.getData("offsetY"));

        // Nouvelle position
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;

        // Limites d'écran
        const maxLeft = window.innerWidth - 400;
        const maxTop = window.innerHeight - 450;

        const finalLeft = Math.max(0, Math.min(newLeft, maxLeft));
        const finalTop = Math.max(0, Math.min(newTop, maxTop));

        // Appliquer la position
        e.currentTarget.style.left = finalLeft + "px";
        e.currentTarget.style.top = finalTop + "px";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div className="w-[50vw] bg-[#030121] rounded-[24px] p-[6px] border-2 border-[#FFDE59] justify-center shadow-xl shadow-[#ffde59] min-w-[160px] min-h-[190px] align-items-center flex flex-col">
        <div className="drag-handle cursor-move mb-[12px]">
          <h2 className="text-[#ffde59] text-[20px] font-bold text-center">
            Créer un Dossier
          </h2>

          {/* Nom du dossier */}
          <div className="mb-[4px]">
            <label className="block text-[#f0f0f0] text-[16px] font-medium mb-[6px] ml-[14px]">
              Nom du dossier
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Nouveau dossier"
              className="w-[48vw] mx-[12px] bg-[#000000] border border-[#2a2250] rounded-[8px] text-[#f0f0f0] placeholder-[#ffde59] focus:outline-none focus:border-[#FFDE59] text-center text-[16px] mb-[12px] h-[36px]"
              autoFocus
            />
          </div>

          {/* Sélection d'icône */}
          <div className="mb-[4px]">
            <label className="block text-[#f0f0f0] text-sm font-medium mb-[6px] ml-[14px]">
              Icône du dossier
            </label>

            {/* Grille d'icônes par défaut */}
            <div className="grid grid-cols-8 bg-[#030121] gap-[2px] mb-[3px] min-h-[140px] overflow-y-auto align-items-center p-[4px] rounded-[8px] border border-[#ffde59] mx-[12px]">
              {DEFAULT_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    setSelectedIcon(icon);
                    setShowCustomInput(false);
                  }}
                  className={`w-12 h-12 text-lg rounded hover:bg-[#800080] transition ${
                    selectedIcon === icon && !showCustomInput
                      ? "bg-[#FFDE59] text-[#000000] hover:bg-[#b81414]"
                      : "bg-[#000000] text-[#f0f0f0] hover:bg-[#2a2250]"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Option icône personnalisée */}
            <div className="flex items-center gap-[2px] mb-[2px]">
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`px-[3px] py-[1px] ml-[14px] text-sm rounded-[8px] transition ${
                  showCustomInput
                    ? "bg-[#FFDE59] text-[#000000] hover:bg-[#800080]"
                    : "bg-[#000000] text-[#f0f0f0] hover:bg-[#800080]"
                }`}
              >
                Icône personnalisée
              </button>
            </div>

            {/* Input pour icône personnalisée */}
            {showCustomInput && (
              <input
                type="text"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                placeholder="Entrez un emoji ou une icône"
                className="w-[63vh] bg-[#000000] mx-[12px] my-[8px] border border-[#2a2250] rounded-[8px] text-[#f0f0f0] placeholder-[#ffde59] focus:outline-none focus:border-[#FFDE59] justify-center"
              />
            )}

            {/* Aperçu */}
            <div className="mt-[12px] p-[12px] bg-[#000000] rounded-[8px] border-[1px] border-[#2a2250] flex flex-col sm:flex-row items-center justify-center gap-[8px] text-[#f0f0f0] mx-[12px]">
              <span className="text-[14px]">Aperçu:</span>
              <div className="flex items-center gap-[8px]">
                <span className="text-[24px]">
                  {showCustomInput && customIcon ? customIcon : selectedIcon}
                </span>
                <span className="text-[16px] font-medium truncate max-w-[200px]">
                  {folderName || "Nouveau dossier"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer fixe */}
          <div className="flex flex-col sm:flex-row justify-end gap-[12px] mt-[24px] shrink-0">
            <button
              onClick={handleConfirm}
              disabled={!folderName.trim()}
              className="px-[24px] py-[8px] rounded-[8px] bg-[#00ff00] text-[#000000] font-semibold hover:bg-[#14b814] focus:outline-none focus:ring-[2px] focus:ring-[#ffde59] transition-all duration-[200ms] mx-[12px] disabled:opacity-[50] disabled:cursor-not-allowed"
            >
              Créer
            </button>
            <button
              onClick={handleCancel}
              className="px-[24px] py-[8px] rounded-[8px] bg-[#ff0000] text-[#f0f0f0] font-semibold hover:bg-[#b81414] focus:outline-none focus:ring-[2px] focus:ring-[#ffde59] transition-all duration-[200ms] mx-[12px] disabled:opacity-[50] disabled:cursor-not-allowed mb-[12px]"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;
