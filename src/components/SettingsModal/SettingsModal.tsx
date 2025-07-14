// SettingsModal.tsx
// Description: Composant pour gérer les paramètres de l'application HyperBox
import CryptoJS from "crypto-js";
import React, { useEffect, useState } from "react";
import arweaveLogo from "../../assets/Arweave.png";
import storjLogo from "../../assets/Storj.png";
import { CATEGORIES } from "../../categories-data";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";

// Composant SettingsModal
const SettingsModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  if (!open) return null;
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [closeTimer, setCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [configPath, setConfigPath] = useState<string>("");
  // État pour les connexions Google Drive
  const [showGoogleCodeModal, setShowGoogleCodeModal] = useState(false);
  const [googleDriveCode, setGoogleDriveCode] = useState("");
  const [showGoogleTokenModal, setShowGoogleTokenModal] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  // État pour les connexions OneDrive
  const [showOneDriveCodeModal, setShowOneDriveCodeModal] = useState(false);
  const [oneDriveCode, setOneDriveCode] = useState("");
  const [showOneDriveTokenModal, setShowOneDriveTokenModal] = useState(false);
  const [isOneDriveConnected, setIsOneDriveConnected] = useState(false);
  // État pour les connexions Dropbox
  const [showDropboxCodeModal, setShowDropboxCodeModal] = useState(false);
  const [dropboxCode, setDropboxCode] = useState("");
  const [showDropboxTokenModal, setShowDropboxTokenModal] = useState(false);
  const [isDropboxConnected, setIsDropboxConnected] = useState(false);
  // État pour les connexions Storj
  const [showStorjModal, setShowStorjModal] = useState(false);
  const [storjAccessKey, setStorjAccessKey] = useState("");
  const [storjSecretKey, setStorjSecretKey] = useState("");
  const [storjBucket, setStorjBucket] = useState("");
  const [isStorjConnected, setIsStorjConnected] = useState(false);
  // État pour les connexions Storacha
  const [showStorachaModal, setShowStorachaModal] = useState(false);
  const [storachaAgentKey, setStorachaAgentKey] = useState("");
  const [storachaSpaceDid, setStorachaSpaceDid] = useState("");
  const [isStorachaConnected, setIsStorachaConnected] = useState(false);
  const [storachaAgentDid, setStorachaAgentDid] = useState("");
  const [storachaAgentFileExists, setStorachaAgentFileExists] = useState(false);
  // État pour les connexions Arweave
  const [showArweaveModal, setShowArweaveModal] = useState(false);
  const [isArweaveConnected, setIsArweaveConnected] = useState(false);
  const [arweaveWallet, setArweaveWallet] = useState(""); // Contenu JSON chiffré
  const [arweaveAddress, setArweaveAddress] = useState<string>("");
  const [arweaveWalletFileName, setArweaveWalletFileName] =
    useState<string>("");
  const [arweaveWalletValid, setArweaveWalletValid] = useState<boolean | null>(
    null
  );
  const { showToast } = useToast();
  // const [showOldBackupButton] = useState(false);
  const [backupFreq, setBackupFreq] = useState<
    "never" | "now" | "daily" | "weekly"
  >(() => (localStorage.getItem("hyperbox-backup-freq") as any) || "never");

  // État pour gérer le chargement des infos disque
  const [isLoadingDiskInfo, setIsLoadingDiskInfo] = useState(false);

  const projectRoot: string =
    (window.electronAPI?.getAppPath?.() as string) ||
    require("path").resolve(".");

  // État pour le chemin d'installation
  const [installPath, setInstallPath] = useState<string>(() => {
    // 1. Essayer localStorage en premier
    const saved = localStorage.getItem("hyperbox-install-path");
    if (saved && saved.trim()) {
      console.log("📁 Chemin d'installation depuis localStorage:", saved);
      return saved;
    }

    // 2. Essayer de détecter automatiquement
    try {
      const hyperboxRoot = window.electronAPI?.getAppPath?.();
      if (hyperboxRoot) {
        const appsPath = window.electronAPI?.joinPath?.(hyperboxRoot, "Apps");
        if (appsPath) {
          console.log(
            "📁 Chemin d'installation détecté automatiquement:",
            appsPath
          );
          // Sauvegarder pour les prochaines fois
          localStorage.setItem("hyperbox-install-path", appsPath);
          return appsPath;
        }
      }
    } catch (error) {
      console.warn("Erreur détection automatique du chemin:", error);
    }

    // 3. Fallback
    const fallback = "C:\\HyperBox\\Apps";
    console.log("📁 Chemin d'installation par défaut:", fallback);
    return fallback;
  });

  // État pour le mode d'installation
  const [installMode, setInstallMode] = useState<"keep" | "move" | "ask">(
    () => {
      const saved = localStorage.getItem("hyperbox-install-mode");
      // ✅ Validation du type
      if (saved === "keep" || saved === "move" || saved === "ask") {
        return saved;
      }
      return "ask"; // ✅ Valeur par défaut
    }
  );

  // Fonction pour fermer le modal avec un délai
  useEffect(() => {
    if (backupFreq === "never") return;

    const doBackup = async () => {
      const now = Date.now();
      const lastBackup = localStorage.getItem("hyperbox-last-backup");
      let shouldBackup = false;

      const appsRoot = installPath;
      const savePath = appsRoot.endsWith("Apps")
        ? appsRoot.replace(/\\?Apps$/, "\\hyperbox-config.json")
        : window.electronAPI.joinPath(appsRoot, "hyperbox-config.json");
      console.log("Chemin de sauvegarde HyperBoxSav:", savePath);

      if (backupFreq === "now") {
        shouldBackup = true;
        setBackupFreq("never");
      } else if (backupFreq === "daily") {
        shouldBackup =
          !lastBackup || now - Number(lastBackup) > 24 * 60 * 60 * 1000;
      } else if (backupFreq === "weekly") {
        shouldBackup =
          !lastBackup || now - Number(lastBackup) > 7 * 24 * 60 * 60 * 1000;
      }

      if (shouldBackup) {
        // 1. Génère/actualise HyperBoxSav à partir du config utilisateur
        const config = await window.electronAPI.getUserConfig();
        await window.electronAPI.saveHyperboxsav(
          config.categories,
          installPath
        );

        // 2. Zip le dossier HyperBoxSav
        const zipPath = await window.electronAPI.zipHyperBoxSav?.(installPath);
        if (
          !zipPath ||
          typeof zipPath !== "string" ||
          !zipPath.endsWith(".zip")
        ) {
          showToast(
            "Erreur lors de la génération du zip HyperBoxSav.",
            "error"
          );
          return;
        }
        console.log("Résultat zipHyperBoxSav:", zipPath);

        // 3. Upload sur Google Drive
        if (isGoogleConnected && zipPath) {
          const result = await window.electronAPI.exportFileToGoogleDrive(
            zipPath,
            "HyperBoxSav.zip"
          );
          if (result?.success) {
            showToast("✅ HyperBoxSav sauvegardé sur Google Drive !");
            ("⚠️ Pensez à supprimer manuellement les anciennes versions sur Google Drive pour éviter d'encombrer votre espace de stockage.");
          } else {
            showToast(
              "Erreur lors de l'upload Google Drive : " + (result?.error || ""),
              "error"
            );
          }
        }

        // 4. Upload sur OneDrive
        if (isOneDriveConnected && zipPath) {
          const result = await window.electronAPI.exportFileToOneDrive(
            zipPath,
            "HyperBoxSav.zip"
          );
          if (result?.success) {
            showToast("✅ HyperBoxSav sauvegardé sur OneDrive !", "success");
            ("⚠️ Pensez à supprimer manuellement les anciennes versions sur OneDrive pour éviter d'encombrer votre espace de stockage.");
          } else {
            showToast(
              "Erreur lors de l'upload OneDrive : " + (result?.error || ""),
              "error"
            );
          }
        }

        // 5. Upload sur Dropbox
        if (isDropboxConnected && zipPath) {
          const result = await window.electronAPI.exportFileToDropbox(
            zipPath,
            "HyperBoxSav.zip"
          );
          if (result?.success) {
            showToast("✅ HyperBoxSav sauvegardé sur Dropbox !", "success");
          } else {
            showToast(
              "Erreur lors de l'upload Dropbox : " + (result?.error || ""),
              "error"
            );
          }
        }

        // 6. Upload sur Storj
        if (isStorjConnected && zipPath) {
          console.log("zipPath pour Storj:", zipPath);
          const result = await window.electronAPI.exportFileToStorj(
            zipPath,
            "HyperBoxSav.zip",
            decrypt(localStorage.getItem("storj-access-key") || ""),
            decrypt(localStorage.getItem("storj-secret-key") || ""),
            decrypt(localStorage.getItem("storj-bucket") || "")
          );
          if (result?.success) {
            showToast("✅ HyperBoxSav sauvegardé sur Storj !", "success");
          } else {
            showToast(
              "Erreur lors de l'upload Storj : " + (result?.error || ""),
              "error"
            );
          }
        }

        // 7. Upload sur Storacha
        const agentKey = decryptStoracha(
          localStorage.getItem("storacha-agent-key") || ""
        );
        const spaceDid = decryptStoracha(
          localStorage.getItem("storacha-space-did") || ""
        );
        if (isStorachaConnected && zipPath) {
          console.log("AgentKey pour Storacha:", agentKey);
          console.log("SpaceDID pour Storacha:", spaceDid);
          if (!agentKey || !spaceDid) {
            showToast("Agent Key ou Space DID manquant pour Storacha", "error");
            console.log("AgentKey pour Storacha (avant export):", agentKey);
            console.log("SpaceDID pour Storacha (avant export):", spaceDid);
          } else {
            const result = await window.electronAPI.exportFileToStoracha(
              zipPath,
              "HyperBoxSav.zip",
              agentKey,
              spaceDid
            );
            if (result?.success) {
              showToast("✅ HyperBoxSav sauvegardé sur Storacha !", "success");
            } else {
              showToast(
                "Erreur lors de l'upload Storacha : " + (result?.error || ""),
                "error"
              );
            }
          }
        }

        // 8. Upload sur Arweave
        if (isArweaveConnected && zipPath) {
          try {
            console.log("Tentative d'upload sur Arweave...");
            const walletPath = localStorage.getItem("arweave-wallet-path");

            if (!savePath || !savePath.endsWith(".json")) {
              showToast("Chemin du fichier structure invalide !", "error");
              return;
            }
            if (!walletPath || !walletPath.endsWith(".json")) {
              showToast(
                "Aucun wallet Arweave configuré ou chemin invalide !",
                "error"
              );
              return;
            }
            const result = await window.electronAPI.exportFileToArweave(
              zipPath,
              "HyperBoxSav.zip",
              walletPath
            );
            if (result?.success) {
              showToast("✅ HyperBoxSav sauvegardé sur Arweave !", "success");
            } else {
              showToast(
                "Erreur lors de l'upload Arweave : " + (result?.error || ""),
                "error"
              );
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            showToast("Erreur inattendue Arweave : " + msg, "error");
          }
        }

        localStorage.setItem("hyperbox-last-backup", String(now));
        showToast("✅ HyperBoxSav sauvegardé avec succès !", "success");
      }

      try {
        await window.electronAPI.saveAppsStructureToFile(appsRoot, savePath);
        // Export cloud du fichier Apps
        const filename = "hyperbox-config.json";
        if (isGoogleConnected)
          await window.electronAPI.exportAppsStructureToGoogleDrive(
            savePath,
            filename
          );
        if (isOneDriveConnected)
          await window.electronAPI.exportAppsStructureToOneDrive(
            savePath,
            filename
          );
        if (isDropboxConnected)
          await window.electronAPI.exportAppsStructureToDropbox(
            savePath,
            filename
          );
        if (isStorjConnected)
          await window.electronAPI.exportAppsStructureToStorj(
            savePath,
            filename,
            decrypt(localStorage.getItem("storj-access-key") || ""),
            decrypt(localStorage.getItem("storj-secret-key") || ""),
            decrypt(localStorage.getItem("storj-bucket") || "")
          );
        /* if (isArweaveConnected) {
          const walletPath = localStorage.getItem("arweave-wallet-path");
          console.log("=== DEBUG ARWEAVE ===");
          console.log("savePath:", savePath);
          console.log("filename:", filename);
          console.log("arweave-wallet-path:", walletPath);

          if (
            !savePath ||
            typeof savePath !== "string" ||
            !savePath.endsWith(".json")
          ) {
            showToast(
              "Le chemin du fichier à exporter vers Arweave est invalide !",
              "error"
            );
            return;
          }
          if (
            !walletPath ||
            typeof walletPath !== "string" ||
            !walletPath.endsWith(".json")
          ) {
            showToast("Le chemin du wallet Arweave est invalide !", "error");
            return;
          }

          await window.electronAPI.exportAppsStructureToArweave(
            savePath,
            filename,
            walletPath
          );
        } */
        // Mettre à jour le timestamp du dernier backup
        localStorage.setItem("hyperbox-last-backup", String(now));
        showToast("✅ Structure HyperBoxSav sauvegardée !", "success");
      } catch (e) {
        showToast(
          "Erreur lors de la sauvegarde de la structure HyperBoxSav.",
          "error"
        );
        console.error("Erreur détaillée :", e);
      }
    };

    doBackup();
  }, [
    backupFreq,
    installPath,
    isGoogleConnected,
    isOneDriveConnected,
    isDropboxConnected,
    isStorjConnected,
    isStorachaConnected,
    isArweaveConnected,
  ]);

  useEffect(() => {
    localStorage.setItem("hyperbox-backup-freq", backupFreq);
  }, [
    backupFreq,
    installPath,
    isGoogleConnected,
    isOneDriveConnected,
    isDropboxConnected,
    isStorjConnected,
    isStorachaConnected,
    isArweaveConnected,
  ]);

  // Fonction pour fermer le modal avec un délai
  useEffect(() => {
    const fetchConfigPath = async () => {
      if (window.electronAPI?.getConfigPath) {
        const path = await window.electronAPI.getConfigPath();
        setConfigPath(path);
      }
    };
    fetchConfigPath();
  }, []);

  useEffect(() => {
    if (!open && closeTimer) {
      clearTimeout(closeTimer);
      setCloseTimer(null);
    }
    return () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
    };
  }, [open, closeTimer]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyI") {
        window.electronAPI?.toggleDevTools?.();
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && e.code === "KeyR") {
        window.electronAPI?.forceReload?.();
        e.preventDefault();
      }
      if (e.ctrlKey && !e.shiftKey && e.code === "KeyR") {
        window.electronAPI?.reload?.();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Clé secrète pour le chiffrement/déchiffrement des données Storj
  const STORJ_SECRET = "hyperbox-storj-key"; // À stocker ailleurs pour la prod

  function encrypt(text: string) {
    return CryptoJS.AES.encrypt(text, STORJ_SECRET).toString();
  }
  function decrypt(cipher: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, STORJ_SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return "";
    }
  }

  // Clé secrète pour le chiffrement/déchiffrement des données Storacha
  const STORACHA_SECRET = "hyperbox-storacha-key"; // À stocker ailleurs pour la prod

  function encryptStoracha(text: string) {
    return CryptoJS.AES.encrypt(text, STORACHA_SECRET).toString();
  }
  function decryptStoracha(cipher: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, STORACHA_SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return "";
    }
  }

  // Fonction pour générer une clé agent Storacha
  const handleGenerateStorachaAgent = async () => {
    if (window.electronAPI?.getStorachaAgentFile) {
      const existing = await window.electronAPI.getStorachaAgentFile();
      if (existing) {
        showToast(
          "Un agent Storacha existe déjà. Veuillez l'utiliser ou le déconnecter avant d'en générer un nouveau.",
          "error"
        );
        setStorachaAgentKey(existing);
        return;
      }
    }
    try {
      const { exported, did, agentPath } =
        await window.electronAPI.generateStorachaAgent();
      setStorachaAgentKey(JSON.stringify(exported));
      setStorachaAgentDid(did);

      localStorage.setItem(
        "storacha-agent-key",
        encryptStoracha(JSON.stringify(exported))
      );
      localStorage.setItem("storacha-space-did", encryptStoracha(did));

      showToast(
        `Agent Storacha généré et sauvegardé dans ${agentPath} !`,
        "success"
      );
    } catch (e) {
      showToast("Erreur lors de la génération de l'agent Storacha.", "error");
    }
  };

  useEffect(() => {
    const agentKey = decryptStoracha(
      localStorage.getItem("storacha-agent-key") || ""
    );
    const spaceDid = decryptStoracha(
      localStorage.getItem("storacha-space-did") || ""
    );
    const isConnected = !!agentKey && !!spaceDid;
    setIsStorachaConnected(isConnected);
    setStorachaAgentKey(agentKey);
    setStorachaSpaceDid(spaceDid);
  }, []);

  // Clé secrète pour le chiffrement/déchiffrement des données Arweave
  const ARWEAVE_SECRET = "hyperbox-arweave-key"; // À stocker ailleurs pour la prod

  function encryptArweave(text: string) {
    return CryptoJS.AES.encrypt(text, ARWEAVE_SECRET).toString();
  }
  function decryptArweave(cipher: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, ARWEAVE_SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return "";
    }
  }

  // État pour les informations sur le disque
  const [diskInfo, setDiskInfo] = useState({
    freeSpace: "...", // ✅ Pas de valeur en dur !
    usedSpace: "...", // ✅ Pas de valeur en dur !
    totalApps: 0, // ✅ Pas de valeur en dur !
  });

  // États pour gérer l'ouverture/fermeture des sections
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    appearance: false, // Apparence ouverte par défaut
    applications: false,
    behavior: false,
    storage: false,
    about: false,
  });

  // État pour stocker le dernier chemin d'installation utilisé
  const [lastDiskInfoPath, setLastDiskInfoPath] = useState<string | null>(null);

  useEffect(() => {
    if (open && installPath && installPath !== lastDiskInfoPath) {
      setTimeout(() => {
        updateDiskInfo(installPath);
        setLastDiskInfoPath(installPath);
      }, 0);
    }
  }, [open, installPath, lastDiskInfoPath]);

  // AJOUTER un nouveau useEffect pour le chargement initial :
  useEffect(() => {
    // Charger les infos disque au premier rendu même si le modal n'est pas ouvert
    // Cela permet d'avoir les données prêtes quand l'utilisateur ouvre les paramètres
    if (installPath && installPath !== "...") {
      console.log("🔄 Chargement initial des infos disque");
      updateDiskInfo(installPath);
    }
  }, []); // ✅ Exécuter une seule fois au montage

  // État pour gérer l'ouverture/fermeture des sections
  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Charger le thème depuis le localStorage au démarrage
  const handleSelectFolder = async () => {
    try {
      const selectedFolder = await window.electronAPI?.selectFolder();
      if (selectedFolder) {
        // ✅ Extraire le path de l'objet retourné
        setInstallPath(selectedFolder.path);
        localStorage.setItem("hyperbox-install-path", selectedFolder.path);

        // Mettre à jour les infos disque
        await updateDiskInfo(selectedFolder.path);
      }
    } catch (error) {
      console.error("Erreur sélection dossier:", error);
    }
  };

  // Mettre à jour les infos disque pour le chemin d'installation
  const updateDiskInfo = async (path: string) => {
    setIsLoadingDiskInfo(true);
    console.log("🔍 Chargement des infos disque pour:", path);

    try {
      if (
        !window.electronAPI?.getDiskInfo ||
        !window.electronAPI?.countAppsInFolder
      ) {
        console.warn("APIs disque non disponibles");
        setDiskInfo({
          freeSpace: "Non disponible",
          usedSpace: "Non disponible",
          totalApps: 0,
        });
        return;
      }

      const [diskData, appCount] = await Promise.all([
        window.electronAPI.getDiskInfo(path),
        window.electronAPI.countAppsInFolder(path),
      ]);

      console.log("📊 Infos disque reçues:", diskData);
      console.log("=== AVANT setState ===");
      console.log("Ancienne valeur diskInfo:", diskInfo);
      console.log("=== NOUVELLE VALEUR ===");
      console.log("freeSpace:", diskInfo?.freeSpace);
      console.log("usedSpace:", diskInfo?.usedSpace);
      console.log("totalApps:", appCount);
      console.log("📱 Nombre d'apps:", appCount);

      if (diskData) {
        // ✅ Force un nouvel objet pour déclencher le re-render
        const newDiskInfo = {
          freeSpace: diskData.freeSpace || "Non disponible",
          usedSpace: diskData.usedSpace || "Non disponible",
          totalApps: appCount || 0,
        };

        console.log("💾 Mise à jour état avec:", newDiskInfo);
        setDiskInfo(newDiskInfo);
      }
    } catch (error) {
      console.error("❌ Erreur info disque:", error);
      setDiskInfo({
        freeSpace: "Erreur",
        usedSpace: "Erreur",
        totalApps: 0,
      });
    } finally {
      setIsLoadingDiskInfo(false);
    }
  };

  // Ouvrir le dossier d'installation dans l'explorateur de fichiers
  const handleOpenFolder = async () => {
    try {
      await window.electronAPI?.openFolder(installPath);
    } catch (error) {
      console.error("Erreur ouverture dossier:", error);
    }
  };

  // Gérer le changement de thème
  const handleInstallModeChange = (mode: "keep" | "move" | "ask") => {
    setInstallMode(mode);
    localStorage.setItem("hyperbox-install-mode", mode);
  };

  // Calculer l'utilisation du disque
  const calculateDiskUsage = (usedSpace: string, freeSpace: string) => {
    const used = parseFloat(usedSpace.replace(/[^0-9.]/g, "")) || 0;
    const free = parseFloat(freeSpace.replace(/[^0-9.]/g, "")) || 0;
    const total = used + free;

    if (total === 0)
      return {
        percentage: 0,
        colorClass: "progress-bar-green",
        cssVars: { "--progress-width": "0%" },
      };

    const usagePercentage = (used / total) * 100;

    let colorClass = "progress-bar-green";
    if (usagePercentage >= 90) colorClass = "progress-bar-critical";
    else if (usagePercentage >= 75) colorClass = "progress-bar-red";
    else if (usagePercentage >= 50) colorClass = "progress-bar-orange";
    else if (usagePercentage >= 25) colorClass = "progress-bar-yellow";

    const percentage = Math.min(100, Math.max(1, usagePercentage));

    return {
      percentage,
      colorClass,
      cssVars: { "--progress-width": `${percentage}%` },
    };
  };

  // Calculer l'utilisation du disque
  const getProgressWidthClass = (percentage: number) => {
    // Arrondir au multiple de 5 le plus proche
    const rounded = Math.round(percentage / 5) * 5;
    const clamped = Math.min(100, Math.max(0, rounded));
    return `progress-width-${clamped}`;
  };

  // Gérer l'export de la configuration
  const handleExportConfig = async () => {
    const ok = await window.electronAPI?.exportConfig?.();
    if (ok) showToast("Configuration exportée !", "success");
    else showToast("Erreur lors de l'export.", "error");
  };

  // Gérer l'import de la configuration
  const handleImportConfig = async () => {
    const ok = await window.electronAPI?.importConfig?.();
    if (ok)
      showToast(
        "Configuration importée ! Redémarrez l'application.",
        "success"
      );
    else showToast("Erreur lors de l'import.", "error");
  };

  // Options de thème
  const themeOptions = [
    { value: "dark", label: "🌙 Sombre", icon: "🌙" },
    { value: "light", label: "☀️ Clair", icon: "☀️" },
    { value: "system", label: "💻 Système", icon: "💻" },
  ] as const;

  // Fonction pour connecter Google Drive
  const handleConnectGoogleDrive = async () => {
    const result = await window.electronAPI?.openGoogleAuthWindow?.();
    console.log("Résultat OAuth:", result);
    if (result?.success && result.code) {
      setGoogleDriveCode(result.code);
      // Soumission automatique
      const submitResult = await handleGoogleCodeSubmit(result.code);
      // Optionnel: afficher la modale seulement si erreur
      if (!submitResult) setShowGoogleCodeModal(true);
    } else {
      showToast("Erreur lors de l'authentification Google Drive.", "error");
    }
  };

  // Gérer la soumission du code Google Drive
  const handleGoogleCodeSubmit = async (code: string) => {
    setShowGoogleCodeModal(false);
    const result = await window.electronAPI?.finalizeGoogleDriveAuth?.(code);
    if (result?.success && result.token) {
      localStorage.setItem("google-token", result.token);
      setIsGoogleConnected(true);
      showToast("Connexion à Google Drive réussie !", "success");
      return true;
    } else {
      setIsGoogleConnected(false);
      showToast(
        "Erreur de connexion à Google Drive : " + (result?.error || ""),
        "error"
      );
      return false;
    }
  };

  // Fonction pour connecter OneDrive
  const handleConnectOneDrive = async () => {
    const result = await window.electronAPI?.openOneDriveAuthWindow?.();
    console.log("Résultat OAuth OneDrive:", result);
    // Vérifier si le résultat contient un code d'authentification
    if (result?.success && result.code) {
      setOneDriveCode(result.code);
      // Soumission automatique
      const submitResult = await handleOneDriveCodeSubmit(result.code);
      // Optionnel: afficher la modale seulement si erreur
      if (!submitResult) {
        setShowOneDriveCodeModal(true);
      }
    } else {
      showToast("Erreur lors de l'authentification OneDrive.", "error");
    }
  };

  // Gérer la soumission du code OneDrive
  const handleOneDriveCodeSubmit = async (code: string) => {
    setShowOneDriveCodeModal(false);
    const result = await window.electronAPI?.finalizeOneDriveAuth?.(code);
    if (result?.success && result.token) {
      localStorage.setItem("onedrive-token", result.token);
      setIsOneDriveConnected(true);
      showToast("Connexion à OneDrive réussie !", "success");
      return true;
    } else {
      setIsOneDriveConnected(false);
      showToast(
        "Erreur de connexion à OneDrive : " + (result?.error || ""),
        "error"
      );
      return false;
    }
  };

  // Fonction pour connecter Dropbox
  const handleConnectDropbox = async () => {
    const result = await window.electronAPI?.openDropboxAuthWindow?.();
    console.log("Résultat OAuth Dropbox:", result);
    // Vérifier si le résultat contient un code d'authentification
    if (result?.success && result.code) {
      setDropboxCode(result.code);
      // Soumission automatique
      const submitResult = await handleDropboxCodeSubmit(result.code);
      // Optionnel: afficher la modale seulement si erreur
      if (!submitResult) {
        setShowDropboxCodeModal(true);
      }
    } else {
      showToast("Erreur lors de l'authentification Dropbox.", "error");
    }
  };

  // Gérer la soumission du code Dropbox
  const handleDropboxCodeSubmit = async (code: string) => {
    setShowDropboxCodeModal(false);
    const result = await window.electronAPI?.finalizeDropboxAuth?.(code);
    if (result?.success && result.token) {
      localStorage.setItem("dropbox-token", result.token);
      setIsDropboxConnected(true);
      showToast("Connexion à Dropbox réussie !", "success");
      return true;
    } else {
      setIsDropboxConnected(false);
      showToast(
        "Erreur de connexion à Dropbox : " + (result?.error || ""),
        "error"
      );
      return false;
    }
  };

  // Écouter les codes OAuth depuis le preload script
  useEffect(() => {
    if (!window.electronAPI?.onOAuthCode) return;
    const handler = (data: { provider: string; code: string }) => {
      if (data.provider === "google") {
        setGoogleDriveCode(data.code);
        setShowGoogleCodeModal(true);
      }
      if (data.provider === "onedrive") {
        setOneDriveCode(data.code);
        setShowOneDriveCodeModal(true);
      }
      if (data.provider === "dropbox") {
        setDropboxCode(data.code);
        setShowDropboxCodeModal(true);
      }
    };
    window.electronAPI.onOAuthCode(handler);
    // Optionnel: cleanup
    return () => {
      // Si tu ajoutes un removeListener dans preload, appelle-le ici
    };
  }, []);

  // Fonction pour connecter Storj
  const handleConnectStorj = async () => {
    const creds = await window.electronAPI.getStorjCredentials();
    if (creds && creds.accessKey && creds.secretKey && creds.bucket) {
      setStorjAccessKey(creds.accessKey);
      setStorjSecretKey(creds.secretKey);
      setStorjBucket(creds.bucket);
      setIsStorjConnected(true);
      showToast("Connexion Storj réussie !", "success");
    } else {
      setShowStorjModal(true);
    }
  };

  // Charger les identifiants Storj depuis le localStorage
  const handleReconnectStorj = async () => {
    // 1. Lire le fichier storj.json via l'API Electron
    const creds = await window.electronAPI.getStorjCredentials();
    if (creds && creds.accessKey && creds.secretKey && creds.bucket) {
      // 2. Renseigner les états
      setStorjAccessKey(creds.accessKey);
      setStorjSecretKey(creds.secretKey);
      setStorjBucket(creds.bucket);
      // 3. Mettre à jour la connexion
      setIsStorjConnected(true);
      showToast("Connexion Storj réussie !", "success");
      // 4. Sauvegarder dans le localStorage pour la persistance
      localStorage.setItem("storj-access-key", encrypt(creds.accessKey));
      localStorage.setItem("storj-secret-key", encrypt(creds.secretKey));
      localStorage.setItem("storj-bucket", encrypt(creds.bucket));
    } else {
      setShowStorjModal(true);
      showToast("Identifiants Storj manquants ou invalides.", "error");
    }
  };

  const handleStorjSubmit = async () => {
    const isValid = await window.electronAPI.validateStorjCredentials(
      storjAccessKey,
      storjSecretKey,
      storjBucket
    );
    if (!isValid) {
      showToast("Identifiants Storj invalides !", "error");
      return;
    }
    // Sauvegarde dans le fichier storj.json
    const creds = {
      STORJ_ACCESS_KEY_ID: storjAccessKey,
      STORJ_SECRET_ACCESS_KEY: storjSecretKey,
      STORJ_BUCKET: storjBucket,
    };
    const result = await window.electronAPI.saveStorjCredentials(
      storjAccessKey,
      storjSecretKey,
      storjBucket
    );
    if (result?.success) {
      showToast("Identifiants Storj enregistrés dans storj.json !", "success");
    } else {
      showToast("Erreur lors de la sauvegarde du fichier Storj.", "error");
    }
    // Sauvegarde aussi dans le localStorage pour la connexion rapide
    localStorage.setItem("storj-access-key", encrypt(storjAccessKey));
    localStorage.setItem("storj-secret-key", encrypt(storjSecretKey));
    localStorage.setItem("storj-bucket", encrypt(storjBucket));
    setShowStorjModal(false);
  };

  useEffect(() => {
    if (showStorjModal) {
      setStorjAccessKey(
        decrypt(localStorage.getItem("storj-access-key") || "")
      );
      setStorjSecretKey(
        decrypt(localStorage.getItem("storj-secret-key") || "")
      );
      setStorjBucket(decrypt(localStorage.getItem("storj-bucket") || ""));
    }
  }, [showStorjModal]);

  // Vérifier si les identifiants Storj sont valides
  const handleImportStorjCredentials = async () => {
    if (
      !window.electronAPI?.selectFile ||
      !window.electronAPI?.getFileContent
    ) {
      showToast("Fonctionnalité non disponible.", "error");
      return;
    }
    const file = await window.electronAPI.selectFile();
    if (!file) return;
    const json = await window.electronAPI.getFileContent(file.path);
    try {
      const creds = JSON.parse(json);
      setStorjAccessKey(creds.STORJ_ACCESS_KEY_ID || "");
      setStorjSecretKey(creds.STORJ_SECRET_ACCESS_KEY || "");
      setStorjBucket(creds.STORJ_BUCKET || "");
      localStorage.setItem(
        "storj-access-key",
        encrypt(creds.STORJ_ACCESS_KEY_ID || "")
      );
      localStorage.setItem(
        "storj-secret-key",
        encrypt(creds.STORJ_SECRET_ACCESS_KEY || "")
      );
      localStorage.setItem("storj-bucket", encrypt(creds.STORJ_BUCKET || ""));
      showToast("Fichier Storj importé et infos remplies !", "success");
    } catch {
      showToast("Fichier Storj invalide !", "error");
    }
  };

  // Fonction pour connecter Filecoin via Web3.Storage
  const handleConnectStoracha = () => {
    setShowStorachaModal(true);
  };

  // Reconnecter Storacha
  const handleReconnectStoracha = async () => {
    // Récupère le dossier utilisateur HyperBox
    const userDataPath = await window.electronAPI.getUserDataPath?.();

    // 1. Lire le fichier agent Storacha
    const agentKeyJson = await window.electronAPI.getFileContent?.(
      `${userDataPath}/storacha-agent.json`
    );

    // 2. Lire le fichier space-did.json
    const spaceDid = await window.electronAPI.getFileContent?.(
      `${userDataPath}/space-did.json`
    );

    // 3. Vérifier et renseigner les états
    if (agentKeyJson && spaceDid) {
      setStorachaAgentKey(agentKeyJson);
      setStorachaSpaceDid(spaceDid.trim());
      setIsStorachaConnected(true);
      showToast("Connexion Storacha réussie !", "success");
      localStorage.setItem("storacha-agent-key", encryptStoracha(agentKeyJson));
      localStorage.setItem(
        "storacha-space-did",
        encryptStoracha(spaceDid.trim())
      );
    } else {
      setShowStorachaModal(true);
      showToast("Identifiants Storacha manquants ou invalides.", "error");
    }
  };

  // Charger les identifiants Storacha depuis le localStorage
  const handleStorachaSubmit = async () => {
    if (!storachaAgentKey || !storachaSpaceDid) {
      showToast("Veuillez remplir tous les champs !", "error");
      return;
    }
    localStorage.setItem(
      "storacha-agent-key",
      encryptStoracha(storachaAgentKey)
    );
    localStorage.setItem(
      "storacha-space-did",
      encryptStoracha(storachaSpaceDid)
    );
    // Récupère le dossier utilisateur HyperBox
    const userDataPath = await window.electronAPI.getUserDataPath?.();

    // Sauvegarde dans le fichier agent
    await window.electronAPI.writeAgentFile?.(
      `${userDataPath}/storacha-agent.json`,
      storachaAgentKey
    );

    // Sauvegarde dans le fichier space-did.json (écriture directe)
    await window.electronAPI.writeAgentFile?.(
      `${userDataPath}/space-did.json`,
      storachaSpaceDid.trim()
    );

    setShowStorachaModal(false);
    showToast("Identifiants Storacha enregistrés !", "success");
  };

  useEffect(() => {
    if (showStorachaModal) {
      const agentKey = decryptStoracha(
        localStorage.getItem("storacha-agent-key") || ""
      );
      const spaceDid = decryptStoracha(
        localStorage.getItem("storacha-space-did") || ""
      );
      console.log("Chargement Space DID:", spaceDid);
      setStorachaAgentKey(agentKey);
      setStorachaSpaceDid(spaceDid);
    }
  }, [showStorachaModal]);

  useEffect(() => {
    if (window.electronAPI?.getStorachaAgentFile) {
      window.electronAPI.getStorachaAgentFile().then((json) => {
        setStorachaAgentFileExists(!!json);
      });
    }
  }, [showStorachaModal]);

  // Fonction pour connecter Arweave
  const handleConnectArweave = async () => {
    setShowArweaveModal(true);

    // Charge le wallet existant (si présent)
    const walletCipher = localStorage.getItem("arweave-wallet");
    const walletPath = localStorage.getItem("arweave-wallet-path");
    let walletJson = "";
    if (walletPath && window.electronAPI?.getFileContent) {
      // Relit le .json du disque pour être sûr d'avoir la dernière version
      walletJson = await window.electronAPI.getFileContent(walletPath);
    } else if (walletCipher) {
      walletJson = decryptArweave(walletCipher);
    }
    if (walletJson) {
      setArweaveWallet(walletJson);
      setArweaveWalletValid(true);
      const address = await window.electronAPI.getArweaveAddress(walletJson);
      setArweaveAddress(address);
    } else {
      setArweaveWallet("");
      setArweaveWalletValid(null);
      setArweaveAddress("");
    }
  };

  // Reconnecter le wallet Arweave
  const handleReconnectArweave = async () => {
    const walletPath = localStorage.getItem("arweave-wallet-path");
    let walletJson = "";
    if (walletPath && window.electronAPI?.getFileContent) {
      walletJson = await window.electronAPI.getFileContent(walletPath);
    }
    if (!walletJson) {
      showToast(
        "Aucun wallet Arweave trouvé. Merci d'importer un wallet.",
        "error"
      );
      return;
    }
    setArweaveWallet(walletJson);
    setArweaveWalletValid(true);
    setIsArweaveConnected(true);
    // AJOUTE CETTE LIGNE :
    localStorage.setItem("arweave-wallet", encryptArweave(walletJson));
    const address = await window.electronAPI.getArweaveAddress(walletJson);
    setArweaveAddress(address);
    showToast("Wallet Arweave chargé et connecté !", "success");
  };

  const moonPayApiKey = window.electronAPI?.getMoonPayApiKey?.() || "";
  const transakApiKey = window.electronAPI?.getTransakApiKey?.() || "";

  // Vérifier si le wallet Arweave est valide
  const handleUploadToArweave = async () => {
    if (!window.electronAPI?.selectFile) {
      showToast("Sélecteur de fichier non disponible.", "error");
      return;
    }
    const file = await window.electronAPI.selectFile();
    if (!file) return;
    const walletPath = localStorage.getItem("arweave-wallet-path"); // ou demande à l'utilisateur
    if (!walletPath) {
      showToast("Aucun wallet Arweave configuré !", "error");
      return;
    }
    const txId = await window.electronAPI.uploadToArweave(
      file.path,
      walletPath
    );
    showToast(
      "Fichier uploadé sur Arweave ! Transaction ID : " + txId,
      "success"
    );
  };

  // Télécharger un fichier depuis Arweave
  const handleDownloadFromArweave = async () => {
    const txId = prompt("Transaction ID à télécharger ?");
    if (!txId) return;
    const dest = await window.electronAPI.selectFolder();
    if (!dest) return;
    const destPath = window.electronAPI.joinPath(dest.path, txId + ".bin");
    await window.electronAPI.downloadFromArweave(txId, destPath);
    showToast("Fichier téléchargé dans : " + destPath, "success");
  };

  // Importer un wallet Arweave depuis un fichier JSON
  const handleImportArweaveWallet = async () => {
    if (
      !window.electronAPI?.selectFile ||
      !window.electronAPI?.getFileContent ||
      !window.electronAPI?.importArweaveWallet
    ) {
      showToast("Fonctionnalité non disponible.", "error");
      return;
    }
    const file = await window.electronAPI.selectFile();
    if (!file) return;
    setArweaveWalletFileName(file.name);
    const walletJson = await window.electronAPI.getFileContent(file.path);
    setArweaveWallet(walletJson);
    setArweaveWalletValid(null);

    // Appelle le handler pour copier le wallet dans le dossier utilisateur
    const walletPath = await window.electronAPI.importArweaveWallet(
      JSON.parse(walletJson)
    );
    localStorage.setItem("arweave-wallet-path", walletPath);

    // Récupère l'adresse publique
    const address = await window.electronAPI.getArweaveAddress(walletJson);
    setArweaveAddress(address);
  };
  // Soumettre le wallet Arweave
  const handleArweaveSubmit = async () => {
    if (!arweaveWallet) {
      showToast("Veuillez importer un wallet Arweave !", "error");
      return;
    }
    const isValid = await window.electronAPI?.validateArweaveWallet?.(
      arweaveWallet
    );
    if (!isValid) {
      setArweaveWalletValid(false);
      showToast("Wallet Arweave invalide !", "error");
      return;
    }
    setArweaveWalletValid(true);
    localStorage.setItem("arweave-wallet", encryptArweave(arweaveWallet));
    // Enregistre le chemin du wallet si besoin
    if (!localStorage.getItem("arweave-wallet-path")) {
      showToast("Attention : le chemin du wallet n'est pas défini.", "error");
    }
    const address = await window.electronAPI.getArweaveAddress(arweaveWallet);
    setArweaveAddress(address);
    setIsArweaveConnected(true);
    setShowArweaveModal(false);
    showToast("Wallet Arweave enregistré et connecté !", "success");
  };

  // Déconnecter le wallet Arweave
  const handleDisconnectArweave = () => {
    localStorage.removeItem("arweave-wallet");
    setArweaveWallet("");
    setArweaveWalletValid(null);
    setArweaveAddress("");
    setIsArweaveConnected(false);
    showToast("Déconnecté d'Arweave !", "success");
  };

  // Classe pour le bouton de connexion au cloud
  function getCloudButtonClass(isConnected: boolean) {
    return isConnected
      ? "bg-[#05ff01] text-[#030121] hover:bg-[#03d100]"
      : "bg-[#ffbc3f] text-[#030121] hover:bg-[#ffde59]";
  }

  // Vérifier les connexions au démarrage
  useEffect(() => {
    setIsGoogleConnected(!!localStorage.getItem("google-token"));
  }, [localStorage.getItem("google-token")]);

  useEffect(() => {
    setIsOneDriveConnected(!!localStorage.getItem("onedrive-token"));
  }, [localStorage.getItem("onedrive-token")]);

  useEffect(() => {
    setIsDropboxConnected(!!localStorage.getItem("dropbox-token"));
  }, [localStorage.getItem("dropbox-token")]);

  useEffect(() => {
    // Vérifier si Storacha est connecté
    setIsStorachaConnected(
      !!localStorage.getItem("storacha-agent-key") &&
        !!localStorage.getItem("storacha-space-did")
    );
    setIsArweaveConnected(!!localStorage.getItem("arweave-wallet"));
  }, []);

  // Charger l'adresse Arweave au démarrage
  useEffect(() => {
    const walletPath = localStorage.getItem("arweave-wallet-path");
    if (walletPath && window.electronAPI?.getFileContent) {
      window.electronAPI
        .getFileContent(walletPath)
        .then((walletJson: string) => {
          if (walletJson) {
            window.electronAPI
              .getArweaveAddress(walletJson)
              .then(setArweaveAddress);
          } else {
            setArweaveAddress("");
          }
        });
    } else {
      setArweaveAddress("");
    }
  }, [isArweaveConnected, showArweaveModal]);

  // Vérifier si Storj est connecté
  useEffect(() => {
    const syncStorjState = () => {
      const accessKey = localStorage.getItem("storj-access-key");
      const secretKey = localStorage.getItem("storj-secret-key");
      const bucket = localStorage.getItem("storj-bucket");
      const isConnected = !!accessKey && !!secretKey && !!bucket;
      setIsStorjConnected(isConnected);
      setStorjAccessKey(decrypt(accessKey || ""));
      setStorjSecretKey(decrypt(secretKey || ""));
      setStorjBucket(decrypt(bucket || ""));
    };

    syncStorjState();

    window.addEventListener("storage", syncStorjState);
    return () => window.removeEventListener("storage", syncStorjState);
  }, []);

  // Composant pour l'en-tête de section
  const SectionHeader = ({
    icon,
    title,
    sectionKey,
    isOpen,
  }: {
    icon: string;
    title: string;
    sectionKey: string;
    isOpen: boolean;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-[3px] bg-gray-800 hover:bg-gray-700 rounded-[10px] transition-colors duration-200 border border-gray-600"
    >
      <div className="flex items-center gap-[2px]">
        <span className="text-[18px]">{icon}</span>
        <span className="font-bold text-[#030121] text-[18px] pl-[8px]">
          {title}
        </span>
      </div>
      <span
        className={`text-[#FFDE59] transition-transform duration-200 ${
          isOpen ? "rotate-90" : ""
        }`}
      >
        ▶
      </span>
    </button>
  );

  return (
    <div
      className="fixed z-50 bottom-[41px] right-[5px] bg-[#030121] border-1 border-[#FFDE59] rounded-[10px] shadow-lg p-[5px] text-[#F0F0F0] w-[250px] max-h-[80vh] overflow-y-auto scrollbar-hide"
      onMouseLeave={() => {
        // Lance le timer de fermeture
        if (!closeTimer) {
          const timer = setTimeout(() => {
            onClose();
          }, 5000);
          setCloseTimer(timer);
        }
      }}
      onMouseEnter={() => {
        // Annule le timer si la souris revient
        if (closeTimer) {
          clearTimeout(closeTimer);
          setCloseTimer(null);
        }
      }}
    >
      <h3 className="text-[30px] font-bold mb-[24px] text-[#FFDE59] text-center">
        ⚙️ Paramètres
      </h3>

      <div className="space-y-[3px]">
        {/* 🎨 APPARENCE */}
        <div>
          <SectionHeader
            icon="🎨"
            title="Apparence"
            sectionKey="appearance"
            isOpen={openSections.appearance}
          />

          {openSections.appearance && (
            <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-gray-700">
              <div className="space-y-[3px]">
                <label className="block text-[14px] font-medium text-gray-300">
                  Thème
                </label>
                <div className="grid grid-cols-3 gap-[2px]">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`p-[2px] rounded-[14px] border-2 transition-all duration-200 text-[14px] font-medium ${
                        theme === option.value
                          ? "border-[#FFDE59] bg-[#FFDE59] text-[#000000]"
                          : "border-gray-600 bg-gray-800 text-gray-300 hover:border-[#FFDE59]"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-[1px]">
                        <span className="text-[16px]">{option.icon}</span>
                        <span className="text-[8px]">
                          {option.label.replace(/^.+ /, "")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-[8px] text-gray-400">
                  Thème actif :{" "}
                  <span className="font-medium text-[#FFDE59]">
                    {resolvedTheme === "dark" ? "🌙 Sombre" : "☀️ Clair"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 📁 APPLICATIONS */}
        <div>
          <SectionHeader
            icon="📁"
            title="Applications"
            sectionKey="applications"
            isOpen={openSections.applications}
          />

          {openSections.applications && (
            <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-gray-700">
              <div className="space-y-[4px]">
                {/* Répertoire d'installation */}
                <div>
                  <label className="block text-[12px] font-bold text-[#FFDE59] mb-[4px] flex items-center gap-1">
                    📂 Répertoire d'Installation
                  </label>
                  {/* Affichage du chemin actuel */}
                  <div className="mb-[2px]">
                    <div className="flex gap-[2px]">
                      <div className="flex-1 px-[6px] py-[4px] bg-[#181633] border border-[#FFDE59] rounded-[6px] text-[#F0F0F0] text-[10px] font-mono min-h-[24px] flex items-center">
                        {installPath}
                      </div>
                      <button
                        onClick={handleSelectFolder}
                        className="px-[6px] py-[4px] bg-[#FFDE59] text-[#000000] rounded-[6px] hover:bg-yellow-400 transition-colors font-medium text-[12px] flex items-center gap-[1px]"
                        aria-label="Sélectionner un nouveau répertoire d'installation"
                        title="Parcourir les dossiers"
                      >
                        📁 Parcourir
                      </button>
                      <button
                        onClick={handleOpenFolder}
                        className="px-[6px] py-[4px] bg-gray-700 text-[#F0F0F0] rounded-[6px] hover:bg-gray-600 transition-colors font-medium text-[10px]"
                        title="Ouvrir le dossier dans l'explorateur"
                      >
                        📂
                      </button>
                    </div>
                  </div>
                  {/* Informations sur l'espace disque */}
                  <div className="bg-[#181633] rounded-[6px] p-[6px] border border-gray-600">
                    <div className="flex justify-between items-center mb-[1px]">
                      <span className="text-[10px] text-[#F0F0F0] font-medium">
                        💾 Espace disponible
                      </span>
                      <span className="text-[10px] text-[#FFDE59] font-bold">
                        {isLoadingDiskInfo
                          ? "⏳ Chargement..."
                          : diskInfo.freeSpace}
                      </span>
                    </div>

                    {!isLoadingDiskInfo &&
                      (() => {
                        const { percentage, colorClass, cssVars } =
                          calculateDiskUsage(
                            diskInfo.usedSpace,
                            diskInfo.freeSpace
                          );
                        let status = "🟢 Excellent";
                        let statusColor = "text-green-400";

                        if (percentage >= 90) {
                          status = "🔴 Critique";
                          statusColor = "text-red-400";
                        } else if (percentage >= 75) {
                          status = "🟠 Attention";
                          statusColor = "text-orange-400";
                        } else if (percentage >= 50) {
                          status = "🟡 Modéré";
                          statusColor = "text-yellow-400";
                        } else if (percentage >= 25) {
                          status = "🟡 Bon";
                          statusColor = "text-yellow-400";
                        }

                        return (
                          <>
                            <div className="w-full bg-gray-700 rounded-full h-[4px] mb-[2px]">
                              <div
                                className={`${colorClass} ${getProgressWidthClass(
                                  percentage
                                )}`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-400 mb-[1px]">
                              <span>📊 {percentage.toFixed(1)}% utilisé</span>
                              <span className={`${statusColor} font-medium`}>
                                {status}
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-400">
                              <span>📁 {diskInfo.totalApps} applications</span>
                              <span>💾 {diskInfo.usedSpace} utilisés</span>
                            </div>
                          </>
                        );
                      })()}

                    {isLoadingDiskInfo && (
                      <div className="text-center py-[2px]">
                        <span className="text-[8px] text-gray-400">
                          Calcul en cours...
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[8px] text-gray-400 mt-[4px] italic">
                    💡 Dossier central où HyperBox stockera vos applications
                  </p>
                </div>
                {/* Mode d'ajout */}
                <div>
                  <label className="block text-[18px] font-medium text-[#F0F0F0] mb-[12px]">
                    ⚙️ Mode d'ajout par défaut
                  </label>
                  <div className="space-y-[3px]">
                    {[
                      {
                        value: "keep" as const,
                        label: "🔗 Conserver l'emplacement",
                        desc: "Raccourci vers l'emplacement actuel",
                      },
                      {
                        value: "move" as const,
                        label: "📦 Déplacer vers HyperBox",
                        desc: "Centralise dans HyperBox",
                      },
                      {
                        value: "ask" as const,
                        label: "❓ Toujours Demander",
                        desc: "Propose le choix à chaque ajout",
                      },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-start gap-[3px] cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="installMode"
                          value={option.value}
                          checked={installMode === option.value}
                          onChange={() => handleInstallModeChange(option.value)}
                          // defaultChecked={option.value === "ask"}
                          className="mt-[1px] text-[#FFDE59] focus:ring-[#FFDE59]"
                          aria-labelledby={`radio-${option.value}-label`}
                          title={option.desc}
                        />
                        <div className="flex-1">
                          <span
                            id={`radio-${option.value}-label`}
                            className="text-[14px] font-medium text-[#F0F0F0] group-hover:text-[#FFDE59]"
                          >
                            {option.label}
                          </span>
                          <p className="text-[8px] text-[#F0F0F0]">
                            {option.desc}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-[8px]">
                    <button
                      className="w-full flex items-center gap-[4px] px-[6px] py-[2px] rounded-[8px] bg-[#FFDE59] text-[#030121] font-bold hover:bg-yellow-400 border border-[#FFDE59] transition mb-[4px]"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Cette action va régénérer la structure physique HyperBox (dossiers et raccourcis) selon la configuration par défaut. Continuer ?"
                          )
                        ) {
                          const result =
                            await window.electronAPI.regenerateHyperboxStructure(
                              CATEGORIES,
                              projectRoot, // racine du projet
                              installPath // dossier d'installation
                            );
                          if (result?.success)
                            showToast(
                              "Structure HyperBox régénérée partout !",
                              "success"
                            );
                          else
                            showToast(
                              "Erreur : " + (result?.error || ""),
                              "error"
                            );
                        }
                      }}
                      title="Régénérer la structure physique des dossiers et raccourcis HyperBox"
                    >
                      ♻️ Régénérer la structure HyperBox
                    </button>
                    <p className="text-[9px] text-gray-400 mt-[2px]">
                      Cette action ne supprime rien, mais recrée les
                      dossiers/raccourcis manquants selon la configuration par
                      défaut.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔧 COMPORTEMENT */}
        <div>
          <SectionHeader
            icon="🔧"
            title="Comportement"
            sectionKey="behavior"
            isOpen={openSections.behavior}
          />

          {openSections.behavior && (
            // ...dans {openSections.behavior && ( ... )} :
            <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[8px] border border-gray-700">
              <div className="space-y-[8px]">
                <button
                  className="w-full flex items-center gap-[2px] px-[2px] py-[1px] rounded-[4px] bg-[#030121] hover:bg-[#2a2250] border border-[#FFDE59] text-[#FFDE59] font-medium transition"
                  onClick={() => window.electronAPI?.toggleDevTools?.()}
                  title="Ouvrir les DevTools (CTRL+Maj+I)"
                >
                  🛠️ Ouvrir les DevTools{" "}
                  <span className="ml-auto text-[10px] text-gray-400">
                    Ctrl+Maj+I
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-[2px] px-[2px] py-[1px] rounded-[4px] bg-[#030121] hover:bg-[#2a2250] border border-[#FFDE59] text-[#FFDE59] font-medium transition"
                  onClick={() => window.electronAPI?.forceReload?.()}
                  title="Recharger sans cache (CTRL+Maj+R)"
                >
                  ♻️ Force Reload{" "}
                  <span className="ml-auto text-[10px] text-gray-400">
                    Ctrl+Maj+R
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-[2px] px-[2px] py-[1px] rounded-[4px] bg-[#030121] hover:bg-[#2a2250] border border-[#FFDE59] text-[#FFDE59] font-medium transition"
                  onClick={() => window.electronAPI?.reload?.()}
                  title="Recharger (CTRL+R)"
                >
                  🔄 Reload{" "}
                  <span className="ml-auto text-[10px] text-gray-400">
                    Ctrl+R
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 📊 STOCKAGE */}
        <div>
          <SectionHeader
            icon="📊"
            title="Stockage"
            sectionKey="storage"
            isOpen={openSections.storage}
          />
          {openSections.storage && (
            <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-gray-700 space-y-[3px]">
              {/* Dossier de config */}
              <div>
                <label className="block text-[12px] font-bold text-[#FFDE59] mb-[1px]">
                  📁 Dossier de configuration
                </label>
                <div className="flex items-center gap-[2px]">
                  <span className="flex-1 px-[2px] py-[1px] bg-[#181633] border border-[#FFDE59] rounded-[8px] text-[10px] font-mono">
                    {configPath}
                  </span>
                  <button
                    className="px-[3px] py-[1px] bg-[#FFDE59] text-[#030121] rounded-[8px] hover:bg-yellow-400 transition"
                    onClick={handleOpenFolder}
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
              {/* Export/Import/Sauvegarder */}
              <div>
                <label className="block text-[12px] font-bold text-[#FFDE59] mb-[1px]">
                  💾 Export/Import/Sauvegarder
                </label>
                <div className="flex gap-[2px]">
                  <button
                    className="px-[3px] py-[1px] bg-[#FFDE59] text-[#030121] rounded-[8px] hover:bg-yellow-400 transition"
                    onClick={handleExportConfig}
                  >
                    Exporter
                  </button>
                  <button
                    className="px-[3px] py-[1px] bg-[#FFDE59] text-[#030121] rounded-[8px] hover:bg-yellow-400 transition"
                    onClick={handleImportConfig}
                  >
                    Importer
                  </button>

                  <button
                    className="px-[3px] py-[1px] bg-[#FFDE59] text-[#030121] rounded-[8px] hover:bg-yellow-400 transition"
                    // ...dans le onClick du bouton Sauvegarder...
                    onClick={async () => {
                      // Demande la structure utilisateur à Electron (IPC)
                      const config =
                        await window.electronAPI?.getUserConfig?.();
                      if (!config || !config.categories) {
                        showToast(
                          "Impossible de charger la configuration utilisateur !",
                          "error"
                        );
                        return;
                      }
                      // Appelle la fonction de génération côté main
                      const result = await window.electronAPI.saveHyperboxsav(
                        config.categories,
                        installPath
                      );
                      if (result?.success)
                        showToast(
                          "Dossier HyperBoxSav sauvegardé !",
                          "success"
                        );
                      else
                        showToast(
                          "Erreur lors de la sauvegarde : " +
                            (result?.error || ""),
                          "error"
                        );
                    }}
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
              {/* Cloud */}
              <div>
                <label className="block text-[12px] font-bold text-[#FFDE59] mb-[2px]">
                  ☁️ Synchronisation Cloud
                </label>
                <div className="flex flex-col gap-[2px]">
                  {/* Google Drive */}
                  <div
                    className={`flex items-center gap-[4px] p-[4px] py-[1px] rounded-[10px] border border-[#900090] cursor-pointer ${
                      isGoogleConnected ? "bg-[#05ff01]/80" : "bg-[#ffbc3f]/80"
                    }`}
                    title={
                      isGoogleConnected
                        ? "Google Drive connecté"
                        : "Connecter Google Drive"
                    }
                  >
                    <span
                      className="text-[10px] cursor-pointer"
                      onClick={() => {
                        if (isGoogleConnected) setShowGoogleTokenModal(true);
                        else setShowGoogleCodeModal(true);
                      }}
                      title={
                        isGoogleConnected
                          ? "Voir le token Google Drive"
                          : "Saisir le code Google Drive"
                      }
                    >
                      <img
                        src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
                        alt="Google Drive"
                        className="w-[16px] h-[16px] mr-[4px] align-middle inline-block"
                      />
                    </span>
                    <span
                      className="flex-1 font-medium text-[14px] text-[#030121] cursor-pointer"
                      onClick={() => {
                        if (isGoogleConnected) setShowGoogleTokenModal(true);
                        else setShowGoogleCodeModal(true);
                      }}
                      title={
                        isGoogleConnected
                          ? "Voir le token Google Drive"
                          : "Saisir le code Google Drive"
                      }
                    >
                      Google Drive
                    </span>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isGoogleConnected
                          ? "bg-gray-200 text-green-700 cursor-not-allowed"
                          : "bg-[#05ff01] text-[#030121] hover:bg-[#03d100]"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectGoogleDrive();
                      }}
                      disabled={isGoogleConnected}
                      title="Lancer l'authentification OAuth"
                    >
                      ✅
                    </button>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isGoogleConnected
                          ? "bg-[#ffbc3f] text-[#f0f0f0] hover:bg-[#ffde59]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isGoogleConnected) {
                          localStorage.removeItem("google-token");
                          setIsGoogleConnected(false);
                          showToast("Déconnecté de Google Drive !", "success");
                        }
                      }}
                      disabled={!isGoogleConnected}
                      title="Déconnecter"
                    >
                      🛑
                    </button>
                  </div>
                  {showGoogleCodeModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-[#900090] space-y-[3px]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Connexion Google Drive
                      </h4>
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed">
                        <b>
                          Collez le code d'autorisation Google Drive ci-dessous
                          :
                        </b>
                      </div>
                      <input
                        className="w-[220px] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#030121]"
                        placeholder="Code Google Drive"
                        onChange={(e) => setGoogleDriveCode(e.target.value)}
                        value={googleDriveCode}
                      />
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() =>
                            handleGoogleCodeSubmit(googleDriveCode)
                          }
                        >
                          Valider
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowGoogleCodeModal(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                  {showGoogleTokenModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-[#900090] space-y-[3px]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Token Google Drive
                      </h4>
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed break-all">
                        <b>Token :</b> {localStorage.getItem("google-token")}
                      </div>
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              localStorage.getItem("google-token") || ""
                            );
                            showToast("Token copié !", "success");
                          }}
                        >
                          Copier
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowGoogleTokenModal(false)}
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OneDrive */}
                  <div
                    className={`flex items-center gap-[4px] p-[4px] py-[1px] rounded-[10px] border border-[#900090] cursor-pointer ${
                      isOneDriveConnected
                        ? "bg-[#05ff01]/80"
                        : "bg-[#ffbc3f]/80"
                    }`}
                    title={
                      isOneDriveConnected
                        ? "OneDrive connecté"
                        : "Connecter OneDrive"
                    }
                  >
                    <span
                      className="text-[10px] cursor-pointer"
                      onClick={() => {
                        if (!isOneDriveConnected)
                          setShowOneDriveCodeModal(true);
                        else setShowOneDriveTokenModal(true);
                      }}
                      title={
                        isOneDriveConnected
                          ? "Voir le token OneDrive"
                          : "Saisir le code OneDrive"
                      }
                    >
                      <img
                        src="https://www.pngall.com/wp-content/uploads/9/OneDrive-Logo-Transparent.png"
                        alt="OneDrive"
                        className="w-[16px] h-[16px] mr-[2px] align-middle inline-block"
                      />
                    </span>
                    <span
                      className="flex-1 font-medium text-[14px] text-[#030121] cursor-pointer"
                      onClick={() => {
                        if (!isOneDriveConnected)
                          setShowOneDriveCodeModal(true);
                        else setShowOneDriveTokenModal(true);
                      }}
                      title={
                        isOneDriveConnected
                          ? "Voir le token OneDrive"
                          : "Saisir le code OneDrive"
                      }
                    >
                      OneDrive
                    </span>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isOneDriveConnected
                          ? "bg-gray-200 text-green-700 cursor-not-allowed"
                          : "bg-[#05ff01] text-[#030121] hover:bg-[#03d100]"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectOneDrive();
                      }}
                      disabled={isOneDriveConnected}
                      title="Lancer l'authentification OAuth"
                    >
                      ✅
                    </button>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isOneDriveConnected
                          ? "bg-[#ffbc3f] text-[#f0f0f0] hover:bg-[#ffde59]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isOneDriveConnected) {
                          localStorage.removeItem("onedrive-token");
                          setIsOneDriveConnected(false);
                          showToast("Déconnecté de OneDrive !", "success");
                        }
                      }}
                      disabled={!isOneDriveConnected}
                      title="Déconnecter"
                    >
                      🛑
                    </button>
                  </div>
                  {showOneDriveCodeModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] space-y-[3px] border border-[#900090]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Connexion OneDrive
                      </h4>
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed">
                        <b>
                          Collez le code d'autorisation OneDrive ci-dessous :
                        </b>
                      </div>
                      <input
                        className="w-[220px] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#030121]"
                        placeholder="Code OneDrive"
                        onChange={(e) => setOneDriveCode(e.target.value)}
                        value={oneDriveCode}
                      />
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => handleOneDriveCodeSubmit(oneDriveCode)}
                        >
                          Valider
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowOneDriveCodeModal(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                  {showOneDriveTokenModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-[#900090] space-y-[3px]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Token OneDrive
                      </h4>
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed break-all">
                        <b>Token :</b> {localStorage.getItem("onedrive-token")}
                      </div>
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              localStorage.getItem("onedrive-token") || ""
                            );
                            showToast("Token copié !", "success");
                          }}
                        >
                          Copier
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowOneDriveTokenModal(false)}
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dropbox */}
                  <div
                    className={`flex items-center gap-[4px] p-[4px] py-[1px] rounded-[10px] border border-[#900090] cursor-pointer ${
                      isDropboxConnected ? "bg-[#05ff01]/80" : "bg-[#ffbc3f]/80"
                    }`}
                    title={
                      isDropboxConnected
                        ? "Dropbox connecté"
                        : "Connecter Dropbox"
                    }
                  >
                    <span
                      className="text-[10px] cursor-pointer"
                      onClick={() => {
                        if (!isDropboxConnected) setShowDropboxCodeModal(true);
                        else setShowDropboxTokenModal(true);
                      }}
                      title={
                        isDropboxConnected
                          ? "Voir le token Dropbox"
                          : "Saisir le code Dropbox"
                      }
                    >
                      <img
                        src="https://cfl.dropboxstatic.com/static/images/favicon.ico"
                        alt="Dropbox"
                        className="w-[16px] h-[16px] mr-[2px] align-middle icon-inline"
                      />
                    </span>
                    <span
                      className="flex-1 font-medium text-[14px] text-[#030121] cursor-pointer"
                      onClick={() => {
                        if (!isDropboxConnected) setShowDropboxCodeModal(true);
                        else setShowDropboxTokenModal(true);
                      }}
                      title={
                        isDropboxConnected
                          ? "Voir le token Dropbox"
                          : "Saisir le code Dropbox"
                      }
                    >
                      Dropbox
                    </span>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isDropboxConnected
                          ? "bg-gray-200 text-green-700 cursor-not-allowed"
                          : "bg-[#05ff01] text-[#030121] hover:bg-[#03d100]"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectDropbox();
                      }}
                      disabled={isDropboxConnected}
                      title="Lancer l'authentification OAuth"
                    >
                      ✅
                    </button>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isDropboxConnected
                          ? "bg-[#ffbc3f] text-[#f0f0f0] hover:bg-[#ffde59]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDropboxConnected) {
                          localStorage.removeItem("dropbox-token");
                          setIsDropboxConnected(false);
                          showToast("Déconnecté de Dropbox !", "success");
                        }
                      }}
                      disabled={!isDropboxConnected}
                      title="Déconnecter"
                    >
                      🛑
                    </button>
                  </div>
                  {showDropboxCodeModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] space-y-[3px] border border-[#900090]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Connexion Dropbox
                      </h4>
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed">
                        <b>
                          Collez le code d'autorisation Dropbox ci-dessous :
                        </b>
                      </div>
                      <input
                        className="w-[220px] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#030121]"
                        placeholder="Code Dropbox"
                        onChange={(e) => setDropboxCode(e.target.value)}
                        value={dropboxCode}
                      />
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => handleDropboxCodeSubmit(dropboxCode)}
                        >
                          Valider
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowDropboxCodeModal(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                  {showDropboxTokenModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-[#900090] space-y-[3px]">
                      <h4 className="text-[#FFDE59] mb-[4px]">Token Dropbox</h4>
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed break-all">
                        <b>Token :</b> {localStorage.getItem("dropbox-token")}
                      </div>
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              localStorage.getItem("dropbox-token") || ""
                            );
                            showToast("Token copié !", "success");
                          }}
                        >
                          Copier
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowDropboxTokenModal(false)}
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Storj */}
                  <div
                    className={`flex items-center gap-[4px] p-[4px] py-[1px] rounded-[10px] border border-[#900090] cursor-pointer ${
                      isStorjConnected ? "bg-[#05ff01]/80" : "bg-[#ffbc3f]/80"
                    }`}
                    title={
                      isStorjConnected ? "Storj connecté" : "Connecter Storj"
                    }
                  >
                    <span
                      className="text-[10px] cursor-pointer"
                      onClick={() => {
                        if (!isStorjConnected) setShowStorjModal(true);
                        else setShowStorjModal(true);
                      }}
                      title={
                        isStorjConnected
                          ? "Voir les identifiants Storj"
                          : "Saisir les identifiants Storj"
                      }
                    >
                      <img
                        src={storjLogo}
                        alt="Storj"
                        className="w-[16px] h-[16px] mr-[2px] align-middle inline-block"
                      />
                    </span>
                    <span
                      className="flex-[1px] font-medium text-[14px] text-[#030121] cursor-pointer"
                      onClick={() => {
                        if (!isStorjConnected) setShowStorjModal(true);
                        else setShowStorjModal(true);
                      }}
                      title={
                        isStorjConnected
                          ? "Voir les identifiants Storj"
                          : "Saisir les identifiants Storj"
                      }
                    >
                      Storj
                    </span>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isStorjConnected
                          ? "bg-gray-200 text-green-700 cursor-not-allowed"
                          : "bg-[#05ff01] text-[#030121] hover:bg-[#03d100]"
                      }`}
                      onClick={handleReconnectStorj}
                      disabled={isStorjConnected}
                      title="Connecter Storj"
                    >
                      ✅
                    </button>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isStorjConnected
                          ? "bg-[#ffbc3f] text-[#f0f0f0] hover:bg-[#ffde59]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        localStorage.removeItem("storj-access-key");
                        localStorage.removeItem("storj-secret-key");
                        localStorage.removeItem("storj-bucket");
                        setStorjAccessKey("");
                        setStorjSecretKey("");
                        setStorjBucket("");
                        setIsStorjConnected(false);
                        showToast("Déconnecté de Storj !", "success");
                      }}
                      disabled={!isStorjConnected}
                      title="Déconnecter"
                    >
                      🛑
                    </button>
                  </div>
                  {showStorjModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-[#900090] space-y-[3px]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Connexion Storj
                      </h4>
                      {/* Texte d'aide ici */}
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed">
                        <b>Comment connecter Storj à HyperBox&nbsp;?</b>
                        <ol className="list-decimal pl-[16px] mt-[6px] mb-[1px] space-y-[1px]">
                          <li>
                            <a
                              href="https://eu1.storj.io/login"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FFDE59] underline"
                            >
                              Connectez-vous à votre compte Storj
                            </a>
                            .
                          </li>
                          <li>
                            Rendez-vous dans&nbsp;
                            <a
                              href="https://eu1.storj.io/access"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FFDE59] underline"
                            >
                              Access Grants
                            </a>
                            &nbsp;puis cliquez sur{" "}
                            <b>“Create S3 Credentials”</b>.
                          </li>
                          <li>
                            Copiez l’<b>Access Key</b>, le <b>Secret Key</b> et
                            le <b>Bucket</b> générés, puis collez-les
                            ci-dessous.
                          </li>
                          <li>
                            Cliquez sur <b>Valider</b> pour enregistrer vos
                            identifiants.
                          </li>
                          <li>
                            Déconnecter Storj si vous souhaitez recommencer en
                            cliquant sur le bouton ci-dessous.
                          </li>
                        </ol>
                        <div className="mt-[1px]">
                          <a
                            href="https://storj.dev/dcs/getting-started"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FFDE59] underline"
                          >
                            Voir le guide officiel Storj
                          </a>
                        </div>
                      </div>
                      <input
                        className="w-[220px] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#030121]"
                        placeholder="Access Key"
                        value={storjAccessKey}
                        readOnly={isStorjConnected}
                        onChange={(e) => setStorjAccessKey(e.target.value)}
                      />
                      <input
                        className="w-[220px] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#030121]"
                        placeholder="Secret Key"
                        type="password"
                        value={storjSecretKey}
                        readOnly={isStorjConnected}
                        onChange={(e) => setStorjSecretKey(e.target.value)}
                      />
                      <input
                        className="w-[220px] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#030121]"
                        placeholder="Bucket"
                        value={storjBucket}
                        readOnly={isStorjConnected}
                        onChange={(e) => setStorjBucket(e.target.value)}
                      />
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={handleStorjSubmit}
                        >
                          Valider
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowStorjModal(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Storacha */}
                  <div
                    className={`flex items-center gap-[4px] p-[4px] py-[1px] rounded-[10px] border border-[#900090] cursor-pointer ${
                      isStorachaConnected
                        ? "bg-[#05ff01]/80"
                        : "bg-[#ffbc3f]/80"
                    }`}
                    title={
                      isStorachaConnected
                        ? "Storacha connecté"
                        : "Connecter Storacha"
                    }
                  >
                    <span
                      className="text-[10px] cursor-pointer"
                      onClick={() => {
                        if (!isStorachaConnected) setShowStorachaModal(true);
                        else setShowStorachaModal(true);
                      }}
                      title={
                        isStorachaConnected
                          ? "Voir les identifiants Storacha"
                          : "Saisir les identifiants Storacha"
                      }
                    >
                      <img
                        src="https://storacha.network/favicon.ico"
                        alt="Storacha"
                        className="w-[16px] h-[16px] mr-[2px] align-middle inline-block"
                      />
                    </span>
                    <span
                      className="flex-1 font-medium text-[14px] text-[#030121] cursor-pointer"
                      onClick={() => {
                        if (!isStorachaConnected) setShowStorachaModal(true);
                        else setShowStorachaModal(true);
                      }}
                      title={
                        isStorachaConnected
                          ? "Voir les identifiants Storacha"
                          : "Saisir les identifiants Storacha"
                      }
                    >
                      Storacha
                    </span>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isStorachaConnected
                          ? "bg-gray-200 text-green-700 cursor-not-allowed"
                          : "bg-[#05ff01] text-[#030121] hover:bg-[#03d100]"
                      }`}
                      onClick={handleReconnectStoracha}
                      disabled={isStorachaConnected}
                      title="Connecter Storacha"
                    >
                      ✅
                    </button>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isStorachaConnected
                          ? "bg-[#ffbc3f] text-[#f0f0f0] hover:bg-[#ffde59]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        localStorage.removeItem("storacha-agent-key");
                        localStorage.removeItem("storacha-space-did");
                        setStorachaAgentKey("");
                        setStorachaSpaceDid("");
                        setIsStorachaConnected(false);
                        showToast("Déconnecté de Storacha !", "success");
                      }}
                      disabled={!isStorachaConnected}
                      title="Déconnecter"
                    >
                      🛑
                    </button>
                  </div>
                  {showStorachaModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-[#900090] space-y-[3px]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Connexion Storacha Network
                      </h4>
                      {/* Texte d'aide ici */}
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed">
                        <b>
                          Comment connecter Storacha (Filecoin) à
                          HyperBox&nbsp;?
                        </b>
                        <ol className="list-decimal pl-[16px] mt-[6px] mb-[1px] space-y-[1px]">
                          <li>
                            <a
                              href="https://console.storacha.network"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FFDE59] underline"
                            >
                              Connectez-vous à votre compte Storacha
                            </a>
                          </li>
                          <li>
                            Rendez-vous dans&nbsp;
                            <a
                              href="https://docs.storacha.network/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FFDE59] underline"
                            >
                              la documentation Storacha
                            </a>
                            &nbsp;et suivez le guide pour générer un Agent Key
                            et un Space DID.
                          </li>
                          <li>
                            Copiez votre <b>Agent Key</b> et votre{" "}
                            <b>Space DID</b> puis collez-les ci-dessous.
                          </li>
                          <li>
                            Cliquez sur <b>Valider</b> pour enregistrer vos
                            identifiants.
                          </li>
                          <li>
                            Déconnecter Storacha si vous souhaitez recommencer
                            en cliquant sur le bouton ci-dessous.
                          </li>
                        </ol>
                        <div className="mt-[2px]">
                          <a
                            href="https://docs.storacha.network"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FFDE59] underline"
                          >
                            Voir le Guide Officiel Storacha
                          </a>
                        </div>
                      </div>
                      <input
                        className="w-[220px] mx-auto block mx-[4px] my-[6px] p-[1px] rounded-[10px] text-[#030121]"
                        placeholder="Space DID"
                        value={storachaSpaceDid}
                        onChange={(e) => setStorachaSpaceDid(e.target.value)}
                      />
                      {!storachaAgentFileExists && (
                        <button
                          className="w-[220px] bg-[#900090] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#ffde59] cursor-pointer border border-[#ffde59] hover:bg-[#ff00ff]"
                          onClick={handleGenerateStorachaAgent}
                        >
                          Générer un Agent Storacha
                        </button>
                      )}

                      {storachaAgentFileExists && !isStorachaConnected && (
                        <button
                          className="w-[220px] bg-[#900090] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#ffde59] cursor-pointer border border-[#ffde59] hover:bg-[#ff00ff]"
                          onClick={async () => {
                            const json =
                              await window.electronAPI.getStorachaAgentFile();
                            if (json) {
                              setStorachaAgentKey(json);
                              try {
                                const parsed = JSON.parse(json);
                                setStorachaAgentDid(parsed.id || "");
                              } catch {}
                              localStorage.setItem(
                                "storacha-agent-key",
                                encryptStoracha(json)
                              );
                              // Ajoute cette ligne pour afficher le Space DID
                              const spaceDid = decryptStoracha(
                                localStorage.getItem("storacha-space-did") || ""
                              );
                              setStorachaSpaceDid(spaceDid);
                              showToast("Agent Storacha chargé !", "success");
                            } else {
                              showToast(
                                "Aucun agent Storacha trouvé à charger.",
                                "error"
                              );
                            }
                          }}
                        >
                          Charger l'Agent Storacha
                        </button>
                      )}
                      <input
                        className="w-[220px] mx-auto block mt-[4px] mb-[2px] p-[2px] rounded-[10px] text-[#030121]"
                        placeholder="Agent Key"
                        value={storachaAgentKey}
                        readOnly
                      />
                      {storachaAgentKey && (
                        <div className="text-[10px] text-[#ffde59] mt-[2px] break-all">
                          DID courant : {storachaAgentDid}
                          <br />
                          {storachaSpaceDid && (
                            <>Space DID : {storachaSpaceDid}</>
                          )}
                        </div>
                      )}
                      <div className="flex gap-[2px] mt-[6px]">
                        <button
                          className="flex-1 bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                          onClick={handleStorachaSubmit}
                        >
                          Valider
                        </button>
                        <button
                          className="flex-1 bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                          onClick={() => setShowStorachaModal(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Arweave */}
                  <div
                    className={`flex items-center gap-[4px] p-[4px] py-[1px] rounded-[10px] border border-[#900090] cursor-pointer ${
                      isArweaveConnected ? "bg-[#05ff01]/80" : "bg-[#ffbc3f]/80"
                    }`}
                    title={
                      isArweaveConnected
                        ? "Arweave connecté"
                        : "Connecter Arweave"
                    }
                  >
                    <span
                      className="text-[10px] cursor-pointer"
                      onClick={() => setShowArweaveModal(true)}
                      title="Configurer Arweave"
                    >
                      <img
                        src={arweaveLogo}
                        alt="Arweave"
                        className="w-[16px] h-[16px] mr-[2px] align-middle inline-block"
                      />
                    </span>
                    <span
                      className="flex-1 font-medium text-[14px] text-[#030121] cursor-pointer"
                      onClick={() => setShowArweaveModal(true)}
                      title="Configurer Arweave"
                    >
                      Arweave
                    </span>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isArweaveConnected
                          ? "bg-gray-200 text-green-700 cursor-not-allowed"
                          : "bg-[#05ff01] text-[#030121] hover:bg-[#03d100]"
                      }`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const walletPath = localStorage.getItem(
                          "arweave-wallet-path"
                        );
                        if (walletPath) {
                          // Wallet déjà enregistré, on recharge et on connecte sans ouvrir le modal
                          await handleReconnectArweave();
                        } else {
                          // Aucun wallet, on ouvre le modal pour configurer
                          await handleConnectArweave();
                        }
                      }}
                      disabled={isArweaveConnected}
                      title="Connecter Arweave"
                    >
                      ✅
                    </button>
                    <button
                      className={`px-[1px] py-[1px] rounded-[12px] font-bold text-[8px] ${
                        isArweaveConnected
                          ? "bg-[#ffbc3f] text-[#f0f0f0] hover:bg-[#ffde59]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isArweaveConnected) {
                          handleDisconnectArweave();
                        }
                      }}
                      disabled={!isArweaveConnected}
                      title="Déconnecter"
                    >
                      🛑
                    </button>
                  </div>
                  {showArweaveModal && (
                    <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[12px] border border-[#900090] space-y-[3px]">
                      <h4 className="text-[#FFDE59] mb-[4px]">
                        Connexion Arweave
                      </h4>
                      <div className="mb-[6px] text-[10px] text-gray-400 leading-relaxed">
                        <b>Comment connecter Arweave à HyperBox&nbsp;?</b>
                        <br />
                        1.{" "}
                        <b>
                          Créez votre wallet sur&nbsp;
                          <a
                            onClick={() =>
                              window.electronAPI?.openArweaveWalletWindow?.(
                                "https://arweave.app/"
                              )
                            }
                            rel="noopener noreferrer"
                            className="text-[#FFDE59] underline cursor-pointer"
                          >
                            arweave.app
                          </a>
                        </b>{" "}
                        et sauvegardez bien la <b>seed phrase</b> et le{" "}
                        <b>Backup Keyfile (.json)</b>.<br />
                        2. Importez le fichier <b>arweave-key.json</b>{" "}
                        ci-dessous.
                        <br />
                        3. Validez pour activer la sauvegarde décentralisée.
                        <br />
                        <span className="text-[#FFDE59]">
                          Votre adresse publique Arweave sera affichée
                          automatiquement.
                        </span>
                        <button
                          className="w-full my-[2px] p-[1px] rounded-[10px] bg-[#FFDE59] text-[#030121] font-bold mt-[4px]"
                          onClick={() =>
                            window.electronAPI?.openArweaveWalletWindow?.(
                              "https://arweave.app/"
                            )
                          }
                        >
                          Ouvrir arweave.app (créer un wallet)
                        </button>
                        <button
                          className="w-full my-[2px] p-[1px] rounded-[10px] bg-[#FFDE59] text-[#030121] font-bold"
                          onClick={handleImportArweaveWallet}
                        >
                          Importer mon Backup Keyfile (.json)
                        </button>
                        {arweaveWallet && (
                          <div className="text-[#05ff01] text-[10px] mt-[1px]">
                            Fichier importé :{" "}
                            <b>{arweaveWalletFileName || "arweave-key.json"}</b>
                          </div>
                        )}
                        <div className="flex gap-[2px] mt-[6px]">
                          <button
                            className="flex-[1px] bg-[#05ff01] text-[#030121] rounded-[10px] px-[2px] py-[1px]"
                            onClick={handleArweaveSubmit}
                            disabled={!arweaveWallet}
                          >
                            Valider
                          </button>
                          <button
                            className="flex-[1px] bg-[#ff0000] text-[#f0f0f0] rounded-[10px] px-[2px] py-[1px]"
                            onClick={() => setShowArweaveModal(false)}
                          >
                            Annuler
                          </button>
                        </div>
                        <div className="text-[10px] text-gray-400 leading-relaxed my-[6px]">
                          <b>
                            ℹ️ Pour utiliser Arweave, vous devez posséder des
                            jetons AR sur votre wallet.
                          </b>
                          <br />
                          Les frais d’upload sont payés en AR.
                          <br />
                          Si votre wallet est vide, l’upload échouera.
                          <br />
                          Vous pouvez acheter des AR facilement via Transak :
                          <br />
                          <button
                            className="w-full flex items-center justify-center gap-[2px] bg-gradient-to-r from-[#030121] to-[#6600ff] border border-[#FFDE59] mt-[8px] p-[6px] rounded-[10px] text-[#FFDE59] font-bold shadow hover:from-[#6600FF] hover:to-[#7f5fff] transition cursor-pointer"
                            onClick={() =>
                              window.electronAPI?.openTransakWindow?.(
                                `https://global.transak.com?apiKey=${transakApiKey}&cryptoCurrencyCode=AR&themeColor=%23030121&defaultCryptoCurrency=AR&network=arweave&walletAddress=${arweaveAddress}`
                              )
                            }
                          >
                            <img
                              src="https://www.google.com/s2/favicons?sz=64&domain_url=dashboard.transak.com"
                              alt="Transak"
                              className="w-[24px] h-[24px] mr-[2px]"
                            />
                            Acheter des AR (Arweave)
                          </button>
                        </div>
                        {isArweaveConnected && arweaveAddress && (
                          <div className="text-[#FFDE59] text-[14px]">
                            <b>Adresse publique Arweave :</b>
                            <input
                              className="w-[220px] mx-auto block my-[4px] p-[2px] rounded-[10px] text-[#030121]"
                              placeholder="Adresse Arweave"
                              readOnly
                              value={arweaveAddress}
                            />
                            <a
                              href={`https://viewblock.io/arweave/address/${arweaveAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Voir sur ViewBlock
                            </a>
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-[2px] mb-[4px]">
                          <b>A Savoir :</b> Vous gardez le contrôle total sur
                          vos données. HyperBox ne stocke jamais votre seed
                          phrase ni votre clé privée, tout reste sur votre
                          ordinateur.
                        </div>
                      </div>
                      {arweaveWalletValid === false && (
                        <div className="text-[#ff0000] text-[10px] mt-[2px]">
                          Wallet invalide ou non supporté.
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-gray-400 text-[10px]">
                    Synchronisation automatique de la configuration et des
                    sauvegardes avec le cloud
                  </span>
                </div>
              </div>
              {/* Sauvegarde automatique */}
              <div>
                <label
                  htmlFor="backup-freq-select"
                  className="block text-[12px] font-bold text-[#FFDE59] mb-[2px]"
                >
                  ⏱️ Sauvegarde automatique
                </label>
                <select
                  id="backup-freq-select"
                  value={backupFreq}
                  onChange={(e) =>
                    setBackupFreq(
                      e.target.value as "never" | "now" | "daily" | "weekly"
                    )
                  }
                  className="bg-[#000000] border border-[#FFDE59] rounded-[8px] text-[12px] px-[2px] py-[1px] text-[#F0F0F0]"
                  title="Fréquence de sauvegarde automatique"
                >
                  <option value="never">Jamais</option>
                  <option value="now">Maintenant</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdo</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 🚀 PERFORMANCE */}
        <div>
          <SectionHeader
            icon="🚀"
            title="Performance"
            sectionKey="performance"
            isOpen={openSections.performance}
          />

          {openSections.performance && (
            <div className="mt-[3px] p-[4px] bg-gray-900 rounded-[8px] border border-gray-700">
              <div className="space-y-[3px]">
                <div className="text-[14px] text-gray-400">
                  🚧 Section en cours de développement...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ℹ️ À PROPOS */}
        <div>
          <SectionHeader
            icon="ℹ️"
            title="À Propos"
            sectionKey="about"
            isOpen={openSections.about}
          />

          {openSections.about && (
            <div className="mt-[3px] p-[6px] bg-gray-900 rounded-[8px] border border-gray-700">
              <div className="space-y-[3px]">
                <div className="text-center">
                  <h4 className="font-bold text-[#FFDE59]">HyperBox</h4>
                  <p className="text-[14px] text-gray-400">Version 1.0.0</p>
                  <p className="text-[14px] text-gray-500 mt-[2px]">
                    Gestionnaire d'applications personnalisable
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton Fermer */}
      <div className="flex justify-end mt-[6px] pt-[4px] border-t border-[#FFDE59]">
        <button
          onClick={() => {
            console.log("onClose appelé");
            onClose();
          }}
          className="px-[4px] py-[2px] bg-[#FF0000] text-[#f0f0f0] rounded-[12px] hover:bg-[#e9383f] transition-colors duration-200 font-medium"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
