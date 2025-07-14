import React, { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import "../../index.css";
import { AppGridItem } from "../../types/AppGridItem";
import { useContextMenu } from "../ContextMenu/ContextMenuContext";
import FolderModal from "../FolderModal/FolderModal";
import InputModal from "../InputModal/InputModal";
// dnd-kit imports
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Fonction utilitaire pour vérifier si une chaîne est une URL d'image
function isImageUrl(str: string) {
  return (
    /^https?:\/\//i.test(str) ||
    str.startsWith("data:image/") || // ✅ CORRIGÉ : data:image/ au lieu de data:
    str.startsWith("file:") // Ajout de file: pour les fichiers locaux
  );
}

// Type pour les fichiers Electron
interface ElectronFile extends File {
  path: string;
}

// Définition des props pour le composant AppGrid
interface AppGridProps {
  items: AppGridItem[];
  displayType: "children" | "items";
  currentPath: string[]; // Ajoute ceci
  onDragEnd: (result: any) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAdd?: (item: Partial<AppGridItem>) => void;
  onOpenApp?: (appPath: string) => void;
  onAddFolder?: (path: string[], folderName: string, icon: string) => void;
  onNavigate?: (path: string[]) => void; // Chemin complet
}

// Fonction utilitaire pour obtenir l'icône à afficher
function getDisplayIcon(item: AppGridItem, browserIconUrl: string): string {
  if (item.icon) return item.icon; // favicon custom ou base64 récupéré
  if (item.type === "web") {
    // Fallback : favicon Google (si URL), sinon favicon navigateur
    if (item.url) {
      try {
        const { hostname } = new URL(item.url);
        return `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
      } catch {
        return browserIconUrl;
      }
    }
    return browserIconUrl;
  }
  // ...autres types (file/app/folder) traités ailleurs
  return "";
}

// SortableItem for dnd-kit
interface SortableItemProps {
  item: AppGridItem;
  index: number;
  selectedFiles: { name: string; path: string; icon: string; type: string }[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<any[]>>;
  handleOpen: (item: AppGridItem) => void;
  showMenu: (x: number, y: number, options: any[]) => void;
  openRenameModal: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function SortableItem({
  item,
  index,
  selectedFiles,
  setSelectedFiles,
  handleOpen,
  showMenu,
  openRenameModal,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { item } }); // Ajout de data: { item }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`aspect-square w-full max-w-[90px] min-w-[60px] gap-[10px] flex flex-col items-center justify-center rounded-xl p-[4px] cursor-pointer transition ${
        isDragging ? "ring-2 ring-[#FFDE59]" : ""
      } ${
        selectedFiles.some((f: any) => f.name === item.name)
          ? "bg-[#4a90e2] border-2 border-[#FFDE59] shadow-lg"
          : "bg-[#030121] hover:bg-[#2a2250]"
      }
      `}
      title={item.title || item.name}
      onDoubleClick={() => handleOpen(item)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.ctrlKey) {
          const isSelected = selectedFiles.some(
            (f: any) => f.name === item.name
          );
          if (isSelected) {
            setSelectedFiles((prev) =>
              prev.filter((f: any) => f.name !== item.name)
            );
          } else {
            setSelectedFiles((prev) => [
              ...prev,
              {
                name: item.name,
                path: item.filePath || item.appPath || item.url || "",
                icon: item.icon || "📄",
                type: item.type,
              },
            ]);
          }
        } else {
          setSelectedFiles([
            {
              name: item.name,
              path: item.filePath || item.appPath || item.url || "",
              icon: item.icon || "📄",
              type: item.type,
            },
          ]);
          handleOpen(item);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showMenu(e.clientX, e.clientY, [
          {
            label: "Ouvrir",
            icon:
              item.type === "folder"
                ? "📂"
                : item.type === "web"
                ? "🌐"
                : item.type === "app"
                ? "🚀"
                : "📄",
            onClick: () => handleOpen(item),
          },
          ...(item.type === "folder"
            ? []
            : [
                {
                  label:
                    item.type === "web" ? "Copier l'URL" : "Copier le chemin",
                  icon: "📋",
                  onClick: () => {
                    const textToCopy =
                      item.url || item.filePath || item.appPath || item.name;
                    navigator.clipboard.writeText(textToCopy);
                  },
                },
              ]),
          {
            label: "Copier le nom",
            icon: "📝",
            onClick: () => {
              navigator.clipboard.writeText(item.name);
            },
          },
          {
            label: "Renommer",
            icon: "✏️",
            onClick: () => {
              openRenameModal(item.id, item.name);
            },
          },
          {
            label: "Supprimer",
            icon: "🗑️",
            danger: true,
            onClick: () => {
              const itemType =
                item.type === "folder"
                  ? "dossier"
                  : item.type === "web"
                  ? "lien"
                  : item.type === "app"
                  ? "application"
                  : "fichier";
              if (window.confirm(`Supprimer ce ${itemType} "${item.name}" ?`)) {
                onDelete(item.id);
              }
            },
          },
        ]);
      }}
    >
      {/* Aperçu image/vidéo si applicable */}
      {(() => {
        // 1️⃣ Aperçu fichiers locaux
        const ext = item.filePath?.split(".").pop()?.toLowerCase() || "";
        const commonImageClasses =
          "mb-[6px] object-contain mx-auto w-[40px] h-[40px] user-select-none rounded";
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) {
          return (
            <img
              className={commonImageClasses}
              src={`file://${item.filePath}`}
              alt={item.name}
              draggable={false}
            />
          );
        }
        if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)) {
          return (
            <video
              className={commonImageClasses}
              src={`file://${item.filePath}`}
              muted
            />
          );
        }
        const displayIcon = item.icon;
        if (displayIcon && displayIcon.startsWith("data:image/")) {
          return (
            <img
              src={displayIcon}
              alt={item.name}
              className="mb-[6px] object-contain mx-auto w-[40px] h-[40px] user-select-none"
              draggable={false}
            />
          );
        }
        if (displayIcon && displayIcon.startsWith("https://")) {
          return (
            <img
              src={displayIcon}
              alt={item.name}
              className="mb-[6px] object-contain mx-auto w-[40px] h-[40px] user-select-none"
              draggable={false}
            />
          );
        }
        if (displayIcon) {
          return (
            <span className="mb-[6px] text-[32px] select-none">
              {displayIcon}
            </span>
          );
        }
        return <span className="mb-[6px] text-[32px] select-none">📄</span>;
      })()}
      <span className="text-base text-center text-[12px] line-clamp-2 overflow-hidden w-full break-words">
        {item.name}
      </span>
    </div>
  );
}

