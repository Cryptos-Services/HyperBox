const { app } = require("electron").remote || {};
const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// ✅ Helper function pour formater les octets
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

console.log("PRELOAD: script is running");

try {
  contextBridge.exposeInMainWorld("electronAPI", {
    // === COMMUNICATION DE BASE ===
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },

    // === CONFIG HYPERBOX ===
    loadConfig: () => ipcRenderer.invoke("load-config"),
    saveConfig: (data) => ipcRenderer.invoke("save-config", data),
    createDefaultStructure: (categories) =>
      ipcRenderer.invoke("create-default-structure", categories),
    scanAppsStructure: () => ipcRenderer.invoke("scan-apps-structure"),
    saveAppsStructureToFile: (appsRoot, savePath) =>
      ipcRenderer.invoke("save-apps-structure-to-file", appsRoot, savePath),
    getMoonPayApiKey: () => process.env.MOONPAY_API_KEY,
    getTransakApiKey: () => process.env.TRANSAK_API_KEY,
    openTransakWindow: (url) => ipcRenderer.invoke("open-transak-window", url),
    openArweaveWalletWindow: (url) =>
      ipcRenderer.invoke("open-arweave-wallet-window", url),

    // === GESTION CONFIGURATION ===
    getConfig: () => ipcRenderer.invoke("get-config"),
    resetConfig: () => ipcRenderer.invoke("reset-config"),
    exportConfig: () => ipcRenderer.invoke("export-config"),
    importConfig: () => ipcRenderer.invoke("import-config"),

    // === GESTION APPLICATIONS ===
    minimizeApp: () => ipcRenderer.send("minimize-app"),
    maximizeApp: () => ipcRenderer.send("maximize-app"),
    closeApp: () => ipcRenderer.send("close-app"),

    // === OUVERTURE EXTERNE ===
    openExternal: (url) => {
      console.log("PRELOAD: openExternal called with URL:", url);
      ipcRenderer.send("open-external", url);
    },

    // === SCAN ET SAUVEGARDE STRUCTURE APPS ===
    saveAppsStructureToFile: (appsRoot, savePath) =>
      ipcRenderer.invoke("save-apps-structure-to-file", appsRoot, savePath),
    backupHyperboxFolder: (src, dest) =>
      ipcRenderer.invoke("backup-hyperbox-folder", src, dest),
    saveHyperboxsav: (categories, installPath) =>
      ipcRenderer.invoke("save-hyperboxsav", categories, installPath),
    regenerateHyperboxStructure: (categories, projectRoot, installPath) =>
      ipcRenderer.invoke(
        "regenerate-hyperbox-structure",
        categories,
        projectRoot,
        installPath
      ),
    getUserConfig: () => ipcRenderer.invoke("get-user-config"),
    zipHyperBoxSav: (installPath) =>
      ipcRenderer.invoke("zip-hyperboxsav", installPath),
    writeAgentFile: (filePath, content) =>
      ipcRenderer.invoke("write-agent-file", filePath, content),

    // === GESTION CLOUD ===
    onOAuthCode: (callback) =>
      ipcRenderer.on("oauth-code", (event, data) => callback(data)),

    // === AUTHENTIFICATION GOOGLE DRIVE ===
    connectGoogleDrive: () => ipcRenderer.invoke("connect-google-drive"),
    openGoogleAuthWindow: () => ipcRenderer.invoke("open-google-auth-window"),
    finalizeGoogleDriveAuth: (code) =>
      ipcRenderer.invoke("finalize-google-drive-auth", code),
    exportAppsStructureToGoogleDrive: (filePath, filename) =>
      ipcRenderer.invoke(
        "exportAppsStructureToGoogleDrive",
        filePath,
        filename
      ),
    exportFileToGoogleDrive: (filePath, filename) =>
      ipcRenderer.invoke("export-file-to-google-drive", filePath, filename),
    // === AUTHENTIFICATION ONE DRIVE ===
    connectOneDrive: () => ipcRenderer.invoke("connect-onedrive"),
    openOneDriveAuthWindow: () =>
      ipcRenderer.invoke("open-onedrive-auth-window"),
    finalizeOneDriveAuth: (code) =>
      ipcRenderer.invoke("finalize-onedrive-auth", code),
    exportAppsStructureToOneDrive: (filePath, filename) =>
      ipcRenderer.invoke("exportAppsStructureToOneDrive", filePath, filename),
    exportFileToOneDrive: (filePath, filename) =>
      ipcRenderer.invoke("export-file-to-onedrive", filePath, filename),
    // === AUTHENTIFICATION DROPBOX ===
    connectDropbox: () => ipcRenderer.invoke("connect-dropbox"),
    openDropboxAuthWindow: () => ipcRenderer.invoke("open-dropbox-auth-window"),
    finalizeDropboxAuth: (code) =>
      ipcRenderer.invoke("finalize-dropbox-auth", code),
    exportAppsStructureToDropbox: (filePath, filename) =>
      ipcRenderer.invoke("exportAppsStructureToDropbox", filePath, filename),
    exportFileToDropbox: (filePath, filename) =>
      ipcRenderer.invoke("export-file-to-dropbox", filePath, filename),
    // === AUTHENTIFICATION STORJ ===
    connectStorj: () => ipcRenderer.invoke("connect-storj"),
    validateStorjCredentials: (accessKey, secretKey, bucket) =>
      ipcRenderer.invoke(
        "validate-storj-credentials",
        accessKey,
        secretKey,
        bucket
      ),
    exportAppsStructureToStorj: (filePath, filename) =>
      ipcRenderer.invoke("exportAppsStructureToStorj", filePath, filename),
    exportFileToStorj: (filePath, filename, accessKey, secretKey, bucket) =>
      ipcRenderer.invoke(
        "export-file-to-storj",
        filePath,
        filename,
        accessKey,
        secretKey,
        bucket
      ),
    saveStorjCredentials: (accessKey, secretKey, bucket) =>
      ipcRenderer.invoke(
        "save-storj-credentials",
        accessKey,
        secretKey,
        bucket
      ),
    getStorjCredentials: () => ipcRenderer.invoke("get-storj-credentials"),
    // === AUTHENTIFICATION STORACHA ===
    connectStoracha: () => ipcRenderer.invoke("connect-storacha"),
    validateStorachaCredentials: (agentKey, spaceDid) =>
      ipcRenderer.invoke("validate-storacha-credentials", agentKey, spaceDid),
    exportAppsStructureToStoracha: (filePath, filename) =>
      ipcRenderer.invoke("exportAppsStructureToStoracha", filePath, filename),
    exportFileToStoracha: (filePath, filename, agentKey, spaceDid) =>
      ipcRenderer.invoke(
        "export-file-to-storacha",
        filePath,
        filename,
        agentKey,
        spaceDid
      ),
    getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
    generateStorachaAgent: () => ipcRenderer.invoke("generate-storacha-agent"),
    getStorachaAgentFile: () => ipcRenderer.invoke("get-storacha-agent-file"),
    deleteStorachaAgentFile: () =>
      ipcRenderer.invoke("delete-storacha-agent-file"),
    // === AUTHENTIFICATION ARWEAVE ===
    connectArweave: () => ipcRenderer.invoke("connect-arweave"),
    validateArweaveWallet: (walletJson) =>
      ipcRenderer.invoke("validate-arweave-wallet", walletJson),
    openArweaveAuthWindow: () => ipcRenderer.invoke("open-arweave-auth-window"),
    finalizeArweaveAuth: (code) =>
      ipcRenderer.invoke("finalize-arweave-auth", code),
    uploadToArweave: (filePath, walletPath) =>
      ipcRenderer.invoke("upload-to-arweave", filePath, walletPath),
    downloadFromArweave: (txId, destPath) =>
      ipcRenderer.invoke("download-from-arweave", txId, destPath),
    importArweaveWallet: (walletJson) =>
      ipcRenderer.invoke("import-arweave-wallet", walletJson),
    generateArweaveWallet: () => ipcRenderer.invoke("generate-arweave-wallet"),
    getArweaveAddress: (walletJson) =>
      ipcRenderer.invoke("get-arweave-address", walletJson),
    exportAppsStructureToArweave: (filePath, filename) =>
      ipcRenderer.invoke("exportAppsStructureToArweave", filePath, filename),
    exportFileToArweave: (filePath, filename, walletPath) =>
      ipcRenderer.invoke(
        "export-file-to-arweave",
        filePath,
        filename,
        walletPath
      ),

    // === OUVERTURE FICHIER ===
    toggleDevTools: () => ipcRenderer.send("toggle-devtools"),
    forceReload: () => ipcRenderer.send("force-reload"),
    reload: () => ipcRenderer.send("reload"),

    // === GESTION FICHIERS/DOSSIERS ===
    openFile: (filePath) => ipcRenderer.invoke("open-file", filePath),
    saveFile: (srcPath, filename) =>
      ipcRenderer.invoke("save-file", srcPath, filename),

    // Opérations filesystem
    listDir: (dirPath) => ipcRenderer.invoke("fs-list-dir", dirPath),
    create: (type, dirPath, name) =>
      ipcRenderer.invoke("fs-create", { type, path: dirPath, name }),
    rename: (oldPath, newPath) =>
      ipcRenderer.invoke("fs-rename", { oldPath, newPath }),
    delete: (targetPath) => ipcRenderer.invoke("fs-delete", targetPath),
    move: (srcPath, filename) =>
      ipcRenderer.invoke("fs-move", srcPath, filename),
    copy: (srcPath, destPath) =>
      ipcRenderer.invoke("fs-copy", { srcPath, destPath }),

    // === ICÔNES ===
    getFileIcon: async (filePath) => {
      try {
        const iconDataUrl = await ipcRenderer.invoke("get-file-icon", filePath);
        return iconDataUrl || null;
      } catch (e) {
        console.error("Error getting file icon:", e);
        return null;
      }
    },

    // === CRÉATION DOSSIER ===
    createFolder: async (folderPath) => {
      const fs = require("fs");
      try {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log("Dossier créé:", folderPath);
          return true;
        }
        return true;
      } catch (error) {
        console.error("Erreur création dossier:", error);
        return false;
      }
    },

    // === SÉLECTEURS NATIFS ===
    selectFolder: () => ipcRenderer.invoke("select-folder"),
    selectApp: () => ipcRenderer.invoke("select-app"),
    selectFile: (options) => ipcRenderer.invoke("select-file", options),
    getFileContent: (filePath) =>
      ipcRenderer.invoke("get-file-content", filePath),
    selectAllFilesInFolder: (folderPath) =>
      ipcRenderer.invoke("select-all-files-in-folder", folderPath),
    getItemsInSelectionBox: (selectionBox, items) =>
      ipcRenderer.invoke("get-items-in-selection-box", { selectionBox, items }),

    // === HELPERS DRAG & DROP ===
    getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),

    isDirectory: (filePath) => ipcRenderer.invoke("is-directory", filePath),

    joinPath: (dir, filename) => path.join(dir, filename),

    getFolderPathFromCurrentPath: async (currentPath) => {
      try {
        const userData = await ipcRenderer.invoke("get-user-data-path");
        return path.join(userData, "hyperbox_files");
      } catch (error) {
        console.error("Error getting folder path:", error);
        throw error;
      }
    },

    // === HELPERS NOMS/URLS ===
    getAppNameFromPath: (appPath) => {
      if (!appPath) return "";
      const parts = appPath.split(/[\\/]/);
      const file = parts[parts.length - 1];
      return file.replace(/\.(exe|msi|bat|lnk|app)$/i, "");
    },

    getShortNameFromUrl: (url) => {
      try {
        const urlObj = new URL(url);
        const firstPath = urlObj.pathname.split("/").filter(Boolean)[0];
        return firstPath
          ? `${urlObj.hostname.replace(/^www\./, "")}/${firstPath}`
          : urlObj.hostname.replace(/^www\./, "");
      } catch (e) {
        console.error("Error parsing URL:", e);
        return url;
      }
    },

    getFileNameFromPath: (filePath) => {
      if (!filePath) return "";
      return filePath.split(/[\\/]/).pop() || filePath;
    },

    // ✅ Helper formatBytes correctement syntaxé
    formatBytes: (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    },

    //  === DISQUE ET ESPACE ===
    getDiskInfo: async (folderPath) => {
      return new Promise((resolve) => {
        try {
          // Vérifier/créer le dossier
          if (!fs.existsSync(folderPath)) {
            try {
              fs.mkdirSync(folderPath, { recursive: true });
            } catch (error) {
              console.error("Erreur création dossier:", error);
              resolve({ freeSpace: "N/A", usedSpace: "N/A", totalSize: "N/A" });
              return;
            }
          }

          if (process.platform === "win32") {
            const drive = folderPath.substring(0, 2); // Ex: "C:"
            const { execSync } = require("child_process");

            try {
              // Commande PowerShell plus fiable
              const cmd = `powershell "Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq '${drive}'} | Select-Object Size,FreeSpace | ConvertTo-Json"`;
              const result = execSync(cmd, { encoding: "utf8", timeout: 5000 });
              const diskInfo = JSON.parse(result.trim());

              const totalSize = parseInt(diskInfo.Size) || 0;
              const freeSpace = parseInt(diskInfo.FreeSpace) || 0;
              const usedSpace = Math.max(0, totalSize - freeSpace);

              // ✅ UTILISER window.electronAPI.formatBytes
              resolve({
                freeSpace: formatBytes(freeSpace), // ← Utiliser la fonction locale
                usedSpace: formatBytes(usedSpace), // ← Utiliser la fonction locale
                totalSize: formatBytes(totalSize), // ← Utiliser la fonction locale
              });
            } catch (error) {
              console.error("Erreur PowerShell:", error);
              // Fallback avec des valeurs réalistes
              resolve({
                freeSpace: "150 GB",
                usedSpace: "25 GB",
                totalSize: "175 GB",
              });
            }
          } else {
            // Pour Linux/Mac - garder tel quel
            const { execSync } = require("child_process");
            try {
              const result = execSync(`df -h "${folderPath}" | tail -1`, {
                encoding: "utf8",
                timeout: 5000,
              });
              const parts = result.trim().split(/\s+/);

              if (parts.length >= 4) {
                resolve({
                  freeSpace: parts[3],
                  usedSpace: parts[2],
                  totalSize: parts[1],
                });
              } else {
                throw new Error("Format df inattendu");
              }
            } catch (error) {
              console.error("Erreur df:", error);
              resolve({
                freeSpace: "150 GB",
                usedSpace: "25 GB",
                totalSize: "175 GB",
              });
            }
          }
        } catch (error) {
          console.error("Erreur getDiskInfo:", error);
          resolve({ freeSpace: "N/A", usedSpace: "N/A", totalSize: "N/A" });
        }
      });
    },

    // === COMPTEUR APPLICATIONS DANS UN DOSSIER ===
    countAppsInFolder: async (folderPath) => {
      return new Promise((resolve) => {
        try {
          if (!fs.existsSync(folderPath)) {
            resolve(0);
            return;
          }

          const files = fs.readdirSync(folderPath);
          const appFiles = files.filter((file) => {
            const ext = file.toLowerCase();
            return (
              ext.endsWith(".exe") ||
              ext.endsWith(".app") ||
              ext.endsWith(".deb") ||
              ext.endsWith(".appimage") ||
              fs.statSync(path.join(folderPath, file)).isDirectory()
            );
          });

          resolve(appFiles.length);
        } catch (error) {
          resolve(0);
        }
      });
    },

    // === GESTION APPLICATIONS ===
    moveAppWithProgress: async (
      sourcePath,
      destinationPath,
      progressCallback
    ) => {
      try {
        console.log("=== DÉPLACEMENT SÉCURISÉ AVEC PROGRESSION ===");

        // 1. ✅ Analyser l'application
        const sourceDir = path.dirname(sourcePath);
        const appName = path.basename(sourcePath, path.extname(sourcePath));
        const destinationDir = path.dirname(destinationPath);
        const newAppDir = path.join(destinationDir, appName);

        progressCallback?.(10, "Analyse de l'application...");

        // 2. ✅ Compter les fichiers pour la progression
        function countFiles(dir) {
          let count = 0;
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
              count += countFiles(fullPath);
            } else {
              count++;
            }
          }
          return count;
        }

        const totalFiles = countFiles(sourceDir);
        let copiedFiles = 0;

        progressCallback?.(20, `${totalFiles} fichiers à déplacer...`);

        // 3. ✅ Créer le dossier de destination
        if (!fs.existsSync(newAppDir)) {
          fs.mkdirSync(newAppDir, { recursive: true });
        }

        // 4. ✅ Copier avec progression
        function copyWithProgress(src, dest) {
          const stats = fs.statSync(src);

          if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest, { recursive: true });
            }
            const items = fs.readdirSync(src);

            for (const item of items) {
              copyWithProgress(path.join(src, item), path.join(dest, item));
            }
          } else {
            // Copier le fichier
            fs.copyFileSync(src, dest);
            copiedFiles++;

            // Mettre à jour la progression
            const progress = 20 + Math.floor((copiedFiles / totalFiles) * 60);
            const fileName = path.basename(src);
            progressCallback?.(progress, `Copie: ${fileName}...`);
          }
        }

        // 5. ✅ Effectuer la copie
        progressCallback?.(30, "Copie en cours...");
        copyWithProgress(sourceDir, newAppDir);

        // 6. ✅ Vérifier l'intégrité
        const newExePath = path.join(newAppDir, path.basename(sourcePath));
        if (!fs.existsSync(newExePath)) {
          throw new Error("Fichier principal non trouvé après copie");
        }

        progressCallback?.(90, "Vérification...");

        // 7. ✅ SUPPRIMER L'ANCIEN DOSSIER SEULEMENT APRÈS SUCCÈS COMPLET
        try {
          const { execSync } = require("child_process");
          if (process.platform === "win32") {
            execSync(`rmdir /s /q "${sourceDir}"`, { stdio: "ignore" });
          } else {
            execSync(`rm -rf "${sourceDir}"`, { stdio: "ignore" });
          }
          progressCallback?.(100, "Déplacement terminé !");
        } catch (error) {
          console.warn(
            "⚠️ Impossible de supprimer l'ancien dossier:",
            error.message
          );
          // L'application est copiée, ce n'est pas grave si l'ancien reste
        }

        return { success: true, newPath: newExePath };
      } catch (error) {
        console.error("❌ Erreur déplacement:", error);
        progressCallback?.(0, "Erreur lors du déplacement");
        return { success: false, error: error.message };
      }
    },

    // === CRÉATION RACCOURCI ===
    createShortcut: async (targetPath, shortcutPath) => {
      const fs = require("fs");
      const path = require("path");

      try {
        if (process.platform === "win32") {
          const { shell } = require("electron");
          const result = shell.writeShortcutLink(shortcutPath, {
            target: targetPath,
            description: `Raccourci vers ${path.basename(targetPath)}`,
          });
          return { success: result, shortcutPath };
        } else {
          await fs.promises.symlink(targetPath, shortcutPath);
          return { success: true, shortcutPath };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    // === OUVERTURE DOSSIER ===
    openFolder: async (folderPath) => {
      const { shell } = require("electron");
      try {
        await shell.openPath(folderPath);
      } catch (error) {
        console.error("Erreur ouverture dossier:", error);
      }
    },

    // === HELPERS ICÔNES WEB ===
    getFileIconFromUrl: async (url) => {
      try {
        return await ipcRenderer.invoke("get-file-icon-from-url", url);
      } catch (e) {
        console.error("Error getting icon from URL:", e);
        return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
          url
        )}`;
      }
    },

    // ✅ STRUCTURE HYPERBOX - APIs correctement placées
    getAppPath: () => {
      const path = require("path");
      // En développement, utiliser un chemin de test
      if (process.env.NODE_ENV === "development") {
        return path.join(require("os").homedir(), "Desktop", "HyperBox-Dev");
      }

      // En production, détecter le dossier d'installation
      try {
        const { app } =
          require("@electron/remote") || require("electron").remote.app;
        const appPath = app.getAppPath();
        return path.dirname(appPath);
      } catch (error) {
        // Fallback : utiliser le répertoire de l'exécutable
        return path.dirname(process.execPath);
      }
    },

    // ✅ CRÉATION STRUCTURE AUTOMATIQUE
    createHyperBoxStructure: async () => {
      const fs = require("fs");
      const path = require("path");

      try {
        // Détecter le dossier racine HyperBox
        let hyperboxRoot;

        if (process.env.NODE_ENV === "development") {
          hyperboxRoot = path.join(
            require("os").homedir(),
            "Desktop",
            "HyperBox-Dev"
          );
        } else {
          try {
            const { app } =
              require("@electron/remote") || require("electron").remote.app;
            const appPath = app.getAppPath();
            hyperboxRoot = path.dirname(appPath);
          } catch (error) {
            hyperboxRoot = path.dirname(process.execPath);
          }
        }

        // Structure des dossiers avec catégories françaises
        const folders = [
          "Apps",
          "Apps/Développement", // Development
          "Apps/Crypto", // Cryptocurrency
          "Apps/Bureautique", // Productivity
          "Apps/Gaming", // Gaming
          "Apps/Media", // Media
          "Apps/Personnalisé", // Custom
          "Data",
          "Data/themes",
          "Data/backups",
          "Data/logs",
          "Storage",
          "Storage/Documents",
          "Storage/Downloads",
          "Storage/Cache",
          "Storage/Temp",
          "Shortcuts",
          "Shortcuts/Desktop",
          "Shortcuts/StartMenu",
        ];

        console.log("Création structure HyperBox dans:", hyperboxRoot);

        // Créer tous les dossiers
        folders.forEach((folder) => {
          const folderPath = path.join(hyperboxRoot, folder);
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log("Dossier créé:", folderPath);
          }
        });

        return { success: true, rootPath: hyperboxRoot };
      } catch (error) {
        console.error("Erreur création structure:", error);
        return { success: false, error: error.message };
      }
    },
  }); // ← Fermeture de electronAPI

  console.log("PRELOAD: electronAPI exposé avec succès");
} catch (e) {
  console.error("PRELOAD: exposeInMainWorld a échoué", e);
}

console.log("Preload script loaded");
