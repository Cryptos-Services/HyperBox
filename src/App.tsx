import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import React, { useEffect, useState } from "react";
import icon from "../src/assets/icons/icon.svg";
import "../src/types/electron.api.d.ts";
import { CATEGORIES } from "./categories-data";
import AppGrid from "./components/AppGrid/AppGrid";
import ContextMenu from "./components/ContextMenu/ContextMenu";
import { ContextMenuProvider } from "./components/ContextMenu/ContextMenuContext";
import Footer from "./components/Footer/Footer";
import InstallModeDialog from "./components/InstallModeDialog/InstallModeDialog";
import SettingsModal from "./components/SettingsModal/SettingsModal";
import Sidebar from "./components/Sidebar/Sidebar";
import { useTheme } from "./contexts/ThemeContext";
import { AppGridItem } from "./types/AppGridItem";

// Fonction pour ajouter des IDs aux noeuds et items récursivement
function addIdsRecursively(node: any): void {
  if (Array.isArray(node)) {
    node.forEach(addIdsRecursively);
    return;
  }
  if (!node || typeof node !== "object") return;
  if (!node.id)
    node.id = `${node.name || "node"}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  if (Array.isArray(node.items)) {
    node.items.forEach((item: any) => {
      if (!item.id)
        item.id = `${item.name || "item"}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;
    });
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(addIdsRecursively);
  }
}

// Fonction pour ajouter des IDs à tous les noeuds d'un tableau
function addIdsToNodes(nodes: any[]): any[] {
  const processedNodes = JSON.parse(JSON.stringify(nodes));
  addIdsRecursively(processedNodes);
  return processedNodes;
}

// Trouve le noeud courant dans l'arbre selon le chemin
function findNode(categories: any[], path: string[]): any {
  let node = categories.find((cat: any) => cat.name === path[0]);
  for (let i = 1; i < path.length; i++) {
    if (!node) return undefined;
    // ✅ Chercher dans children ET items
    const allNodes = [...(node.children || []), ...(node.items || [])];
    node = allNodes.find((child: any) => child.name === path[i]);
  }
  return node;
}

// Récupère tous les items de manière récursive à partir d'un noeud
function getAllItemsRecursively(node: any): any[] {
  let items: any[] = [];
  if (node.items) items = items.concat(node.items);
  if (node.children) {
    node.children.forEach((child: any) => {
      items = items.concat(getAllItemsRecursively(child));
    });
  }
  return items;
}

