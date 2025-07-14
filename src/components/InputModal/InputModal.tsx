import React, { useCallback, useEffect, useRef, useState } from "react";

interface InputModalProps {
  open: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputModal: React.FC<InputModalProps> = ({
  open,
  title,
  placeholder = "",
  initialValue = "",
  confirmLabel = "OK",
  cancelLabel = "Annuler",
  type = "text",
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Mettre à jour la valeur quand le modal s'ouvre
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, open]);

  // ✅ Gérer le focus automatique avec délai
  useEffect(() => {
    if (open && inputRef.current) {
      // Délai pour s'assurer que le modal est complètement rendu
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select(); // Sélectionne tout le texte
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [open]);

  // ✅ Bloquer tous les événements globaux pendant que le modal est ouvert
  // ✅ Bloquer tous les événements globaux pendant que le modal est ouvert
  useEffect(() => {
    if (!open) return;

    // Fonction pour bloquer les événements globaux
    const blockGlobalEvents = (e: KeyboardEvent) => {
      // ✅ AUTORISER Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A dans l'input
      if (e.ctrlKey && ["c", "v", "x", "a"].includes(e.key.toLowerCase())) {
        return; // ✅ Laisser passer les raccourcis de copier/coller
      }

      // Laisser passer seulement les événements de notre input
      if (e.target !== inputRef.current) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    // Ajouter les listeners avec capture=true (priorité maximale)
    document.addEventListener("keydown", blockGlobalEvents, true);
    document.addEventListener("keyup", blockGlobalEvents, true);
    document.addEventListener("keypress", blockGlobalEvents, true);

    return () => {
      document.removeEventListener("keydown", blockGlobalEvents, true);
      document.removeEventListener("keyup", blockGlobalEvents, true);
      document.removeEventListener("keypress", blockGlobalEvents, true);
    };
  }, [open]);

  // ✅ Callbacks optimisés pour éviter les re-renders
  const handleConfirm = useCallback(() => {
    if (value.trim()) {
      onConfirm(value.trim());
    }
  }, [value, onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // ✅ Gestionnaire de clavier avec propagation bloquée
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Bloquer la propagation pour éviter les conflits
      e.stopPropagation();

      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
      // Laisser passer toutes les autres touches (lettres, espaces, etc.)
    },
    [handleConfirm, handleCancel]
  );

  // ✅ Gestionnaire de changement avec propagation bloquée
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setValue(e.target.value);
  }, []);

  // ✅ Gestionnaires pour les autres événements
  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
    },
    []
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
    },
    []
  );

  // ✅ Gestionnaire de clic sur l'overlay pour fermer
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  // ✅ Gestionnaire de clic sur le modal pour éviter la fermeture
  const handleModalClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
    []
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000] opacity-95"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-[#030121] rounded-[24px] p-[6px] min-w-[320px] border-2 border-[#FFDE59] justify-center shadow-lg shadow-[#ffde59]"
        onClick={handleModalClick}
      >
        <h2 className="text-[24px] font-bold mb-[16px] text-[#ffde59] text-center">
          {title}
        </h2>
        <input
          ref={inputRef}
          className="w-[300px] h-[12px] rounded-full p-[12px] rounded-xl border border-[#FFDE59] bg-[#000000] text-[#f0f0f0] focus:outline-none focus:border-[#ffde59] focus:ring-1 focus:ring-[#ffde59]"
          type={type}
          placeholder={placeholder}
          value={value}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onKeyPress={handleKeyPress}
        />
        <div className="flex justify-end gap-[4px] mt-[8px]">
          <button
            className="px-[4px] py-[1px] mt-[2px] rounded-full bg-[#00ff00] text-[#000000] font-semibold hover:bg-[#14b814] focus:outline-none focus:ring-1 focus:ring-[#ffde59]"
            onClick={handleConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
          <button
            className="px-[4px] py-[1px] mt-[2px] rounded-full bg-[#ff0000] text-[#f0f0f0] font-semibold hover:bg-[#b81414] focus:outline-none focus:ring-1 focus:ring-[#ffde59]"
            onClick={handleCancel}
            type="button"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
