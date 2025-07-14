// src/types/electron.api.d.ts :
export {};

declare global {
  interface Window {
    electronAPI: {
      // === COMMUNICATION DE BASE ===
      send?: (channel: string, data: any) => void;
      receive?: (channel: string, func: (...args: any[]) => void) => void;

      // === CONFIGURATION ===
      loadConfig: () => Promise<any>;
      getConfig?: () => Promise<any>;
      saveConfig: (data: any) => Promise<void>;
      minimizeApp: () => void;
      maximizeApp: () => void;
      closeApp: () => void;
      toggleDevTools: () => void;
      forceReload: () => void;
      reload: () => void;
      getConfigPath: () => Promise<string>;
      exportConfig: () => Promise<boolean>;
      importConfig: () => Promise<boolean>;
      createDefaultStructure: (categories: any) => Promise<{
        success: boolean;
        rootPath?: string;
        error?: string;
      }>;
      scanAppsStructure: () => Promise<any>;
      saveAppsStructureToFile: (
        appsRoot: string,
        savePath: string
      ) => Promise<void>;
      saveAppsStructureToFile: (
        appsRoot: string,
        savePath: string
      ) => Promise<{ success: boolean; error?: string }>;
      backupHyperboxFolder: (
        sourcePath: string,
        destPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      saveHyperboxsav: (
        categories: any,
        installPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      regenerateHyperboxStructure: (
        categories: any,
        projectRoot: string,
        installPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      getUserConfig: () => Promise<any>;
      zipHyperBoxSav: (installPath: string) => Promise<string>;
      writeAgentFile: (
        filePath: string,
        content: string
      ) => Promise<{ success: boolean; error?: string }>;
      selectFile: (
        options?: any
      ) => Promise<{ name: string; path: string; icon: string } | null>;

      // === GESTION CLOUD ===
      onOAuthCode: (
        callback: (data: { provider: string; code: string }) => void
      ) => void;
      // === AUTHENTIFICATION GOOGLE DRIVE ===
      connectGoogleDrive: () => Promise<{
        success: boolean;
        alreadyConnected?: boolean;
        error?: string;
      }>;
      openGoogleAuthWindow: () => Promise<{
        success: boolean;
        code?: string;
        error?: string;
      }>;
      finalizeGoogleDriveAuth: (
        code: string
      ) => Promise<{ success: boolean; error?: string; token?: string }>;
      exportConfigToGoogleDrive: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportAppsStructureToGoogleDrive: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportFileToGoogleDrive: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      // === AUTHENTIFICATION ONE DRIVE ===
      connectOneDrive: () => Promise<{
        success: boolean;
        code?: string;
        alreadyConnected?: boolean;
        error?: string;
      }>;
      openOneDriveAuthWindow: () => Promise<{
        success: boolean;
        code?: string;
        error?: string;
      }>;
      finalizeOneDriveAuth: (
        code: string
      ) => Promise<{ success: boolean; error?: string; token?: string }>;
      exportConfigToOneDrive: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportAppsStructureToOneDrive: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportFileToOneDrive: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      // === AUTHENTIFICATION DROPBOX ===
      connectDropbox: () => Promise<{
        success: boolean;
        code?: string;
        alreadyConnected?: boolean;
        error?: string;
      }>;
      openDropboxAuthWindow: () => Promise<{
        success: boolean;
        code?: string;
        error?: string;
      }>;
      finalizeDropboxAuth: (code: string) => Promise<{
        success: boolean;
        error?: string;
        token?: string;
        code?: string;
      }>;
      exportConfigToDropbox: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportAppsStructureToDropbox: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportFileToDropbox: (
        filePath: string,
        filename: string
      ) => Promise<{ success: boolean; error?: string }>;
      // === AUTHENTIFICATION STORJ ===
      connectStorj: () => Promise<{
        success: boolean;
        alreadyConnected?: boolean;
        error?: string;
      }>;
      validateStorjCredentials: (
        accessKey: string,
        secretKey: string,
        bucket: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportConfigToStorj: (
        filePath: string,
        filename: string,
        accessKey: string,
        secretKey: string,
        bucket: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportAppsStructureToStorj: (
        filePath: string,
        filename: string,
        accessKey: string,
        secretKey: string,
        bucket: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportFileToStorj: (
        filePath: string,
        filename: string,
        accessKey: string,
        secretKey: string,
        bucket: string
      ) => Promise<{ success: boolean; error?: string }>;
      saveStorjCredentials(
        accessKey: string,
        secretKey: string,
        bucket: string
      ): Promise<{ success: boolean; filePath?: string; error?: string }>;
      getStorjCredentials(): Promise<{
        accessKey: string;
        secretKey: string;
        bucket: string;
      } | null>;
      // === AUTHENTIFICATION STORACHA ===
      connectStoracha: () => Promise<{
        spaceDid: string;
        agentKey: string;
      } | null>;
      validateStorachaCredentials?: (
        agentKey: string,
        spaceDid: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportConfigToStoracha: (
        filePath: string,
        filename: string,
        agentKey: string,
        spaceDid: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportAppsStructureToStoracha: (
        filePath: string,
        filename: string,
        agentKey: string,
        spaceDid: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportFileToStoracha: (
        filePath: string,
        filename: string,
        agentKey: string,
        spaceDid: string
      ) => Promise<{ success: boolean; error?: string }>;
      generateStorachaAgent: () => Promise<{
        exported: any;
        did: string;
        agentPath: string;
        agentExport: boolean;
      }>;
      deleteStorachaAgentFile?: () => Promise<void>;
      getStorachaAgentFile: () => Promise<string | null>; // Ajout de la méthode pour récupérer le fichier agent Storacha
      getStorachaAgentFile;
      // === AUTHENTIFICATION ARWEAVE ===
      connectArweave: () => Promise<{
        success: boolean;
        alreadyConnected?: boolean;
        error?: string;
      }>;
      openArweaveAuthWindow: () => Promise<{
        success: boolean;
        code?: string;
        error?: string;
      }>;
      finalizeArweaveAuth: (
        code: string
      ) => Promise<{ success: boolean; error?: string }>;

      validateArweaveWallet: (
        walletJson: string
      ) => Promise<{ success: boolean; error?: string }>;
      uploadToArweave: (
        filePath: string,
        walletPath: string
      ) => Promise<string>;
      downloadFromArweave: (
        transactionId: string,
        destinationPath: string
      ) => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
      }>;
      importArweaveWallet: (walletJson: any) => Promise<string>;
      getArweaveAddress: (walletJson: string) => Promise<string>;
      generateArweaveWallet: () => Promise<string>;
      exportConfigToArweave: (
        filePath: string,
        filename: string,
        walletPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportAppsStructureToArweave: (
        filePath: string,
        filename: string,
        walletPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      exportFileToArweave: (
        filePath: string,
        filename: string,
        walletPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      getMoonPayApiKey: () => Promise<string>;
      getTransakApiKey: () => Promise<string>;
      openTransakWindow: (url: string) => Promise<void>;
      openArweaveWalletWindow: (url: string) => Promise<void>;

      // === OUVERTURE EXTERNE ===
      openExternal: (url: string) => void;

      // === GESTION FICHIERS/DOSSIERS ===
      openFile: (filePath: string) => Promise<void>;
      saveFile: (srcPath: string, filename: string) => Promise<string>;
      listDir: (path: string) => Promise<
        Array<{
          name: string;
          path: string;
          isDirectory: boolean;
          isFile: boolean;
          ext: string;
        }>
      >;
      create: (
        type: "file" | "folder",
        path: string,
        name: string
      ) => Promise<void>;
      rename: (oldPath: string, newPath: string) => Promise<void>;
      delete: (targetPath: string) => Promise<void>;
      move: (srcPath: string, filename?: string) => Promise<string>;
      copy: (srcPath: string, destPath: string) => Promise<void>;
      fsMove: (args: { srcPath: string; destPath: string }) => Promise<void>;

      // === CONTENU FICHIERS ===
      getFileContent: (filePath: string) => Promise<string>;
      getFileContentFromUrl?: (url: string) => Promise<string>;
      getFileContentFromPath?: (filePath: string) => Promise<string>;

      // === ICÔNES ===
      getFileIcon: (filePath: string) => Promise<string>;
      getFileIconFromUrl: (url: string) => Promise<string>;
      getFileIconFromPath?: (filePath: string) => Promise<any>;

      // === NOMS ET CHEMINS ===
      getAppNameFromPath: (appPath: string) => string;
      getShortNameFromUrl: (url: string) => string;
      getFileNameFromPath: (filePath: string) => string;
      getFolderPathFromCurrentPath: any;
      joinPath: (dir: string, filename: string) => string;
      getUserDataPath: () => Promise<string>;
      isDirectory: (filePath: string) => Promise<boolean>;

      // === SÉLECTEURS NATIFS ===
      selectFolder: () => Promise<{
        name: string;
        path: string;
        icon: string;
      } | null>;
      selectApp: () => Promise<{
        name: string;
        path: string;
        icon: string;
      } | null>;
      selectFile?: (
        options?: any
      ) => Promise<{ name: string; path: string; icon: string } | null>;
      selectAllFilesInFolder?: (folderPath: string) => Promise<
        Array<{
          name: string;
          path: string;
          icon: string;
          type?: string;
        }>
      >;
      getItemsInSelectionBox: (
        selectionBox: {
          left: number;
          top: number;
          width: number;
          height: number;
        },
        items: any[]
      ) => Promise<
        Array<{
          name: string;
          path: string;
          icon: string;
          type?: string;
        }>
      >;

      // === INFORMATIONS DISQUE ===
      getDiskInfo: (path: string) => Promise<{
        freeSpace: string;
        usedSpace: string;
        totalSize: string;
      }>;
      countAppsInFolder: (path: string) => Promise<number>;

      // === GESTION DOSSIERS ===
      openFolder: (path: string) => Promise<void>;
      createFolder: (path: string) => Promise<boolean>;
      transferFolder: (
        sourcePath: string,
        destinationPath: string
      ) => Promise<{
        success: boolean;
        newPath?: string;
        error?: string;
      }>;
      deleteFolder: (path: string) => Promise<void>;

      // === GESTION APPLICATIONS ===
      moveAppToHyperBox: (
        sourcePath: string,
        destinationPath: string
      ) => Promise<{
        success: boolean;
        newPath?: string;
        error?: string;
      }>;
      createShortcut: (
        targetPath: string,
        shortcutPath: string
      ) => Promise<{
        success: boolean;
        shortcutPath?: string;
        error?: string;
      }>;
      moveAppWithProgress: (
        sourcePath: string,
        destinationPath: string,
        progressCallback: (progress: number, status: string) => void
      ) => Promise<{ success: boolean; newPath?: string; error?: string }>;

      // === STRUCTURE HYPERBOX ===
      getAppPath: () => string;
      createHyperBoxStructure: () => Promise<{
        success: boolean;
        rootPath?: string;
        error?: string;
      }>;
      formatBytes: (bytes: number) => string;
    };
  }
}
