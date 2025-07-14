import React, { useState } from "react";
import "../../index.css";
import { AppGridItem } from "../../types/AppGridItem";
import { useContextMenu } from "../ContextMenu/ContextMenuContext";

interface SidebarProps {
  categories: AppGridItem[];
  currentPath: string[];
  className?: string;
  onNavigate: (path: string[]) => void;
  onAddFolder: (path: string[]) => void;
  onRenameFolder: (path: string[]) => void; // ✅ SUPPRIMER le paramètre newName
  onDeleteFolder: (path: string[]) => void;
  onModifyFolderIcon: (path: string[], icon: string) => void;
  onModifyFolderPath: (oldPath: string[], newPath: string[]) => void;
}

const SidebarTree: React.FC<{
  nodes: AppGridItem[];
  parentPath?: string[];
  openPaths: string[][];
  onToggle: (path: string[]) => void;
  onNavigate: (path: string[]) => void;
  level?: number;
  expanded?: boolean;
  onAddFolder: (path: string[]) => void;
  onRenameFolder: (path: string[]) => void;
  onDeleteFolder: (path: string[]) => void;
  onModifyFolderIcon: (path: string[], icon: string) => void;
}> = ({
  nodes,
  parentPath = [],
  openPaths,
  onToggle,
  onNavigate,
  level = 0,
  expanded = false,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onModifyFolderIcon,
}) => {
  const { showMenu } = useContextMenu(); // ✅ AJOUTER

  return (
    <>
      {/* Affichage des noeuds */}
      {nodes.map((node) => {
        const path = [...parentPath, node.name];

        const isOpen = openPaths.some(
          (p) => p.length === path.length && p.every((v, i) => v === path[i])
        );
        const hasChildren =
          (node.children && node.children.length > 0) ||
          (node.items && node.items.length > 0);
        return (
          <div
            key={path.join("/")}
            className={`pl-[${level * 16}px]
            }`}
          >
            <div
              className={
                "flex items-center px-[5px] py-[3px] cursor-pointer" +
                (expanded ? " hover:bg-[#181633]" : " pointer-events-none")
              }
              onClick={
                expanded
                  ? () => {
                      if (node.type === "folder") {
                        // ✅ TOUJOURS naviguer vers le dossier
                        onNavigate(path);

                        // ✅ ET gérer l'ouverture/fermeture de l'arborescence
                        if (hasChildren) {
                          onToggle(path);
                        }
                      }
                      // Pour les fichiers/apps/liens : ne rien faire dans le sidebar
                    }
                  : undefined
              }
              onContextMenu={
                expanded && node.type === "folder"
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      showMenu(e.clientX, e.clientY, [
                        {
                          label: "Créer un sous-dossier",
                          icon: "📁",
                          onClick: () => onAddFolder(path),
                        },
                        {
                          label: "Renommer",
                          icon: "✏️",
                          onClick: () => onRenameFolder(path),
                        },
                        {
                          label: "Modifier l'icône",
                          icon: "🎨",
                          onClick: () => {
                            const newIcon = prompt("Nouvelle icône (emoji) :");
                            if (newIcon && newIcon.trim()) {
                              onModifyFolderIcon(path, newIcon.trim());
                            }
                          },
                        },
                        {
                          label: "Supprimer",
                          icon: "🗑️",
                          danger: true,
                          onClick: () => {
                            if (
                              window.confirm(
                                `Supprimer le dossier "${node.name}" ?`
                              )
                            ) {
                              onDeleteFolder(path);
                            }
                          },
                        },
                      ]);
                    }
                  : undefined
              }
            >
              <span className="text-2xl text-[#ffffff]">
                {node.type === "folder"
                  ? node.icon
                  : node.type === "web"
                  ? "🌐"
                  : node.type === "app"
                  ? "🖥️"
                  : node.type === "file"
                  ? "📄"
                  : "📄"}
              </span>
              {hasChildren && expanded && (
                <span className="ml-[12px] text-xs select-none text-[#aaa]">
                  {isOpen ? "▾" : "▸"}
                </span>
              )}
              <span
                className={
                  "text-base text-[#ffffff] font-semibold transition-opacity whitespace-nowrap pl-[12px]" +
                  (expanded ? " opacity-100" : " opacity-0")
                }
              >
                {node.name}
              </span>
            </div>
            {hasChildren && isOpen && (
              <SidebarTree
                nodes={[...(node.children || [])]} // ✅ ENLEVER le filtre, garder tous les items ", ...(node.items || [])"
                parentPath={path}
                openPaths={openPaths}
                onToggle={onToggle}
                onNavigate={onNavigate}
                level={level + 1}
                expanded={expanded}
                onAddFolder={onAddFolder}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                onModifyFolderIcon={onModifyFolderIcon}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  onNavigate,
  onAddFolder, // ✅ AJOUTER
  onRenameFolder, // ✅ AJOUTER
  onDeleteFolder, // ✅ AJOUTER
  onModifyFolderIcon, // ✅ AJOUTER
  onModifyFolderPath, // ✅ AJOUTER
}) => {
  const [openPaths, setOpenPaths] = useState<string[][]>([]);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleToggle = (path: string[]) => {
    setOpenPaths((prev) =>
      prev.some(
        (p) => p.length === path.length && p.every((v, i) => v === path[i])
      )
        ? prev.filter(
            (p) =>
              !(p.length === path.length && p.every((v, i) => v === path[i]))
          )
        : [...prev, path]
    );
  };

  // Ouvre le sidebar au clic sur la zone 36px
  const handleOpenSidebar = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setExpanded(true);
  };

  // Ferme le sidebar 2s après avoir quitté la zone élargie
  const handleSidebarMouseLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setExpanded(false);
    }, 2000); // 2 secondes
  };

  // Si la souris revient dans le sidebar, annule la fermeture
  const handleSidebarMouseEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  return (
    <div className="relative h-full">
      {/* Zone de détection clic (36px) */}
      <div
        className="absolute left-0 top-0 w-[36px] h-full z-10 cursor-pointer"
        onClick={handleOpenSidebar}
      />
      <aside
        className={
          "sidebar-maxh bg-[#030121] flex flex-col transition-all duration-200 border-r-1 border-[#FFDE59] gap-[4px] pt-[4px] overflow-y-auto scrollbar-hide" +
          (expanded ? " w-[300px] min-w-[300px]" : " w-[36px] min-w-[36px]")
        }
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
        }}
      >
        <SidebarTree
          nodes={categories}
          openPaths={openPaths}
          onToggle={handleToggle}
          onNavigate={onNavigate}
          expanded={expanded}
          onAddFolder={onAddFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onModifyFolderIcon={onModifyFolderIcon}
        />
      </aside>
    </div>
  );
};

export default Sidebar;