type DisplayType = "children" | "items";

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Développement");
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [displayedItems, setDisplayedItems] = useState<AppGridItem[]>([]);
  const [displayType, setDisplayType] = useState<DisplayType>("children");
  const [categories, setCategories] = useState<AppGridItem[]>([]);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showGoogleCodeModal, setShowGoogleCodeModal] = useState(false);
  const [showOneDriveCodeModal, setShowOneDriveCodeModal] = useState(false);
  const [showDropboxCodeModal, setShowDropboxCodeModal] = useState(false);
  const [showStorjModal, setShowStorjModal] = useState(false);
  const [storjAccessKey, setStorjAccessKey] = useState("");
  const [storjSecretKey, setStorjSecretKey] = useState("");
  const [storjBucket, setStorjBucket] = useState("");
  const [showStorachaCodeModal, setShowStorachaCodeModal] = useState(false);
  const [arweaveAccessKey, setArweaveAccessKey] = useState("");
  const [storachaSecretKey, setStorachaSecretKey] = useState("");
  const [pendingPath, setPendingPath] = useState<string[]>([]);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatus, setInstallStatus] = useState("");
  const [search, setSearch] = useState("");
  const [pendingAppItem, setPendingAppItem] =
    useState<Partial<AppGridItem> | null>(null);
  const { resolvedTheme } = useTheme();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fonction pour récupérer le chemin physique d'une catégorie
  const getCategoryPhysicalPath = (categoryPath: string[]): string => {
    const hyperboxRoot = window.electronAPI?.getAppPath?.() || "C:\\HyperBox";
    const appsPath =
      window.electronAPI?.joinPath?.(hyperboxRoot, "Apps") ||
      "C:\\HyperBox\\Apps";

    // Mapping des IDs de catégories vers les noms de dossiers physiques
    const categoryMapping: { [key: string]: string } = {
      dev: "Développement",
      crypto: "Crypto",
      bureautique: "Bureautique",
      gaming: "Gaming",
      media: "Media",
      personnalise: "Personnalisé",
    };

    // ✅ NOUVEAU : Trouver la catégorie racine depuis selectedCategory au lieu de selectedPath
    console.log("=== MAPPING PHYSIQUE ===");
    console.log("selectedCategory:", selectedCategory);
    console.log("selectedPath:", categoryPath);

    // ✅ Utiliser selectedCategory pour trouver la catégorie racine
    const rootCategoryNode = categories.find(
      (cat) => cat.name === selectedCategory
    );

    if (rootCategoryNode && rootCategoryNode.id) {
      const physicalFolderName = categoryMapping[rootCategoryNode.id];
      console.log("Root category ID:", rootCategoryNode.id);
      console.log("Physical folder name:", physicalFolderName);

      if (physicalFolderName) {
        const finalPath =
          window.electronAPI?.joinPath?.(appsPath, physicalFolderName) ||
          appsPath;
        console.log("Final physical path:", finalPath);
        return finalPath;
      }
    }

    // ✅ Fallback avec warning pour debugging
    console.warn("Fallback vers dossier Apps générique");
    console.warn("selectedCategory:", selectedCategory);
    console.warn("rootCategoryNode:", rootCategoryNode);
    return appsPath;
  };

  // Trouve le noeud courant à partir de la catégorie et du chemin
  const selectedCategoryNode = categories.find(
    (cat) => cat.name === selectedCategory
  );
  const currentNode =
    selectedPath.length === 0
      ? null
      : findNode(selectedCategoryNode?.children || [], selectedPath);

  // Met à jour le titre de la fenêtre Electron
  useEffect(() => {
    const initializeHyperBox = async () => {
      console.log("=== INITIALISATION HYPERBOX ===");

      // Créer la structure automatiquement
      const result = await window.electronAPI?.createHyperBoxStructure?.();
      console.log("Structure créée:", result);

      if (result?.success && result.rootPath) {
        // ✅ Vérifier que rootPath existe
        // Configurer le chemin d'installation par défaut
        const defaultInstallPath = window.electronAPI?.joinPath?.(
          result.rootPath, // ✅ Maintenant TypeScript sait que rootPath n'est pas undefined
          "Apps"
        );

        // Sauvegarder le chemin si pas déjà configuré
        if (
          !localStorage.getItem("hyperbox-install-path") &&
          defaultInstallPath
        ) {
          localStorage.setItem("hyperbox-install-path", defaultInstallPath);
          console.log("Chemin d'installation configuré:", defaultInstallPath);
        }
      } else {
        console.warn("Échec de la création de la structure HyperBox");

        // ✅ Fallback : utiliser un chemin par défaut
        const fallbackPath = "C:\\HyperBox\\Apps";
        if (!localStorage.getItem("hyperbox-install-path")) {
          localStorage.setItem("hyperbox-install-path", fallbackPath);
          console.log("Chemin de fallback configuré:", fallbackPath);
        }
      }
    };

    initializeHyperBox();
  }, []);

  useEffect(() => {
    // Applique le thème au document entier
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.body.className =
      resolvedTheme === "dark" ? "bg-[#000000]" : "bg-[#ffffff]";
  }, [resolvedTheme]);

  // Met à jour les items affichés en fonction de la catégorie et du chemin
  useEffect(() => {
    console.log("=== UPDATE DISPLAYED ITEMS ===");
    console.log("selectedCategory:", selectedCategory);
    console.log("selectedPath:", selectedPath);
    console.log("selectedCategoryNode:", selectedCategoryNode);

    let items: AppGridItem[] = [];
    let type: DisplayType = "children";

    // 1. Récupérer le noeud courant
    let node: AppGridItem | undefined;
    if (selectedPath.length === 0) {
      node = selectedCategoryNode;
    } else if (selectedCategoryNode) {
      node = findNode(selectedCategoryNode.children || [], selectedPath);
    }

    // 2. Si recherche vide, comportement normal
    if (!search.trim()) {
      if (node) {
        if (node.children?.length) items.push(...node.children);
        if (node.items?.length) items.push(...node.items);
        type = node.children?.length ? "children" : "items";
      }
      setDisplayedItems(items);
      setDisplayType(type);
      return;
    }

    // 3. Si recherche active, récupérer tous les items récursivement
    if (node) {
      const allItems = getAllItemsDeep(node);
      // Filtrer selon le nom (ou d'autres propriétés si tu veux)
      const filtered = allItems.filter((item) =>
        item.name?.toLowerCase().includes(search.trim().toLowerCase())
      );
      setDisplayedItems(filtered);
      setDisplayType("items");
    } else {
      setDisplayedItems([]);
      setDisplayType("items");
    }
  }, [
    selectedCategory,
    selectedPath,
    selectedCategoryNode,
    currentNode,
    search,
  ]);

  // Met à jour les items affichés au chargement de l'application
  useEffect(() => {
    const loadConfiguration = async () => {
      console.log("=== CHARGEMENT CONFIGURATION ===");

      if (!window.electronAPI || !window.electronAPI.loadConfig) {
        alert(
          "L'API Electron n'est pas disponible. Lance l'app via Electron !"
        );
        return;
      }

      try {
        // 1. Essayer de charger la config utilisateur
        const savedConfig = await window.electronAPI.loadConfig();
        console.log("Config chargée:", savedConfig);

        if (
          savedConfig?.categories &&
          Array.isArray(savedConfig.categories) &&
          savedConfig.categories.length > 0
        ) {
          // ✅ UTILISER LA CONFIG UTILISATEUR (modifications sauvegardées)
          console.log("✅ Utilisation config utilisateur sauvegardée");
          const patched = JSON.parse(JSON.stringify(savedConfig.categories));
          addIdsRecursively(patched);
          setCategories(patched);
        } else {
          // ✅ PREMIÈRE INSTALLATION : Utiliser la config par défaut
          console.log(
            "🆕 Première installation - Chargement config par défaut"
          );
          const patched = JSON.parse(JSON.stringify(CATEGORIES));
          addIdsRecursively(patched);
          setCategories(patched);

          // Sauvegarder immédiatement la config par défaut
          await window.electronAPI.saveConfig({ categories: CATEGORIES });
          console.log("💾 Config par défaut sauvegardée");
          await window.electronAPI.createDefaultStructure?.(CATEGORIES);
          console.log("✅ Structure physique HyperBox créée");
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors du chargement de la configuration:",
          error
        );

        // ✅ FALLBACK : Utiliser la config par défaut en cas d'erreur
        console.log("🔄 Fallback sur la config par défaut");
        const patched = JSON.parse(JSON.stringify(CATEGORIES));
        addIdsRecursively(patched);
        setCategories(patched);
      }
    };

    loadConfiguration();
  }, []);

  // Sauvegarde la configuration à chaque changement de catégories
  useEffect(() => {
    window.electronAPI.saveConfig({ categories });
  }, [categories]);

  console.log("=== RENDER DEBUG ===");
  console.log("showInstallDialog:", showInstallDialog);
  console.log("pendingAppItem:", pendingAppItem);

  // Fonction pour obtenir tous les items récursivement
  const handleGridReorder = (newOrder: AppGridItem[]) => {
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      let node;
      if (selectedPath.length === 0) {
        node = selectedCategoryNode;
      } else {
        node = findNode(selectedCategoryNode?.children || [], selectedPath);
      }
      if (!node) return prevCategories;

      // Sépare les dossiers et les items selon leur type
      node.children = newOrder.filter((item) => item.type === "folder");
      node.items = newOrder.filter((item) => item.type !== "folder");

      return newCategories;
    });
  };

  // Fonction pour réinitialiser la configuration par défaut
  const resetToDefaultConfiguration = async () => {
    console.log("🔄 Reset vers la configuration par défaut");
    const patched = JSON.parse(JSON.stringify(CATEGORIES));
    addIdsRecursively(patched);
    setCategories(patched);
    await window.electronAPI.saveConfig({ categories: CATEGORIES });
    console.log("✅ Configuration réinitialisée");
    await window.electronAPI.createDefaultStructure?.(CATEGORIES);
    console.log("✅ Structure physique HyperBox régénérée");
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + Shift + T pour tester le modal
      if (event.ctrlKey && event.shiftKey && event.key === "T") {
        console.log("=== RACCOURCI TEST MODAL ===");
        setPendingAppItem({
          name: "Test App",
          appPath: "C:\\test.exe",
          type: "app",
        });
        setShowInstallDialog(true);
      }

      // ✅ AJOUTER : Ctrl + Shift + R pour reset la config
      if (event.ctrlKey && event.shiftKey && event.key === "R") {
        if (
          confirm(
            "Voulez-vous vraiment réinitialiser la configuration vers les valeurs par défaut ?"
          )
        ) {
          resetToDefaultConfiguration();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Fonction pour normaliser un dossier importé
  const normalizeFolderStructure = (item: AppGridItem): AppGridItem => {
    if (item.type === "folder" && item.filePath) {
      // Convertir un dossier système en dossier natif
      return {
        ...item,
        children: [], // Dossier vide au début
        items: [], // Peut contenir des items
        filePath: undefined, // Supprimer le filePath
        isDefault: false,
      };
    }
    return item;
  };

  // Fonction pour obtenir le mode d'installation
  const getInstallMode = () => {
    const saved = localStorage.getItem("hyperbox-install-mode");
    return saved === "keep" || saved === "move" || saved === "ask"
      ? saved
      : "ask";
  };

  // ✅ 1. Fonction pour traiter l'installation d'application
  const processAppInstallation = async (
    item: Partial<AppGridItem>,
    mode: "keep" | "move"
  ): Promise<Partial<AppGridItem> | null> => {
    if (!item.appPath) return item;

    try {
      const physicalPath = getCategoryPhysicalPath(selectedPath);
      console.log("=== TRAITEMENT INSTALLATION AVEC PROGRESSION ===");

      // ✅ Activer le mode installation
      setIsInstalling(true);
      setInstallProgress(0);
      setInstallStatus("Initialisation...");

      // Créer le dossier de destination
      await window.electronAPI?.createFolder?.(physicalPath);

      const appName =
        window.electronAPI?.getAppNameFromPath?.(item.appPath) || "app";
      const fileName = appName + (item.appPath.endsWith(".exe") ? ".exe" : "");
      const destinationPath = window.electronAPI?.joinPath?.(
        physicalPath,
        fileName
      );

      if (mode === "move") {
        console.log("Mode MOVE avec progression...");

        // ✅ Déplacement avec progression
        const result = await window.electronAPI?.moveAppWithProgress?.(
          item.appPath,
          destinationPath,
          (progress: number, status: string) => {
            setInstallProgress(progress);
            setInstallStatus(status);
          }
        );

        if (result?.success) {
          setInstallStatus("Déplacement réussi !");
          return {
            ...item,
            appPath: result.newPath,
            filePath: undefined,
          };
        } else {
          alert(`Erreur lors du déplacement: ${result?.error}`);
          return null;
        }
      } else if (mode === "keep") {
        setInstallStatus("Création du raccourci...");
        setInstallProgress(50);

        const shortcutPath = destinationPath + ".lnk";
        const result = await window.electronAPI?.createShortcut?.(
          item.appPath,
          shortcutPath
        );

        setInstallProgress(100);
        setInstallStatus("Raccourci créé !");

        if (result?.success) {
          return {
            ...item,
            appPath: result.shortcutPath,
            filePath: undefined,
          };
        } else {
          alert(`Erreur lors de la création du raccourci: ${result?.error}`);
          return null;
        }
      }

      return item;
    } catch (error) {
      console.error("Erreur lors du traitement de l'installation:", error);
      alert("Erreur lors du traitement de l'installation");
      return null;
    } finally {
      // ✅ Désactiver le mode installation après 2 secondes
      setTimeout(() => {
        setIsInstalling(false);
        setInstallProgress(0);
        setInstallStatus("");
      }, 2000);
    }
  };

  // ✅ 2. Fonction pour gérer le choix d'installation
  const handleInstallChoice = async (mode: "keep" | "move") => {
    if (!pendingAppItem) return;

    try {
      console.log("=== INSTALLATION APP ===");
      console.log("Mode:", mode);
      console.log("App:", pendingAppItem);
      console.log("Catégorie actuelle:", selectedCategory);
      console.log("Chemin:", selectedPath);

      // 1. ✅ Traiter l'installation (déplacer/raccourci)
      const processedItem = await processAppInstallation(pendingAppItem, mode);
      if (!processedItem) {
        console.error("Échec du traitement");
        return;
      }

      console.log("Item traité:", processedItem);

      // 2. ✅ Ajouter l'application dans la bonne catégorie
      const updatedCategories = [...categories];

      // Trouver la catégorie racine
      const rootCategoryIndex = updatedCategories.findIndex(
        (cat) => cat.name === selectedCategory
      );
      if (rootCategoryIndex === -1) {
        console.error("Catégorie racine non trouvée:", selectedCategory);
        return;
      }

      // Naviguer jusqu'au bon nœud selon selectedPath
      let targetNode = updatedCategories[rootCategoryIndex];

      // Si on est dans un sous-dossier, naviguer jusqu'au bon endroit
      for (const pathSegment of selectedPath) {
        const childNode = targetNode.children?.find(
          (child) => child.name === pathSegment
        );
        if (childNode) {
          targetNode = childNode;
        } else {
          console.error("Nœud non trouvé dans le chemin:", pathSegment);
          return;
        }
      }

      // 3. ✅ Ajouter l'application au bon endroit
      if (!targetNode.items) {
        targetNode.items = [];
      }

      const newAppItem: AppGridItem = {
        id: processedItem.id || `app_${Date.now()}`,
        name: processedItem.name || "Application",
        type: "app",
        appPath: processedItem.appPath,
        icon: processedItem.icon,
      };

      targetNode.items.push(newAppItem);

      console.log("✅ App ajoutée à la catégorie:", targetNode.name);
      console.log("✅ Nouveau chemin:", newAppItem.appPath);

      // 4. ✅ Sauvegarder la configuration mise à jour
      setCategories(updatedCategories);
      await window.electronAPI.saveConfig({ categories: updatedCategories });

      console.log("✅ Configuration sauvegardée");
      console.log("✅ Installation terminée avec succès");

      // 5. ✅ FERMER LE MODAL SEULEMENT EN CAS DE SUCCÈS
      setShowInstallDialog(false);
      setPendingAppItem(null);
    } catch (error) {
      console.error("❌ Erreur installation:", error);
      alert("Erreur lors de l'installation de l'application");

      // ✅ NE PAS FERMER LE MODAL EN CAS D'ERREUR
      // L'utilisateur peut réessayer ou annuler manuellement
    }
  };

  // ✅ 3. Fonction pour annuler l'installation
  const handleInstallCancel = () => {
    setShowInstallDialog(false);
    setPendingAppItem(null);
  };

  // Fonction pour ajouter une application/fichier/URL
  async function handleAddApp(item: Partial<AppGridItem>) {
    console.log("=== HANDLE ADD APP ===");
    console.log("Item reçu:", item);
    console.log("Item.type:", item.type);
    console.log("Item.appPath:", item.appPath);

    if (!item.name && !item.filePath && !item.appPath && !item.url) {
      console.warn("Item invalide : aucune propriété utilisable");
      return;
    }

    // ✅ 1. Vérifier le mode d'installation pour les applications
    if (item.appPath && item.appPath.endsWith(".exe")) {
      console.log("=== DÉTECTION APP ===");
      const mode = getInstallMode();
      console.log("Mode d'installation:", mode);

      if (mode === "ask") {
        console.log("Mode ASK - Affichage du modal");
        console.log("showInstallDialog before:", showInstallDialog);
        setPendingAppItem(item);
        setShowInstallDialog(true);
        console.log("showInstallDialog after setShowInstallDialog(true)");
        return;
      } else {
        console.log("Mode automatique:", mode);

        // ✅ UTILISER LA MÊME LOGIQUE que le modal
        const processedItem = await processAppInstallation(item, mode);
        if (!processedItem) return;

        // ✅ AJOUTER : Mettre à jour les catégories (COPIÉ depuis handleInstallChoice)
        const updatedCategories = [...categories];

        const rootCategoryIndex = updatedCategories.findIndex(
          (cat) => cat.name === selectedCategory
        );
        if (rootCategoryIndex === -1) {
          console.error("Catégorie racine non trouvée:", selectedCategory);
          return;
        }

        let targetNode = updatedCategories[rootCategoryIndex];

        for (const pathSegment of selectedPath) {
          const childNode = targetNode.children?.find(
            (child) => child.name === pathSegment
          );
          if (childNode) {
            targetNode = childNode;
          } else {
            console.error("Nœud non trouvé dans le chemin:", pathSegment);
            return;
          }
        }

        if (!targetNode.items) {
          targetNode.items = [];
        }

        const newAppItem: AppGridItem = {
          id: processedItem.id || `app_${Date.now()}`,
          name: processedItem.name || "Application",
          type: "app",
          appPath: processedItem.appPath, // Nouveau chemin après traitement
          icon: processedItem.icon,
        };

        targetNode.items.push(newAppItem);
        setCategories(updatedCategories);
        await window.electronAPI.saveConfig({ categories: updatedCategories });

        console.log("✅ App ajoutée automatiquement");
        return;
      }
    }

    // ✅ 2. Récupération de l'icône
    let icon = item.icon;
    if (!icon && item.filePath && window.electronAPI?.getFileIcon) {
      try {
        icon = await window.electronAPI.getFileIcon(item.filePath);
      } catch (err) {
        console.warn("Erreur lors de la récupération de l'icône fichier:", err);
      }
    }
    if (!icon && item.appPath && window.electronAPI?.getFileIcon) {
      try {
        icon = await window.electronAPI.getFileIcon(item.appPath);
      } catch (err) {
        console.warn("Erreur lors de la récupération de l'icône app:", err);
      }
    }

    // ✅ 3. Récupération du nom
    let name = item.name;
    if (!name) {
      if (
        item.type === "app" &&
        item.appPath &&
        window.electronAPI?.getAppNameFromPath
      ) {
        try {
          // ✅ CORRIGER : API synchrone (enlever await)
          name = window.electronAPI.getAppNameFromPath(item.appPath);
        } catch (err) {
          console.warn("Erreur lors de la récupération du nom d'app:", err);
        }
      } else if (
        item.type === "web" &&
        item.url &&
        window.electronAPI?.getShortNameFromUrl
      ) {
        try {
          // ✅ CORRIGER : API synchrone (enlever await)
          name = window.electronAPI.getShortNameFromUrl(item.url);
        } catch (err) {
          console.warn("Erreur lors de la récupération du nom d'URL:", err);
        }
      } else if (
        item.type === "file" &&
        item.filePath &&
        window.electronAPI?.getFileNameFromPath
      ) {
        try {
          // ✅ CORRIGER : API synchrone (enlever await)
          name = window.electronAPI.getFileNameFromPath(item.filePath);
        } catch (err) {
          console.warn(
            "Erreur lors de la récupération du nom de fichier:",
            err
          );
        }
      }

      // Fallback si aucun nom n'a pu être récupéré
      if (!name) {
        name = item.url || item.filePath || item.appPath || "Nouvel item";
        // Extraire juste le nom de fichier si c'est un chemin
        if (name.includes("\\") || name.includes("/")) {
          name = name.split(/[\\\/]/).pop() || "Nouvel item";
        }
      }
    }

    // ✅ 4. Détermination du type automatique
    let type = item.type;
    if (!type) {
      if (item.url) {
        type = "web";
      } else if (item.appPath) {
        type = "app";
      } else if (item.filePath) {
        // Vérifier si c'est un dossier
        if (window.electronAPI?.isDirectory) {
          try {
            const isDir = await window.electronAPI.isDirectory(item.filePath);
            type = isDir ? "folder" : "file";
          } catch {
            type = "file";
          }
        } else {
          type = "file";
        }
      } else {
        type = "file";
      }
    }

    // ✅ 5. Création de l'item normalisé
    const newItem: AppGridItem = {
      id: `${Date.now()}-${Math.random()}`,
      name: name || "Nouvel item",
      icon:
        icon ||
        (type === "folder"
          ? "📁"
          : type === "web"
          ? "🌐"
          : type === "app"
          ? "🖥️"
          : "📄"),
      type: type as AppGridItem["type"],
      url: item.url,
      filePath: item.filePath,
      appPath: item.appPath,
      description: item.description,
      color: item.color,
      isDefault: item.isDefault || false,
    };

    // ✅ 6. Normaliser si c'est un dossier avec filePath (dossier système importé)
    const normalizedItem = normalizeFolderStructure(newItem);

    // ✅ 7. Ajouter à la structure de données
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );

      if (!selectedCategoryNode) {
        console.warn("Catégorie sélectionnée introuvable");
        return prevCategories;
      }

      // Trouver le nœud courant selon le chemin
      let node;
      if (selectedPath.length === 0) {
        node = selectedCategoryNode;
      } else {
        node = findNode(selectedCategoryNode?.children || [], selectedPath);
      }

      if (!node) {
        console.warn("Nœud courant introuvable");
        return prevCategories;
      }

      // ✅ 8. Ajouter selon le type et la structure
      if (normalizedItem.type === "folder") {
        // Les dossiers vont dans children
        if (!node.children) node.children = [];
        node.children.push(normalizedItem);
        console.log(`✅ Dossier ajouté: ${normalizedItem.name}`);
      } else {
        // Les fichiers/apps/URLs vont dans items
        if (!node.items) node.items = [];
        node.items.push(normalizedItem);
        console.log(
          `✅ Item ajouté: ${normalizedItem.name} (${normalizedItem.type})`
        );
      }

      return newCategories;
    });
  }

  // Fonction pour supprimer un item
  const handleDeleteApp = (id: string) => {
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      let node;
      if (selectedPath.length === 0) {
        node = selectedCategoryNode;
      } else {
        node = findNode(selectedCategoryNode?.children || [], selectedPath);
      }
      if (node) {
        // Supprime dans les items
        if (node.items) {
          node.items = node.items.filter((item: AppGridItem) => item.id !== id);
        }
        // Supprime aussi dans les children (pour les dossiers)
        if (node.children) {
          node.children = node.children.filter(
            (item: AppGridItem) => item.id !== id
          );
        }
      }
      return newCategories;
    });
  };

  // Fonction pour renommer un item
  const handleRenameApp = (id: string, newName: string) => {
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );

      if (!selectedCategoryNode) {
        console.warn("Catégorie sélectionnée introuvable");
        return prevCategories;
      }

      // Trouver le nœud courant selon le chemin
      let node;
      if (selectedPath.length === 0) {
        node = selectedCategoryNode;
      } else {
        node = findNode(selectedCategoryNode?.children || [], selectedPath);
      }

      if (!node) {
        console.warn("Nœud courant introuvable");
        return prevCategories;
      }

      let itemFound = false;

      // ✅ 1. Chercher et renommer dans les items (fichiers/apps/urls)
      if (node.items && node.items.length > 0) {
        const itemIndex = node.items.findIndex(
          (item: AppGridItem) => item.id === id
        );
        if (itemIndex !== -1) {
          console.log(
            `Renommage item trouvé: ${node.items[itemIndex].name} -> ${newName}`
          );

          // ✅ IMPORTANT: Juste renommer, ne pas toucher aux autres propriétés
          node.items[itemIndex] = {
            ...node.items[itemIndex],
            name: newName.trim(),
            // Ne pas modifier url, filePath, appPath, etc.
          };
          itemFound = true;
        }
      }

      // ✅ 2. Chercher et renommer dans les children (dossiers) SEULEMENT si pas trouvé dans items
      if (!itemFound && node.children && node.children.length > 0) {
        const childIndex = node.children.findIndex(
          (child: AppGridItem) => child.id === id
        );
        if (childIndex !== -1) {
          console.log(
            `Renommage dossier trouvé: ${node.children[childIndex].name} -> ${newName}`
          );

          node.children[childIndex] = {
            ...node.children[childIndex],
            name: newName.trim(),
          };
          itemFound = true;
        }
      }

      // ✅ 3. Vérification finale
      if (!itemFound) {
        console.warn(`Item avec ID ${id} introuvable pour renommage`);
        return prevCategories; // Retourner l'état précédent si rien n'est trouvé
      }

      console.log(`✅ Renommage réussi: ID ${id} -> "${newName}"`);
      return newCategories;
    });
  };

  // Fonction pour ajouter un nouveau dossier
  const handleAddFolder = (
    path: string[] = [],
    folderName?: string,
    icon?: string
  ) => {
    if (!folderName || folderName.trim() === "") {
      console.warn("Nom de dossier invalide");
      return;
    }

    const trimmedName = folderName.trim();

    // ✅ 1. Créer le nouveau dossier avec structure complète
    const newFolder = {
      id: `folder-${Date.now()}-${Math.random()}`, // ✅ ID généré
      name: trimmedName,
      icon: icon || "📁", // ✅ Utiliser l'icône fournie ou par défaut
      type: "folder",
      children: [],
      items: [],
      isDefault: false,
    };

    // ✅ 2. Fonction récursive pour ajouter le dossier au bon endroit
    function addFolderRecursively(nodes: any[], currentPath: string[]): any[] {
      // Si on est arrivé à destination, ajouter le dossier
      if (currentPath.length === 0) {
        // Vérifier qu'un dossier avec ce nom n'existe pas déjà
        const existingFolder = nodes.find(
          (node) => node.name === trimmedName && node.type === "folder"
        );
        if (existingFolder) {
          console.warn(`Un dossier nommé "${trimmedName}" existe déjà`);
          return nodes;
        }

        nodes.push(newFolder);
        console.log(
          `✅ Dossier "${trimmedName}" ajouté au chemin: ${path.join(" > ")}`
        );
        return nodes;
      }

      // Sinon, continuer la navigation dans l'arbre
      return nodes.map((node: any) => {
        if (node.name === currentPath[0]) {
          return {
            ...node,
            children: addFolderRecursively(
              node.children || [],
              currentPath.slice(1)
            ),
          };
        }
        return node;
      });
    }

    // ✅ 3. Appliquer les changements
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );

      if (!selectedCategoryNode) {
        console.warn("Catégorie sélectionnée introuvable");
        return prevCategories;
      }

      // ✅ 4. Ajouter selon le niveau
      if (path.length === 0) {
        // Ajouter à la racine de la catégorie
        if (!selectedCategoryNode.children) {
          selectedCategoryNode.children = [];
        }

        // Vérifier qu'un dossier avec ce nom n'existe pas déjà
        const existingFolder = selectedCategoryNode.children.find(
          (child: any) => child.name === trimmedName && child.type === "folder"
        );
        if (existingFolder) {
          console.warn(
            `Un dossier nommé "${trimmedName}" existe déjà à la racine`
          );
          return prevCategories;
        }

        selectedCategoryNode.children.push(newFolder);
        console.log(
          `✅ Dossier "${trimmedName}" ajouté à la racine de ${selectedCategory}`
        );
      } else {
        // Ajouter dans un sous-dossier
        selectedCategoryNode.children = addFolderRecursively(
          selectedCategoryNode.children || [],
          path
        );
      }

      return newCategories;
    });
  };

  // Fonction pour renommer un dossier
  const handleRenameFolder = (path: string[], newName?: string) => {
    const finalName = newName || prompt("Nouveau nom du dossier ?");
    if (!finalName) return;

    function renameFolderRecursively(
      nodes: any[],
      currentPath: string[]
    ): any[] {
      return nodes.map((node: any) => {
        if (node.name === currentPath[0]) {
          if (currentPath.length === 1) {
            return { ...node, name: finalName };
          }
          return {
            ...node,
            children: renameFolderRecursively(
              node.children || [],
              currentPath.slice(1)
            ),
          };
        }
        return node;
      });
    }

    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      if (!selectedCategoryNode) return newCategories;
      selectedCategoryNode.children = renameFolderRecursively(
        selectedCategoryNode.children || [],
        path
      );
      return newCategories;
    });
  };

  // Fonction pour supprimer un dossier
  const handleDeleteFolder = (path: string[]) => {
    if (!window.confirm("Supprimer ce dossier ?")) return;
    function deleteFolderRecursively(
      nodes: any[],
      currentPath: string[]
    ): any[] {
      if (currentPath.length === 1) {
        return nodes.filter((node: any) => node.name !== currentPath[0]);
      }
      return nodes.map((node: any) => {
        if (node.name === currentPath[0]) {
          return {
            ...node,
            children: deleteFolderRecursively(
              node.children || [],
              currentPath.slice(1)
            ),
          };
        }
        return node;
      });
    }
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      if (!selectedCategoryNode) return newCategories;
      selectedCategoryNode.children = deleteFolderRecursively(
        selectedCategoryNode.children || [],
        path
      );
      return newCategories;
    });
  };

  // Fonction pour modifier l'icône d'un dossier
  const handleModifyFolderIcon = (path: string[], icon: string) => {
    function modifyFolderIconRecursively(
      nodes: any[],
      currentPath: string[]
    ): any[] {
      return nodes.map((node: any) => {
        if (node.name === currentPath[0]) {
          if (currentPath.length === 1) {
            return { ...node, icon };
          }
          return {
            ...node,
            children: modifyFolderIconRecursively(
              node.children || [],
              currentPath.slice(1)
            ),
          };
        }
        return node;
      });
    }
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      if (!selectedCategoryNode) return newCategories;
      selectedCategoryNode.children = modifyFolderIconRecursively(
        selectedCategoryNode.children || [],
        path
      );
      return newCategories;
    });
  };

  // Fonction pour modifier le chemin d'un dossier (renommer le chemin)
  const handleModifyFolderPath = (path: string[], newPath: string[]) => {
    function modifyFolderPathRecursively(
      nodes: any[],
      currentPath: string[],
      newPath: string[]
    ): any[] {
      return nodes.map((node: any) => {
        if (node.name === currentPath[0]) {
          if (currentPath.length === 1) {
            return { ...node, name: newPath[0] };
          }
          return {
            ...node,
            children: modifyFolderPathRecursively(
              node.children || [],
              currentPath.slice(1),
              newPath.slice(1)
            ),
          };
        }
        return node;
      });
    }
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      if (!selectedCategoryNode) return newCategories;
      selectedCategoryNode.children = modifyFolderPathRecursively(
        selectedCategoryNode.children || [],
        path,
        newPath
      );
      return newCategories;
    });
  };

  // Fonction pour ajouter un dossier depuis la sidebar
  const handleAddFolderFromSidebar = (path: string[]) => {
    // Ouvrir un modal ou prompt pour demander le nom
    const folderName = prompt("Nom du nouveau dossier :");
    if (folderName && folderName.trim()) {
      handleAddFolder(path, folderName.trim(), "📁");
    }
  };

  // Fonction pour renommer un dossier depuis la sidebar
  const handleRenameFolderFromSidebar = (path: string[]) => {
    const currentFolderName = path[path.length - 1];
    const newName = prompt(`Renommer "${currentFolderName}" :`);
    if (newName && newName.trim()) {
      handleRenameFolder(path, newName.trim());
    }
  };

  // Fonction pour modifier l'icône depuis la sidebar
  const handleModifyIconFromSidebar = (path: string[]) => {
    const newIcon = prompt("Nouvelle icône (emoji ou caractère) :");
    if (newIcon && newIcon.trim()) {
      handleModifyFolderIcon(path, newIcon.trim());
    }
  };

  // Ouvre la modale pour ajouter un dossier
  function openAddFolderModal(path: string[]) {
    setPendingPath(path);
    setShowAddFolderModal(true);
  }

  // Ajoute des IDs aux items (sécurité)
  function addIdsToItemsRecursively(node: any) {
    if (node.items) {
      node.items.forEach((item: any) => {
        if (!item.id) item.id = `${Date.now()}-${Math.random()}`;
      });
    }
    if (node.children) {
      node.children.forEach(addIdsToItemsRecursively);
    }
  }

  // Fonction pour déplacer un item vers un dossier
  const handleMoveToFolder = (item: AppGridItem, folder: AppGridItem) => {
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      let node;
      if (selectedPath.length === 0) {
        node = selectedCategoryNode;
      } else {
        node = findNode(selectedCategoryNode?.children || [], selectedPath);
      }
      if (!node) return prevCategories;

      // 1. Retirer l'item de node.items ou node.children
      if (item.type === "folder") {
        node.children = (node.children || []).filter(
          (i: any) => i.id !== item.id
        );
      } else {
        node.items = (node.items || []).filter((i: any) => i.id !== item.id);
      }

      // 2. Trouver le dossier cible (folder) dans node.children
      const targetFolder = (node.children || []).find(
        (i: any) => i.id === folder.id
      );
      if (!targetFolder) return prevCategories;

      // 3. Ajouter l'item dans le dossier cible
      if (item.type === "folder") {
        targetFolder.children = [...(targetFolder.children || []), item];
      } else {
        targetFolder.items = [...(targetFolder.items || []), item];
      }

      return newCategories;
    });
  };

  // Fonction pour déplacer un item vers un dossier spécifique
  const handleDropToFolder = (folderPath: string[], item: AppGridItem) => {
    setCategories((prevCategories) => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories));
      // 1. Trouver le dossier cible dans l’arbre
      const selectedCategoryNode = newCategories.find(
        (cat: any) => cat.name === selectedCategory
      );
      if (!selectedCategoryNode) return prevCategories;

      // 2. Trouver le nœud courant (là où se trouve l’item à déplacer)
      let node;
      if (selectedPath.length === 0) {
        node = selectedCategoryNode;
      } else {
        node = findNode(selectedCategoryNode?.children || [], selectedPath);
      }
      if (!node) return prevCategories;

      // 3. Retirer l’item de node.items ou node.children
      if (item.type === "folder") {
        node.children = (node.children || []).filter(
          (i: any) => i.id !== item.id
        );
      } else {
        node.items = (node.items || []).filter((i: any) => i.id !== item.id);
      }

      // 4. Trouver le dossier cible dans l’arbre
      const targetFolder = findNode(
        selectedCategoryNode.children || [],
        folderPath
      );
      if (!targetFolder) return prevCategories;

      // 5. Ajouter l’item dans le dossier cible
      if (item.type === "folder") {
        targetFolder.children = [...(targetFolder.children || []), item];
      } else {
        targetFolder.items = [...(targetFolder.items || []), item];
      }

      return newCategories;
    });
  };

  // Fonction pour gérer la soumission du code Google Drive
  const handleGoogleCodeSubmit = async (code: string) => {
    setShowGoogleCodeModal(false);
    // Appelle ici l’API pour finaliser l’auth Google Drive
    const result = await window.electronAPI?.finalizeGoogleDriveAuth?.(code);
    if (result?.success) {
      alert("Connexion à Google Drive réussie !");
    } else {
      alert("Erreur de connexion à Google Drive : " + (result?.error || ""));
    }
  };

  // Fonction pour gérer la soumission du code OneDrive
  const handleOneDriveCodeSubmit = async (code: string) => {
    setShowOneDriveCodeModal(false);
    // Appelle ici l’API pour finaliser l’auth OneDrive
    const result = await window.electronAPI?.finalizeOneDriveAuth?.(code);
    if (result?.success) {
      alert("Connexion à OneDrive réussie !");
    } else {
      alert("Erreur de connexion à OneDrive : " + (result?.error || ""));
    }
  };

  // Fonction pour gérer la soumission du code Dropbox
  const handleDropboxCodeSubmit = async (code: string) => {
    setShowDropboxCodeModal(false);
    // Appelle ici l’API pour finaliser l’auth Dropbox
    const result = await window.electronAPI?.finalizeDropboxAuth?.(code);
    if (result?.success) {
      alert("Connexion à Dropbox réussie !");
    } else {
      alert("Erreur de connexion à Dropbox : " + (result?.error || ""));
    }
  };

  // Fonction pour trouver un nœud dans l'arbre selon le chemin
  function getAllItemsDeep(node: AppGridItem): AppGridItem[] {
    let items: AppGridItem[] = [];
    if (node.items) items = items.concat(node.items);
    if (node.children) {
      node.children.forEach((child) => {
        items = items.concat(getAllItemsDeep(child));
      });
    }
    return items;
  }

  console.log("=== APP RENDER ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("showInstallDialog:", showInstallDialog);
  console.log("InstallModeDialog props:", {
    open: showInstallDialog,
    appName: pendingAppItem?.name || pendingAppItem?.appPath || "Application",
    appPath: pendingAppItem?.appPath || "",
  });

  function handleGlobalDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;

    // Vérifie si le drop a eu lieu sur un dossier de la Sidebar
    // L'id du droppable correspond au path du dossier (ex: "Dossier1/SousDossier")
    const folderPath = over.id.split("/"); // Attention: adapte si tu as changé le séparateur
    const draggedItem = active.data.current?.item;

    // Si draggedItem existe et folderPath est valide
    if (draggedItem && folderPath.length > 0) {
      handleDropToFolder(folderPath, draggedItem);
    }
  }

  console.log("showSettings:", showSettings);

  return (
    <ContextMenuProvider>
      <div
        className="w-full bg-[#030121] flex items-center justify-between px-[6px] h-[36px] border-b border-[#FFDE59] shadow-[18px] select-none"
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Logo et nom à gauche */}
        <div className="flex items-center gap-[2px] ml-[4px]">
          <img src={icon} alt="Logo" className="h-[24px] w-[24px] mx-[4px]" />
          <span className="text-[#FFDE59] text-[20px] font-bold">
            Hyper-Box
          </span>
        </div>
        {/* Boutons fenêtre à droite */}
        <div className="flex items-center gap-[2px] mr-[8px] min-w-[80px] max-w-[80px]">
          <button
            className="w-[24px] bg-[#FFFFFF00] flex items-center justify-center text-[12px] rounded hover:bg-[#2a2250] transition"
            title="Réduire"
            onClick={() => window.electronAPI?.minimizeApp?.()}
          >
            ➖
          </button>
          <button
            className="w-[24px] bg-[#FFFFFF00] flex items-center justify-center text-[12px] rounded hover:bg-[#2a2250] transition"
            title="Agrandir"
            onClick={() => window.electronAPI?.maximizeApp?.()}
          >
            🔳
          </button>
          <button
            className="w-[24px] bg-[#FFFFFF00] flex items-center justify-center text-[12px] rounded hover:bg-[#e9383f] transition"
            title="Fermer"
            onClick={() => window.electronAPI?.closeApp?.()}
          >
            ❌
          </button>
        </div>
      </div>

      <div className="flex flex-col h-screen max-h-[calc(100vh-41px)]">
        <div className="flex flex-1 min-h-[0px]">
          {/* Barre latérale avec les catégories */}
          <Sidebar
            className="h-full min-h-[0px]"
            categories={selectedCategoryNode?.children || []}
            currentPath={selectedPath}
            onNavigate={setSelectedPath}
            onAddFolder={handleAddFolderFromSidebar} // ✅ Nouvelle fonction
            onRenameFolder={handleRenameFolderFromSidebar} // ✅ Nouvelle fonction
            onDeleteFolder={handleDeleteFolder}
            onModifyFolderIcon={handleModifyIconFromSidebar} // ✅ Nouvelle fonction
            onModifyFolderPath={handleModifyFolderPath}
          />
          <main
            className={`flex-1 flex flex-col min-h-[0px] ${
              resolvedTheme === "dark" ? "bg-[#000000]" : "bg-[#ffffff]"
            }`}
          >
            <div className="w-full flex items-center justify-between px-[2px] py-[1px] select-none min-h-[40px] text-[#ffffff] shadow-md">
              {/* Bouton retour à gauche */}
              <div className="flex items-center gap-[2px]">
                {selectedPath.length > 0 && (
                  <button
                    className="w-[24px] bg-[#FFFFFF00] text-[12px] px-[2px] py-[1px] rounded hover:bg-[#2a2250] transition"
                    onClick={() => setSelectedPath(selectedPath.slice(0, -1))}
                    title="Retour"
                  >
                    ⬅️
                  </button>
                )}
              </div>

              {/* Titre centré */}
              <div className="flex-1 flex justify-center items-center pointer-events-none">
                <h2 className="text-[24px] font-bold text-center title-themed flex items-center gap-[8px] text-[#FFDE59]">
                  {selectedPath.length === 0 && selectedCategoryNode?.icon && (
                    <span className="-mt-[5px]">
                      {selectedCategoryNode.icon}
                    </span>
                  )}
                  {selectedPath.length > 0
                    ? selectedPath[selectedPath.length - 1]
                    : selectedCategory}
                </h2>
              </div>
            </div>
            {/* Barre de recherche */}
            <div className="flex justify-center mb-[4px] w-full mt-[0px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔎 Rechercher une application, un fichier..."
                className="w-[320px] h-[24px] rounded-full bg-[#030121] text-[#ffffff] text-[12px] focus:outline-none border-1 border-[#FFDE59] mb-[4px]"
                onDrop={(e) => e.stopPropagation()}
                onDragOver={(e) => e.stopPropagation()}
              />
            </div>
            {/* Zone scrollable */}
            <div className="flex-1 min-h-[0px] mt-[12px] flex flex-col overflow-y-auto scrollbar-hide">
              <AppGrid
                items={displayedItems}
                displayType={displayType}
                currentPath={selectedPath}
                onDragEnd={handleGridReorder}
                onRename={handleRenameApp}
                onDelete={handleDeleteApp}
                onAdd={handleAddApp}
                onOpenApp={(appPath) => {
                  if (window.electronAPI?.openFile) {
                    window.electronAPI.openFile(appPath);
                  } else {
                    alert("L'API Electron n'est pas disponible.");
                  }
                }}
                onAddFolder={(
                  path: string[],
                  folderName: string,
                  icon: string
                ) => handleAddFolder(path, folderName, icon)}
                onNavigate={(path) => setSelectedPath(path)}
              />
            </div>
          </main>
        </div>
        <Footer
          userTypes={categories}
          selectedType={selectedCategory}
          onSelectType={(cat) => {
            setSelectedCategory(cat);
            setSelectedPath([]);
          }}
          onOpenSettings={() => setShowSettings(true)}
          settingsOpen={showSettings}
        />
        <SettingsModal
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>

      <ContextMenu />
      <InstallModeDialog
        open={showInstallDialog}
        appName={
          pendingAppItem?.name || pendingAppItem?.appPath || "Application"
        }
        appPath={pendingAppItem?.appPath || ""}
        onChoice={handleInstallChoice}
        onCancel={handleInstallCancel}
        // ✅ AJOUTER les props de progression
        isInstalling={isInstalling}
        installProgress={installProgress}
        installStatus={installStatus}
      />
    </ContextMenuProvider>
  );
};

export default App;