const AppGrid: React.FC<AppGridProps> = ({
  items,
  displayType,
  currentPath,
  onDragEnd,
  onRename,
  onDelete,
  onAdd,
  onOpenApp,
  onAddFolder,
  onNavigate,
}) => {
  const [renameModal, setRenameModal] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });
  const [renameValue, setRenameValue] = useState("");
  const browserIconUrl = "/static/icons/chrome.png";
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [folderModal, setFolderModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<
    Array<{
      name: string;
      path: string;
      icon: string;
      type: string;
    }>
  >([]); // type is always string
  const appGridRef = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const openRenameModal = (id: string, currentName: string) => {
    setIsRenaming(true);
    setRenameValue(currentName);
    setRenameModal({ open: true, id });
  };

  const closeRenameModal = () => {
    setIsRenaming(false);
    setRenameModal({ open: false, id: null });
  };

  const { showMenu } = useContextMenu();

  // Fonction pour sélectionner tous les fichiers d'un dossier
  const selectAllFilesInFolder = () => {
    // ✅ Au lieu de chercher sur le disque, utiliser les données affichées
    const allVisibleItems = items.map((item) => ({
      name: item.name,
      path: item.filePath || item.appPath || item.url || "",
      icon: item.icon || "📄",
      type: item.type,
    }));

    setSelectedFiles(allVisibleItems);
    console.log(
      `🎉 ${allVisibleItems.length} éléments sélectionnés depuis les données en mémoire`
    );
  };

  // AJOUTER après les imports, dans le composant AppGrid :
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const appGridElement = appGridRef.current;
      const activeElement = document.activeElement;

      if (
        appGridElement &&
        (appGridElement.contains(activeElement) ||
          activeElement === document.body)
      ) {
        if (e.ctrlKey && e.key === "a") {
          e.preventDefault();
          console.log("🎯 Ctrl+A détecté !");
          selectAllFilesInFolder();
        }

        // 📋 Ctrl+C : Copier la sélection
        else if (e.ctrlKey && e.key === "c" && selectedFiles.length > 0) {
          e.preventDefault();
          const textToCopy = selectedFiles
            .map((f) => f.path || f.name)
            .join("\n");
          navigator.clipboard.writeText(textToCopy);
          console.log(
            `📋 ${selectedFiles.length} éléments copiés:`,
            textToCopy
          );
        }

        // ✂️ Ctrl+X : Couper la sélection
        else if (e.ctrlKey && e.key === "x" && selectedFiles.length > 0) {
          e.preventDefault();
          const textToCopy = selectedFiles
            .map((f) => f.path || f.name)
            .join("\n");
          navigator.clipboard.writeText(textToCopy);
          console.log(
            `✂️ ${selectedFiles.length} éléments coupés:`,
            textToCopy
          );
          // Marquer comme "coupés" visuellement (optionnel)
          // setIsCutMode(true);
        }

        // 📁 Ctrl+V : Coller (déjà géré par onPaste, mais on peut le dupliquer ici)
        else if (e.ctrlKey && e.key === "v") {
          e.preventDefault();
          navigator.clipboard.readText().then((text) => {
            if (text && text.trim().length > 0 && onAdd) {
              console.log("📁 Ctrl+V détecté, collage:", text);
              enrichAndAddItem({
                id: `${Date.now()}-${Math.random()}`,
                name: text.trim(),
                url: text.trim(),
                type: "web",
                icon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                  text.trim()
                )}`,
              });
            }
          });
        }

        // 🗑️ Suppr : Supprimer la sélection
        else if (e.key === "Delete" && selectedFiles.length > 0) {
          e.preventDefault();
          const firstSelected = selectedFiles[0];
          const matchingItem = items.find(
            (item) => item.name === firstSelected.name
          );

          if (
            matchingItem &&
            window.confirm(
              `Supprimer ${selectedFiles.length} élément(s) sélectionné(s) ?`
            )
          ) {
            onDelete(matchingItem.id);
            setSelectedFiles([]); // Vider la sélection
          }
        }

        // 🔄 Échap : Désélectionner tout
        else if (e.key === "Escape") {
          e.preventDefault();
          setSelectedFiles([]);
          console.log("❌ Sélection effacée");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPath, selectedFiles, items, enrichAndAddItem, onDelete]);

  // Fonction pour obtenir les items dans la zone de sélection
  const getItemsInSelectionBox = async (box: {
    left: number;
    top: number;
    width: number;
    height: number;
  }) => {
    console.log("🎯 Sélection par rectangle (AppGrid):", box);

    if (window.electronAPI?.getItemsInSelectionBox) {
      try {
        const selectedItems = await window.electronAPI.getItemsInSelectionBox(
          box,
          items
        );

        console.log(`🎉 ${selectedItems.length} éléments reçus d'Electron`);
        return selectedItems;
      } catch (error) {
        console.error("❌ Erreur appel Electron:", error);
        return [];
      }
    } else {
      console.warn("electronAPI.getItemsInSelectionBox non disponible");
      return [];
    }
  };

  // 👉 Fonction d'ajout universelle, qui appelle les helpers preload AVANT d'appeler onAdd
  async function enrichAndAddItem(item: Partial<AppGridItem>) {
    // ✅ LOGIQUE SIMPLE : Utiliser seulement l'icône fournie ou récupérée
    let icon = item.icon;

    // Si pas d'icône fournie, essayer de la récupérer SEULEMENT pour les nouveaux items
    if (!icon) {
      // Pour les fichiers/apps locaux, récupérer l'icône système
      if (item.filePath && window.electronAPI?.getFileIcon) {
        try {
          icon = await window.electronAPI.getFileIcon(item.filePath);
        } catch (error) {
          console.warn("Impossible de récupérer l'icône:", error);
        }
      } else if (item.appPath && window.electronAPI?.getFileIcon) {
        try {
          icon = await window.electronAPI.getFileIcon(item.appPath);
        } catch (error) {
          console.warn("Impossible de récupérer l'icône:", error);
        }
      } else if (item.url && item.type === "web") {
        // Pour les URLs web, utiliser Google favicons
        try {
          const { hostname } = new URL(item.url);
          icon = `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
        } catch (error) {
          console.warn("URL invalide:", error);
        }
      }
    }

    // Nom de l'item
    let name = item.name;
    if (!name) {
      if (
        item.type === "app" &&
        item.appPath &&
        window.electronAPI?.getAppNameFromPath
      ) {
        try {
          name = await window.electronAPI.getAppNameFromPath(item.appPath);
        } catch (error) {
          console.warn("Impossible de récupérer le nom:", error);
        }
      } else if (
        item.type === "web" &&
        item.url &&
        window.electronAPI?.getShortNameFromUrl
      ) {
        try {
          name = await window.electronAPI.getShortNameFromUrl(item.url);
        } catch (error) {
          console.warn("Impossible de récupérer le nom:", error);
        }
      } else if (
        item.type === "file" &&
        item.filePath &&
        window.electronAPI?.getFileNameFromPath
      ) {
        try {
          name = await window.electronAPI.getFileNameFromPath(item.filePath);
        } catch (error) {
          console.warn("Impossible de récupérer le nom:", error);
        }
      }
    }

    // ✅ AJOUTER L'ITEM AVEC L'ICÔNE EXACTE (pas de modification)
    onAdd?.({
      ...item,
      id: item.id || `${Date.now()}-${Math.random()}`,
      name: name || item.name || "Nouvel item",
      icon: icon || "", // Utiliser exactement l'icône fournie/récupérée
      type:
        item.type ||
        (item.url
          ? "web"
          : item.appPath
          ? "app"
          : item.filePath
          ? "file"
          : "file"),
    });
  }

  async function openFile(filePath: string) {
    if (!filePath) return;
    try {
      await window.electronAPI.openFile(filePath);
    } catch (e) {
      alert("Erreur lors de l'ouverture du fichier : " + e);
    }
  }
  // Drag & drop natif pour fichiers/URL (asynchrone)
  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();

    // Gestion des URLs (drag & drop web) - DOIT être en premier
    const url = e.dataTransfer.getData("text/uri-list");
    if (url && url.trim().length > 0) {
      await enrichAndAddItem({
        url: url.trim(),
        type: "web",
      });
      return;
    }

    const text = e.dataTransfer.getData("text/plain");
    if (text && text.trim().length > 0 && /^https?:\/\//i.test(text.trim())) {
      await enrichAndAddItem({
        url: text.trim(),
        type: "web",
      });
      return;
    }

    // Gestion des fichiers - DÉSACTIVÉ (problème de chemin)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log(
        `[DRAG] ${e.dataTransfer.files.length} fichier(s) détecté(s)`
      );

      // Compter les fichiers détectés
      const fileNames = Array.from(e.dataTransfer.files).map(
        (file) => file.name
      );

      console.log(`[DRAG] Fichiers détectés:`, fileNames);

      // Message informatif unique pour tous les fichiers
      const fileList =
        fileNames.length > 3
          ? `${fileNames.slice(0, 3).join(", ")} et ${
              fileNames.length - 3
            } autre(s)`
          : fileNames.join(", ");

      alert(`📁 Drag & Drop détecté !

Fichier(s): ${fileList}

❌ Le drag & drop de fichiers n'est pas supporté actuellement car Electron ne fournit pas les chemins complets.

✅ Solution: Utilisez le menu contextuel (clic droit) :
• "Ajouter un fichier" pour les fichiers
• "Importer un dossier" pour les dossiers
• "Ajouter une application" pour les .exe

🌐 Le drag & drop fonctionne parfaitement pour les URLs web !`);

      return; // On arrête ici pour les fichiers
    }

    // Gestion des fichiers - VERSION AVEC FICHIER
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (const file of e.dataTransfer.files) {
        // Vérifie si le fichier a un chemin valide
        if ((file as ElectronFile).path) {
          console.log(
            "[DRAG] Fichier détecté:",
            file.name,
            (file as ElectronFile).path
          );
          await enrichAndAddItem({
            name: file.name,
            filePath: (file as ElectronFile).path,
            icon: (file as ElectronFile).path, // Utilise le chemin comme icône par défaut
            type: "file",
          });
        } else {
          console.warn("[DRAG] Fichier sans chemin valide:", file.name);
        }
      }
    }
  }

  // Fonction pour rendre un aperçu d'un item (image, vidéo, audio)
  function renderPreview(item: AppGridItem) {
    if (!item.filePath) return null;

    const ext = item.filePath.split(".").pop()?.toLowerCase() || "";
    const commonImageClasses =
      "mb-[6px] object-contain mx-auto w-[40px] h-[40px] user-select-none rounded";

    if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) {
      return (
        <img
          className={commonImageClasses}
          src={`file://${item.filePath}`}
          alt={item.name}
          draggable={false}
          onError={() =>
            console.log(`[ERROR] Aperçu image impossible: ${item.name}`)
          }
        />
      );
    }

    if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)) {
      return (
        <video
          className={commonImageClasses}
          src={`file://${item.filePath}`}
          muted
          onError={() =>
            console.log(`[ERROR] Aperçu vidéo impossible: ${item.name}`)
          }
        />
      );
    }

    // Pas d'aperçu possible, retourner null pour utiliser l'icône normale
    return null;
  }

  // Dans le menu contextuel ou comme bouton séparé
  const handleCreateFolder = async () => {
    try {
      if (window.electronAPI?.create) {
        // ✅ Utiliser l'API Electron pour créer le dossier
        const folderName = `Nouveau dossier ${Date.now()}`;

        // Créer le dossier physique sur le disque
        const basePath =
          currentPath.length > 0 ? `/${currentPath.join("/")}` : "/"; // Chemin relatif dans la structure

        await window.electronAPI.create("folder", basePath, folderName);

        // Puis l'ajouter à la structure de l'app
        if (onAddFolder) {
          setFolderModal(true);
        }

        console.log(`✅ Dossier "${folderName}" créé via electronAPI`);
      } else {
        console.warn("electronAPI.create non disponible");
        // Fallback : créer seulement dans la structure de l'app
        if (onAddFolder) {
          const folderName = `Nouveau dossier ${Date.now()}`;
          setFolderModal(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création du dossier:", error);
    }
  };

  // Fonction pour confirmer la création du dossier
  const confirmCreateFolder = (folderName: string, icon: string) => {
    if (onAddFolder) {
      onAddFolder(currentPath, folderName, icon);
    }
    setFolderModal(false);
  };

  // Gestion du renommage
  function handleOpen(item: AppGridItem) {
    console.log("[AppGrid] handleOpen", item, currentPath);

    if (item.type === "folder" && onNavigate) {
      // ✅ Navigation vers le dossier - structure native de l'app
      console.log("[AppGrid] Navigating to folder:", [
        ...currentPath,
        item.name,
      ]);
      onNavigate([...currentPath, item.name]);
    } else if (item.type === "web" && item.url) {
      // ✅ Ouvrir URL web
      if (window.electronAPI?.openExternal) {
        console.log("[AppGrid] Opening URL:", item.url);
        window.electronAPI.openExternal(item.url);
      } else {
        console.warn("Electron API indisponible pour openExternal");
        // Fallback : ouvrir dans le navigateur du système
        window.open(item.url, "_blank");
      }
    } else if (item.type === "file" && item.filePath) {
      // ✅ Ouvrir fichier local
      if (window.electronAPI?.openFile) {
        console.log("[AppGrid] Opening file:", item.filePath);
        window.electronAPI.openFile(item.filePath);
      } else {
        console.warn("Electron API indisponible pour openFile");
        alert("Impossible d'ouvrir le fichier : API Electron indisponible");
      }
    } else if (item.type === "app" && item.appPath) {
      // ✅ Lancer application
      if (window.electronAPI?.openFile) {
        console.log("[AppGrid] Launching app:", item.appPath);
        window.electronAPI.openFile(item.appPath);
      } else if (onOpenApp) {
        console.log("[AppGrid] Using onOpenApp fallback:", item.appPath);
        onOpenApp(item.appPath);
      } else {
        console.warn("Aucune méthode disponible pour lancer l'application");
        alert("Impossible de lancer l'application");
      }
    } else {
      // ✅ Fallback : copier le nom dans le presse-papiers
      console.log("[AppGrid] Fallback: copying name to clipboard:", item.name);
      navigator.clipboard
        .writeText(item.name)
        .then(() => {
          console.log("Nom copié dans le presse-papiers");
        })
        .catch((err) => {
          console.warn("Erreur lors de la copie:", err);
        });
    }
  }

  // dnd-kit sensors (must be declared here for JSX usage)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // DnD Kit drag end handler (must be declared here for JSX usage)
  function handleDndKitDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    // Pour drop externe (Sidebar), transmettre l'item complet si possible
    if (over.data?.current?.type === "folder" && active.data?.current?.item) {
      // Ici, on pourrait appeler une prop onDropToFolder si elle existait
      // (la logique est déjà gérée dans App via Sidebar)
      // Ex: onDropToFolder(active.data.current.item, over.id)
      // Mais ici, on ne fait rien, car la logique est dans Sidebar/App
      return;
    }

    // Sinon, réorganisation classique
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      onDragEnd(newItems);
    }
  }
  // Pour permettre le drop natif de fichiers sur toute la grille,
  // on place onDrop/onDragOver sur un conteneur parent, PAS sur le Droppable de DnD
  return (
    <div
      ref={appGridRef}
      className={`flex flex-col flex-1 w-full text-[#ffffff] text-lg ${
        resolvedTheme === "dark" ? "app-grid-dark" : "app-grid-light"
      }`}
      tabIndex={0}
      onPaste={(e) => {
        if (isRenaming) {
          e.preventDefault();
          e.stopPropagation();
          return; // ✅ Bloquer le collage pendant le renommage
        }

        const text = e.clipboardData.getData("text");
        if (text && text.trim().length > 0 && onAdd) {
          enrichAndAddItem({
            id: `${Date.now()}-${Math.random()}`,
            name: text.trim(),
            url: text.trim(),
            type: "web",
            icon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
              text.trim()
            )}`,
          });
        }
      }}
    >
      <div
        className="flex-1 flex flex-col min-h-0"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={(e) => {
          // Si clic dans la zone vide (pas sur un item), désélectionner
          if (e.target === e.currentTarget) {
            setSelectedFiles([]);
          }
        }}
        onContextMenu={(e) => {
          // Vérifie que le clic n’était pas sur la barre de recherche
          if (
            e.target instanceof HTMLElement &&
            e.target.tagName.toLowerCase() === "input"
          ) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          showMenu(e.clientX, e.clientY, [
            {
              label: "Créer un dossier",
              icon: "📁",
              onClick: () => handleCreateFolder(),
            },
            {
              label: "Importer un dossier",
              icon: "📂",
              onClick: () => {
                if (window.electronAPI?.selectFolder) {
                  window.electronAPI.selectFolder().then((folderInfo) => {
                    if (folderInfo && onAdd) {
                      enrichAndAddItem({
                        id: `${Date.now()}-${Math.random()}`,
                        name: folderInfo.name,
                        filePath: folderInfo.path,
                        icon: folderInfo.icon,
                        type: "folder",
                      });
                    }
                  });
                }
              },
            },
            {
              label: "Ajouter un fichier",
              icon: "📄",
              onClick: () => {
                if (window.electronAPI?.selectFile) {
                  window.electronAPI
                    .selectFile({
                      properties: ["openFile"],
                      filters: [
                        {
                          name: "Tous les fichiers",
                          extensions: ["*"],
                        },
                      ],
                    })
                    .then((fileInfo) => {
                      if (fileInfo && onAdd) {
                        enrichAndAddItem({
                          id: `${Date.now()}-${Math.random()}`,
                          name: fileInfo.name,
                          filePath: fileInfo.path,
                          icon: fileInfo.icon,
                          type: "file",
                        });
                      }
                    });
                }
              },
            },
            {
              label: "Ajouter une application",
              icon: "🖥️",
              onClick: () => {
                if (window.electronAPI?.selectApp) {
                  window.electronAPI.selectApp().then((appInfo) => {
                    if (appInfo && onAdd) {
                      enrichAndAddItem({
                        id: `${Date.now()}-${Math.random()}`,
                        name: appInfo.name,
                        appPath: appInfo.path,
                        icon: appInfo.icon,
                        type: "app",
                      });
                    }
                  });
                }
              },
            },
            {
              label: "Ajouter un lien web",
              icon: "🌐",
              onClick: () => {
                if (window.electronAPI?.selectFile) {
                  window.electronAPI
                    .selectFile({
                      properties: ["openFile"],
                      filters: [{ name: "Web Links", extensions: ["url"] }],
                    })
                    .then((fileInfo) => {
                      if (fileInfo && onAdd) {
                        enrichAndAddItem({
                          id: `${Date.now()}-${Math.random()}`,
                          name: fileInfo.name,
                          url: fileInfo.path,
                          icon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                            fileInfo.path
                          )}`,
                          type: "web",
                        });
                      }
                    });
                }
              },
            },
            {
              label: "Sélectionner tout (Ctrl+A)",
              icon: "📋",
              onClick: () => {
                selectAllFilesInFolder();
              },
            },
            ...(selectedFiles.length > 0
              ? [
                  {
                    label: `Copier (${selectedFiles.length} sélectionné${
                      selectedFiles.length > 1 ? "s" : ""
                    })`,
                    icon: "📋",
                    onClick: () => {
                      const textToCopy = selectedFiles
                        .map((f) => f.path || f.name)
                        .join("\n");
                      navigator.clipboard.writeText(textToCopy);
                      console.log(`📋 ${selectedFiles.length} éléments copiés`);
                    },
                  },
                  {
                    label: `Supprimer (${selectedFiles.length} sélectionné${
                      selectedFiles.length > 1 ? "s" : ""
                    })`,
                    icon: "🗑️",
                    danger: true,
                    onClick: () => {
                      if (
                        window.confirm(
                          `Supprimer ${selectedFiles.length} élément(s) sélectionné(s) ?`
                        )
                      ) {
                        selectedFiles.forEach((selected) => {
                          const matchingItem = items.find(
                            (item) => item.name === selected.name
                          );
                          if (matchingItem) onDelete(matchingItem.id);
                        });
                        setSelectedFiles([]);
                      }
                    },
                  },
                ]
              : []),

            // ...autres actions globales
          ]);
        }}
      >
        <div className="flex-1 flex justify-center items-start min-h-[0px] m-[10px] overflow-y-auto scrollbar-hide">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDndKitDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-[18px] rounded-2xl shadow-lg w-full justify-start">
                {items && items.length > 0 ? (
                  items.map((item, i) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={i}
                      selectedFiles={selectedFiles}
                      setSelectedFiles={setSelectedFiles}
                      handleOpen={handleOpen}
                      showMenu={showMenu}
                      openRenameModal={openRenameModal}
                      onDelete={onDelete}
                    />
                  ))
                ) : (
                  <div className="col-span-8 text-center text-[#aaa] py-[8px]">
                    Aucune application ou fichier à afficher.
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
          {/* Modal pour renommage */}
          <InputModal
            open={renameModal.open}
            title="Renommer"
            placeholder="Nouveau nom"
            initialValue={renameValue}
            onConfirm={(value) => {
              if (renameModal.id !== null) onRename(renameModal.id, value);
              closeRenameModal();
            }}
            onCancel={closeRenameModal}
          />
          <FolderModal
            open={folderModal}
            onConfirm={confirmCreateFolder}
            onCancel={() => setFolderModal(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default AppGrid;
