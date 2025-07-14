const path = require("node:path");
const rootPath = path.resolve(__dirname, "..");
const appsRoot = path.join(rootPath, "HyperBoxSav");
const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  screen,
  dialog,
} = require("electron");
const fs = require("fs");
const open = require("open");
const http = require("http");
const url = require("url");
const axios = require("axios");
const callbackHtmlPath = path.join(__dirname, "../public/oauth/callback.html");
let html = fs.readFileSync(callbackHtmlPath, "utf8");
const { Web3Storage, File } = require("web3.storage");
const AWS = require("aws-sdk");
require("dotenv").config();
const { zipHyperBoxSav } = require("./main/createDefaultStructure");
const { google } = require("googleapis");
const TOKEN_PATH = path.join(
  app.getPath("userData"),
  "google_drive_token.json"
);
const DROPBOX_TOKEN_PATH = path.join(
  app.getPath("userData"),
  "dropbox_token.json"
);
const Arweave = require("arweave");
const configPath = path.join(app.getPath("userData"), "config.json");
const {
  scanFolderToStructure,
  saveAppsStructureToFile,
  copyFolderRecursiveAsync,
  saveHyperBoxStructureToInstallPath,
  regenerateHyperBoxStructure,
} = require("./main/createDefaultStructure");
const savePath = path.join(rootPath, "hyperbox-structure.json");
saveAppsStructureToFile(appsRoot, savePath);

if (require("electron-squirrel-startup")) app.quit();

console.log("Starting Electron app...");

function createWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workArea;
  const windowWidth = Math.floor(screenWidth * 0.4);
  const windowHeight = Math.floor(screenHeight * 0.5);

  const preloadPath = path.join(app.getAppPath(), "dist", "preload.js");
  const htmlPath = path.resolve(__dirname, "../dist/index.html");

  console.log("Electron version:", process.versions.electron);
  console.log("Node version:", process.versions.node);
  console.log("Chromium version:", process.versions.chrome);
  console.log(
    "PRELOAD PATH:",
    preloadPath,
    "Exists:",
    fs.existsSync(preloadPath)
  );
  console.log("HTML PATH:", htmlPath);

  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    x: 0,
    y: screenHeight - windowHeight,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(htmlPath);

  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isDevelopment) {
    // Mode développement - DevTools ouvert
    // mainWindow.webContents.openDevTools();
  } else {
    // Mode production - Menu avec raccourcis de debug
    const { Menu } = require("electron");
    const template = [
      {
        label: "HyperBox",
        submenu: [
          {
            label: "À propos de HyperBox",
            role: "about",
          },
          { type: "separator" },
          {
            label: "Quitter",
            accelerator: "CmdOrCtrl+Q",
            click: () => app.quit(),
          },
        ],
      },
      {
        label: "Affichage",
        submenu: [
          {
            label: "Actualiser",
            accelerator: "F5",
            click: () => mainWindow.reload(),
          },
          {
            label: "Forcer l'actualisation",
            accelerator: "CmdOrCtrl+F5",
            click: () => mainWindow.webContents.reloadIgnoringCache(),
          },
          { type: "separator" },
          {
            label: "Outils de développement",
            accelerator: "F12",
            click: () => mainWindow.webContents.toggleDevTools(),
          },
          { type: "separator" },
          {
            label: "Zoom avant",
            accelerator: "CmdOrCtrl+Plus",
            click: () => {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
            },
          },
          {
            label: "Zoom artier",
            accelerator: "CmdOrCtrl+-",
            click: () => {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
            },
          },
          {
            label: "Zoom normal",
            accelerator: "CmdOrCtrl+0",
            click: () => mainWindow.webContents.setZoomLevel(0),
          },
        ],
      },
    ];

    mainWindow.webContents.send("oauth-code", {
      provider: "google",
      code: "...",
    });

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Gestion des raccourcis clavier globaux
ipcMain.on("toggle-devtools", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.webContents.toggleDevTools();
});
ipcMain.on("force-reload", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.webContents.reloadIgnoringCache();
});
ipcMain.on("reload", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.reload();
});

// Gestion des raccourcis clavier pour la fenêtre principale
ipcMain.on("minimize-app", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});
ipcMain.on("maximize-app", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on("close-app", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

// Ouvre une URL externe (navigateur)
ipcMain.on("open-external", (event, url) => {
  shell.openExternal(url);
});

// Handler pour sauvegarder la structure Apps dans un fichier JSON
ipcMain.handle(
  "save-apps-structure-to-file",
  async (event, appsRoot, savePath) => {
    try {
      saveAppsStructureToFile(appsRoot, savePath);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
);

// Handler pour sauvegarder le dossier HyperBoxSav
ipcMain.handle("backup-hyperbox-folder", async (event, src, dest) => {
  try {
    await copyFolderRecursiveAsync(src, dest);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Handler pour sauvegarder la structure HyperBox
ipcMain.handle("save-hyperboxsav", async (event, categories, installPath) => {
  try {
    saveHyperBoxStructureToInstallPath(categories, installPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Handler pour sauvegarder la configuration utilisateur
ipcMain.handle("get-user-config", async () => {
  try {
    if (!fs.existsSync(configPath)) return { categories: [] };
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { categories: [] };
  }
});

// Handler pour régénérer la structure HyperBoxSav dans le projet et l'emplacement d'installation
ipcMain.handle(
  "regenerate-hyperbox-structure",
  async (event, categories, projectRoot, installPath) => {
    try {
      regenerateHyperBoxStructure(categories, projectRoot, installPath);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
);

// Handler pour zipper le dossier HyperBoxSav
ipcMain.handle("zip-hyperboxsav", async (event, installPath) => {
  try {
    const zipPath = zipHyperBoxSav(installPath);
    console.log("[DEBUG] zipHyperBoxSav retourne :", zipPath);
    return zipPath;
  } catch (e) {
    console.error("[DEBUG] zipHyperBoxSav erreur :", e);
    return null;
  }
});

// Création de la structure par défaut HyperBox
const {
  createDefaultHyperBoxStructure,
} = require("./main/createDefaultStructure");

ipcMain.handle("create-default-structure", async (event, categories) => {
  try {
    const rootPath = path.resolve(__dirname, "..");
    console.log("[HyperBox] create-default-structure appelé !");
    console.log("[HyperBox] Chemin racine utilisé :", rootPath);
    console.log(
      "[HyperBox] Catégories reçues :",
      JSON.stringify(categories, null, 2)
    );
    await createDefaultHyperBoxStructure(categories, rootPath);
    console.log("[HyperBox] Structure HyperBox générée !");
    return { success: true, rootPath };
  } catch (error) {
    console.error("[HyperBox] Erreur lors de la génération :", error);
    return { success: false, error: error.message };
  }
});

// Chargement/sauvegarde de la config HyperBox
ipcMain.handle("load-config", async () => {
  try {
    if (!fs.existsSync(configPath)) return { categories: [] };
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { categories: [] };
  }
});

// Scanne le dossier HyperBoxSav et crée la structure
ipcMain.handle("scan-apps-structure", async () => {
  const rootPath = path.resolve(__dirname, "..");
  const appsRoot = path.join(rootPath, "HyperBoxSav");
  return scanFolderToStructure(appsRoot);
});

// Assurez-vous que les variables d'environnement sont définies
const REDIRECT_URI = "http://localhost:5173/callback";

// Ouvre la fenêtre d'auth Google
ipcMain.handle("open-google-auth-window", async () => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });

  // Ouvre l'URL dans le navigateur par défaut
  shell.openExternal(authUrl);

  // Lance un serveur local pour recevoir le code
  return await new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      if (req.url.startsWith("/callback")) {
        const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
        const code = qs.get("code");
        const fs = require("fs");
        const path = require("path");
        const callbackHtmlPath = path.join(
          __dirname,
          "../public/oauth/callback.html"
        );
        const html = fs.readFileSync(callbackHtmlPath, "utf8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
        server.close();
        console.log("Code reçu dans le handler:", code);
        resolve({ success: true, code });
      }
    });
    server.listen(5173);
  });
});

// Fonction pour exporter un fichier vers Google Drive
ipcMain.handle(
  "exportAppsStructureToGoogleDrive",
  async (event, filePath, filename) => {
    // Utilise ta logique d'export Google Drive déjà existante
    return exportFileToGoogleDrive(filePath, filename); // à adapter selon ton code
  }
);

// Reçoit le code et échange contre un token
ipcMain.handle("finalize-google-drive-auth", async (event, code) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    // Ajoute le token dans la réponse :
    return { success: true, token: tokens.access_token };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle(
  "export-file-to-google-drive",
  async (event, filePath, filename) => {
    try {
      // 1. Authentification
      if (!fs.existsSync(TOKEN_PATH))
        throw new Error("Token Google Drive manquant !");
      const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "http://localhost:5173/callback"
      );
      oAuth2Client.setCredentials(tokens);

      // 2. Prépare le fichier à uploader
      const drive = google.drive({ version: "v3", auth: oAuth2Client });
      const fileMetadata = { name: filename };
      const media = {
        mimeType: "application/zip",
        body: fs.createReadStream(filePath),
      };

      // 3. Upload
      const res = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id",
      });

      return { success: true, fileId: res.data.id };
    } catch (e) {
      console.error("Erreur upload Google Drive:", e);
      return { success: false, error: e.message };
    }
  }
);

// Fonction utilitaire pour uploader un fichier sur Google Drive
async function exportFileToGoogleDrive(filePath, filename) {
  try {
    if (!fs.existsSync(TOKEN_PATH))
      throw new Error("Token Google Drive manquant !");
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:5173/callback"
    );
    oAuth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    // 1. Cherche un fichier du même nom
    const list = await drive.files.list({
      q: `name='${filename}' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });
    // 2. Supprime les fichiers existants du même nom
    for (const file of list.data.files) {
      await drive.files.delete({ fileId: file.id });
    }

    // 3. Upload le nouveau fichier
    if (fs.lstatSync(filePath).isDirectory()) {
      throw new Error("Le chemin fourni est un dossier, pas un fichier !");
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".zip" ? "application/zip" : "application/json";
    const fileMetadata = { name: filename };
    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const res = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });

    return { success: true, fileId: res.data.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Handler pour connecter OneDrive
const ONEDRIVE_REDIRECT_URI = "http://localhost:5174/callback/onedrive";

// Ouvre la fenêtre d'auth OneDrive
ipcMain.handle("open-onedrive-auth-window", async () => {
  const clientId = process.env.ONEDRIVE_CLIENT_ID;
  const scopes = "files.readwrite offline_access";
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&scope=${encodeURIComponent(
    scopes
  )}&response_type=code&redirect_uri=${encodeURIComponent(
    ONEDRIVE_REDIRECT_URI
  )}`;

  shell.openExternal(authUrl);

  return await new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      if (req.url.startsWith("/callback/onedrive")) {
        const qs = new url.URL(req.url, ONEDRIVE_REDIRECT_URI).searchParams;
        const code = qs.get("code");
        const fs = require("fs");
        const path = require("path");
        const callbackHtmlPath = path.join(
          __dirname,
          "../public/oauth/callback.html"
        );
        const html = fs.readFileSync(callbackHtmlPath, "utf8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
        server.close();
        console.log("Code reçu dans le handler:", code);
        resolve({ success: true, code });
      }
    });
    server.listen(5174);
  });
});

// Reçoit le code et échange contre un token
ipcMain.handle("finalize-onedrive-auth", async (event, code) => {
  try {
    const clientId = process.env.ONEDRIVE_CLIENT_ID;
    const redirectUri = ONEDRIVE_REDIRECT_URI;

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("redirect_uri", redirectUri);
    params.append("code", code);
    params.append("grant_type", "authorization_code");

    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    fs.writeFileSync(
      path.join(app.getPath("userData"), "onedrive_token.json"),
      JSON.stringify(response.data)
    );
    return { success: true, token: response.data.access_token };
  } catch (e) {
    if (e.response) {
      console.error("Erreur OneDrive:", e.response.data);
      return { success: false, error: JSON.stringify(e.response.data) };
    }
    return { success: false, error: e.message };
  }
});

// Fonction pour exporter un fichier vers OneDrive
ipcMain.handle(
  "exportAppsStructureToOneDrive",
  async (event, filePath, filename) => {
    return exportFileToOneDrive(filePath, filename);
  }
);

// Handler pour exporter un fichier vers OneDrive
ipcMain.handle("export-file-to-onedrive", async (event, filePath, filename) => {
  return exportFileToOneDrive(filePath, filename);
});

// Fonction utilitaire pour uploader un fichier sur OneDrive
async function exportFileToOneDrive(filePath, filename) {
  try {
    const tokenPath = path.join(app.getPath("userData"), "onedrive_token.json");
    if (!fs.existsSync(tokenPath)) {
      throw new Error("Token OneDrive manquant !");
    }
    if (fs.lstatSync(filePath).isDirectory()) {
      throw new Error("Le chemin fourni est un dossier, pas un fichier !");
    }
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    const accessToken = tokenData.access_token;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".zip" ? "application/zip" : "application/json";
    const fileContent = fs.readFileSync(filePath);
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${filename}:/content`;
    const response = await axios.put(uploadUrl, fileContent, {
      headers: {
        ...headers,
        "Content-Type": mimeType,
      },
    });
    console.log("Fichier uploadé sur OneDrive:", response.data);
    return { success: true, fileId: response.data.id };
  } catch (e) {
    console.error("Erreur upload OneDrive:", e);
    return { success: false, error: e.message };
  }
}

// Handler pour connecter Dropbox
const DROPBOX_REDIRECT_URI = "http://localhost:5175/callback/dropbox";

// Ouvre la fenêtre d'auth Dropbox
ipcMain.handle("open-dropbox-auth-window", async () => {
  const clientId = process.env.DROPBOX_CLIENT_ID;
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    DROPBOX_REDIRECT_URI
  )}`;
  shell.openExternal(authUrl);

  return await new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      if (req.url.startsWith("/callback/dropbox")) {
        const qs = new url.URL(req.url, DROPBOX_REDIRECT_URI).searchParams;
        const code = qs.get("code");
        const fs = require("fs");
        const path = require("path");
        const callbackHtmlPath = path.join(
          __dirname,
          "../public/oauth/callback.html"
        );
        const html = fs.readFileSync(callbackHtmlPath, "utf8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
        server.close();
        console.log("Code reçu dans le handler:", code);
        resolve({ success: true, code });
      }
    });
    server.listen(5175);
  });
});

// Reçoit le code et échange contre un token
ipcMain.handle("finalize-dropbox-auth", async (event, code) => {
  try {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    const redirectUri = DROPBOX_REDIRECT_URI;

    const params = new URLSearchParams();
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("redirect_uri", redirectUri);

    const response = await axios.post(
      "https://api.dropboxapi.com/oauth2/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    fs.writeFileSync(
      path.join(app.getPath("userData"), "dropbox_token.json"),
      JSON.stringify(response.data)
    );
    // Ajoute le token dans la réponse :
    return { success: true, token: response.data.access_token };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Fonction pour exporter un fichier vers Dropbox
ipcMain.handle(
  "exportAppsStructureToDropbox",
  async (event, filePath, filename) => {
    return exportFileToDropbox(filePath, filename);
  }
);

// Handler pour exporter un fichier vers Dropbox
ipcMain.handle("export-file-to-dropbox", async (event, filePath, filename) => {
  return exportFileToDropbox(filePath, filename);
});

// Fonction utilitaire pour uploader un fichier sur Dropbox
async function exportFileToDropbox(filePath, filename) {
  try {
    if (!fs.existsSync(DROPBOX_TOKEN_PATH)) {
      throw new Error("Token Dropbox manquant !");
    }
    if (fs.lstatSync(filePath).isDirectory()) {
      throw new Error("Le chemin fourni est un dossier, pas un fichier !");
    }
    const tokenData = JSON.parse(fs.readFileSync(DROPBOX_TOKEN_PATH, "utf-8"));
    const accessToken = tokenData.access_token;
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".zip" ? "application/zip" : "application/json";
    const fileContent = fs.readFileSync(filePath);

    // Upload (remplace si existe déjà)
    const response = await axios.post(
      "https://content.dropboxapi.com/2/files/upload",
      fileContent,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify({
            path: `/${filename}`,
            mode: "overwrite", // remplace le fichier existant
            autorename: false,
            mute: false,
            strict_conflict: false,
          }),
        },
      }
    );
    console.log("Fichier uploadé sur Dropbox:", response.data);
    return { success: true, fileId: response.data.id };
  } catch (e) {
    console.error("Erreur upload Dropbox:", e);
    return { success: false, error: e.message };
  }
}

// Handler pour connecter Storj
ipcMain.handle("connect-storj", async () => {
  const accessKeyId = process.env.STORJ_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORJ_SECRET_ACCESS_KEY;
  const endpoint = "https://gateway.storjshare.io";
  const bucket = process.env.STORJ_BUCKET || "storjBucket";

  const s3 = new AWS.S3({
    endpoint,
    accessKeyId,
    secretAccessKey,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
  });

  try {
    await s3.listObjectsV2({ Bucket: bucket }).promise();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
});

// Handler pour valider les credentials Storj
ipcMain.handle(
  "validate-storj-credentials",
  async (event, accessKey, secretKey, bucket) => {
    try {
      const AWS = require("aws-sdk");
      const endpoint = "https://gateway.storjshare.io";
      const s3 = new AWS.S3({
        endpoint,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        s3ForcePathStyle: true,
        signatureVersion: "v4",
      });

      // On tente de lister les objets du bucket pour valider les credentials
      await s3.listObjectsV2({ Bucket: bucket }).promise();
      return { success: true };
    } catch (e) {
      // Ne log PAS les credentials, seulement l'erreur
      console.error("Erreur de validation Storj:", e.message);
      return { success: false, error: e.message };
    }
  }
);

// Fonction pour exporter un fichier vers Storj
ipcMain.handle(
  "exportAppsStructureToStorj",
  async (event, filePath, filename) => {
    const accessKeyId = process.env.STORJ_ACCESS_KEY_ID;
    const secretAccessKey = process.env.STORJ_SECRET_ACCESS_KEY;
    const endpoint = "https://gateway.storjshare.io";
    const bucket = process.env.STORJ_BUCKET || "storjBucket";
    const AWS = require("aws-sdk");
    const s3 = new AWS.S3({
      endpoint,
      accessKeyId,
      secretAccessKey,
      s3ForcePathStyle: true,
      signatureVersion: "v4",
    });
    try {
      if (fs.lstatSync(filePath).isDirectory()) {
        throw new Error("Le chemin fourni est un dossier, pas un fichier !");
      }
      const fileContent = fs.readFileSync(filePath);
      const params = {
        Bucket: bucket,
        Key: filename,
        Body: fileContent,
        ContentType: "application/json",
      };
      const data = await s3.upload(params).promise();
      console.log("Fichier exporté vers Storj:", data.Location);
      return { success: true, location: data.Location };
    } catch (e) {
      console.error("Erreur lors de l'export vers Storj:", e);
      return { success: false, error: e.message };
    }
  }
);

// Handler pour exporter un fichier vers Storj
ipcMain.handle("export-file-to-storj", async (event, filePath, filename) => {
  return exportFileToStorj(filePath, filename);
});

// Fonction utilitaire pour uploader un fichier sur Storj
async function exportFileToStorj(filePath, filename) {
  const accessKeyId = process.env.STORJ_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORJ_SECRET_ACCESS_KEY;
  const endpoint = "https://gateway.storjshare.io";
  const bucket = process.env.STORJ_BUCKET || "storjBucket";
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3({
    endpoint,
    accessKeyId,
    secretAccessKey,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
  });
  try {
    if (fs.lstatSync(filePath).isDirectory()) {
      throw new Error("Le chemin fourni est un dossier, pas un fichier !");
    }
    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: bucket,
      Key: filename,
      Body: fileContent,
      ContentType: "application/json",
    };
    const data = await s3.upload(params).promise();
    console.log("Fichier exporté vers Storj:", data.Location);
    return { success: true, location: data.Location };
  } catch (e) {
    console.error("Erreur lors de l'export vers Storj:", e);
    return { success: false, error: e.message };
  }
}

// Handler pour enregistrer les identifiants Storj dans un fichier
ipcMain.handle("saveStorjCredentials", async (event, creds) => {
  const fs = require("fs");
  const path = require("path");
  const userData = app.getPath("userData");
  const filePath = path.join(userData, "storj.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify(creds, null, 2), "utf-8");
    return { success: true, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Handler pour lire le fichier storj.json
ipcMain.handle("getStorjCredentials", async () => {
  const fs = require("fs");
  const path = require("path");
  const userData = app.getPath("userData");
  const filePath = path.join(userData, "storj.json");
  try {
    if (!fs.existsSync(filePath)) return null;
    const json = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
});

// Handler pour enregistrer les identifiants Storj dans un fichier
ipcMain.handle(
  "save-storj-credentials",
  async (event, accessKey, secretKey, bucket) => {
    try {
      const userData = app.getPath("userData");
      const filePath = path.join(userData, "storj.json");
      const creds = {
        accessKey,
        secretKey,
        bucket,
      };
      fs.writeFileSync(filePath, JSON.stringify(creds, null, 2), "utf-8");
      return { success: true, filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
);

// Handler pour lire le fichier storj.json
ipcMain.handle("get-storj-credentials", async () => {
  try {
    const userData = app.getPath("userData");
    const filePath = path.join(userData, "storj.json");
    if (!fs.existsSync(filePath)) return null;
    const json = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
});

// Handler pour connecter Storacha (Filecoin)
ipcMain.handle("connect-storacha", async () => {
  const { Agent } = await import("@web3-storage/access");
  const { Client } = await import("@web3-storage/w3up-client");
  try {
    // Récupère l'agent exporté depuis .env ou un fichier
    const agentExport = process.env.STORACHA_AGENT_KEY; // ou lis depuis un fichier
    const spaceDid = process.env.STORACHA_SPACE_DID;

    let agent, client, space;

    if (agentExport && spaceDid) {
      // Importe l'agent depuis l'export (string ou objet)
      const agentData = JSON.parse(agentExport); // si c'est du JSON
      agent = await Agent.from(agentData);
      client = await Client.create({ agent });
      space = await client.getSpace(spaceDid);

      // Gestion des proofs : accepter les invitations si besoin
      const invitations = await client.capabilities();
      for (const invitation of invitations) {
        await client.accept(invitation);
      }

      await client.setCurrentSpace(space);
    } else {
      // Création d'un nouvel agent et d'un nouvel espace
      agent = await Agent.create();
      client = await Client.create({ agent });
      space = await client.createSpace("hyperbox-space");
      await client.setCurrentSpace(space);

      // Exporte l'agent pour stockage
      const exported = await agent.export();
      // Sauvegarde exported (JSON.stringify(exported)) dans .env ou un fichier
      console.log("Agent exporté à sauvegarder:", JSON.stringify(exported));
      console.log("Space DID:", space.did());
    }

    return {
      spaceDid: space.did(),
      agentKey: JSON.stringify(await agent.export()),
    };
  } catch (e) {
    console.error("Erreur Storacha:", e);
    return null;
  }
});

// Handler pour valider les credentials Storacha
ipcMain.handle(
  "validate-storacha-credentials",
  async (event, agentKey, spaceDid) => {
    try {
      const { Agent } = await import("@web3-storage/access");
      const { Client } = await import("@web3-storage/w3up-client");
      const agentData = JSON.parse(agentKey);
      const agent = await Agent.from(agentData);
      const client = await Client.create({ agent });
      const space = await client.getSpace(spaceDid);
      await client.setCurrentSpace(space);
      // Si pas d’erreur, credentials valides
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
);

// Fonction pour exporter un fichier vers Storacha (Filecoin)
ipcMain.handle(
  "exportAppsStructureToStoracha",
  async (event, filePath, filename, agentKey, spaceDid) => {
    try {
      if (!agentKey || !spaceDid) {
        throw new Error("Agent Key ou Space DID manquant pour Storacha");
      }
      const { Agent } = await import("@web3-storage/access");
      const { Client } = await import("@web3-storage/w3up-client");
      const agentData = JSON.parse(agentKey);
      const agent = await Agent.from(agentData);
      const client = await Client.create({ agent });
      const space = await client.getSpace(spaceDid);
      await client.setCurrentSpace(space);
      // Lit le fichier à exporter
      const fileContent = fs.readFileSync(filePath);
      // Crée un fichier Web3.Storage
      const file = new File([fileContent], filename, {
        type: "application/json",
      });
      // Upload vers l'espace Storacha
      const cid = await client.put([file], { space });
      console.log("Fichier exporté vers Storacha:", cid);
      return { success: true, cid };
    } catch (e) {
      console.error("Erreur lors de l'export vers Storacha:", e);
      return { success: false, error: e.message };
    }
  }
);

// Handler pour obtenir le fichier agent Storacha
ipcMain.handle("get-storacha-agent-file", async () => {
  const agentPath = path.join(app.getPath("userData"), "storacha-agent.json");
  if (fs.existsSync(agentPath)) {
    return fs.readFileSync(agentPath, "utf-8");
  }
  return null;
});

// Handler pour exporter un fichier vers Storacha (Filecoin)
ipcMain.handle(
  "export-file-to-storacha",
  async (event, filePath, filename, agentKey, spaceDid) => {
    return exportFileToStoracha(filePath, filename, agentKey, spaceDid);
  }
);

// Handler pour générer un agent Storacha (clé Ed25519 + DID)
ipcMain.handle("generate-storacha-agent", async () => {
  const fs = require("fs");
  const agentPath = require("path").join(
    require("electron").app.getPath("userData"),
    "storacha-agent.json"
  );
  // Si le fichier existe déjà, le réutiliser
  if (fs.existsSync(agentPath)) {
    const agentExport = JSON.parse(fs.readFileSync(agentPath, "utf-8"));
    return { exported: agentExport, did: agentExport.did, agentPath };
  }

  // Sinon, générer un nouvel agent
  const Principal = await import("@ucanto/principal");
  const principal = await Principal.ed25519.generate();

  const signerBytes = principal.signer;
  const bytes = Buffer.from(signerBytes);
  const secretKey = bytes.slice(0, 32);
  const publicKey = bytes.slice(32, 64);

  const jwk = {
    kty: "OKP",
    crv: "Ed25519",
    x: Buffer.from(publicKey).toString("base64url"),
    d: Buffer.from(secretKey).toString("base64url"),
  };

  const agentExport = {
    id: principal.did(),
    keys: {
      [principal.did()]: jwk,
    },
    did: principal.did(),
    delegations: [],
  };

  fs.writeFileSync(agentPath, JSON.stringify(agentExport, null, 2), "utf-8");
  return { exported: agentExport, did: agentExport.did, agentPath };
});

// Handler pour écrire un fichier agent Storacha
ipcMain.handle("write-agent-file", async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true };
  } catch (e) {
    console.error("Erreur écriture agent Storacha:", e);
    return { success: false, error: e.message };
  }
});

// Fonction utilitaire pour uploader un fichier sur Storacha (Filecoin)
async function exportFileToStoracha(filePath, filename, agentKey, spaceDid) {
  console.log("Type agentKey:", typeof agentKey);
  console.log("Contenu agentKey:", agentKey);
  console.log("Type spaceDid:", typeof spaceDid);
  console.log("Contenu spaceDid:", spaceDid);
  console.log("Type agentKey reçu:", typeof agentKey);
  console.log("Contenu agentKey reçu:", agentKey);
  try {
    if (!agentKey || !spaceDid) {
      throw new Error("Agent Key ou Space DID manquant pour Storacha");
    }
    if (fs.lstatSync(filePath).isDirectory()) {
      throw new Error("Le chemin fourni est un dossier, pas un fichier !");
    }
    const { Agent } = await import("@web3-storage/access");
    const { Client } = await import("@web3-storage/w3up-client");
    const agentData = JSON.parse(agentKey);
    console.log("AgentData reçu pour Agent.from:", agentData);
    console.log("Space DID reçu:", spaceDid);
    console.log("AgentData utilisé pour Agent.from:", agentData);
    console.log("agentData.id:", agentData.id);
    console.log("agentData.keys:", agentData.keys);
    console.log("agentData.did:", agentData.did);
    console.log("agentData.delegations:", agentData.delegations);
    console.log("agentData.keys[agentData.id]:", agentData.keys[agentData.id]);
    if (!agentData.keys[agentData.id]) {
      console.error("❌ La clé agentData.keys[agentData.id] est undefined !");
    }
    const agent = await Agent.from(agentData);
    const client = await Client.create({ agent });
    const space = await client.getSpace(spaceDid);
    await client.setCurrentSpace(space);
    const fileContent = fs.readFileSync(filePath);
    const file = new File([fileContent], filename, {
      type: "application/json",
    });
    const cid = await client.put([file], { space });
    console.log("Fichier exporté vers Storacha:", cid);
    return { success: true, cid };
  } catch (e) {
    console.error("Erreur lors de l'export vers Storacha:", e);
    return { success: false, error: e.message };
  }
}

// Handler pour obtenir le chemin du dossier utilisateur
ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

// Handler pour générer un wallet Arweave
ipcMain.handle("generate-arweave-wallet", async () => {
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });
  const wallet = await arweave.wallets.generate();
  return wallet;
});

// Handler pour connecter Arweave
ipcMain.handle("connect-arweave", async () => {
  const { Arweave } = require("arweave");
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });
  try {
    // Vérifie la connexion en récupérant le solde du wallet
    const wallet = process.env.ARWEAVE_WALLET; // Chemin vers le fichier
    if (!wallet) {
      throw new Error("Wallet non spécifié dans les variables d'environnement");
    }
    const walletData = JSON.parse(fs.readFileSync(wallet, "utf-8"));
    const balance = await arweave.wallets.getBalance(walletData);
    console.log("Solde Arweave:", arweave.ar.winstonToAr(balance));
    return true;
  } catch (e) {
    console.error("Erreur de connexion Arweave:", e);
    return false;
  }
});

// Handler pour valider les credentials Arweave
ipcMain.handle("validate-arweave-wallet", async (event, walletJson) => {
  try {
    const Arweave = require("arweave");
    const arweave = Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
    });
    const wallet = JSON.parse(walletJson);
    // On tente de récupérer l'adresse et le solde
    const address = await arweave.wallets.jwkToAddress(wallet);
    const balance = await arweave.wallets.getBalance(address);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Upload handler
ipcMain.handle("upload-to-arweave", async (event, filePath, walletPath) => {
  const Arweave = require("arweave");
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });
  const wallet = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const data = fs.readFileSync(filePath);
  const tx = await arweave.createTransaction({ data }, wallet);
  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);
  return tx.id;
});

// Download handler
ipcMain.handle("download-from-arweave", async (event, txId, destPath) => {
  const Arweave = require("arweave");
  const fs = require("fs");
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });
  const data = await arweave.transactions.getData(txId, { decode: true });
  fs.writeFileSync(destPath, data);
  return true;
});

// Handler pour obtenir l'adresse Arweave à partir du wallet
ipcMain.handle("get-arweave-address", async (event, walletJson) => {
  const Arweave = require("arweave");
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });
  const wallet =
    typeof walletJson === "string" ? JSON.parse(walletJson) : walletJson;
  return await arweave.wallets.jwkToAddress(wallet);
});

// Import wallet handler (optionnel)
ipcMain.handle("import-arweave-wallet", async (event, walletJson) => {
  const walletPath = path.join(app.getPath("userData"), "arweave-key.json");
  // Correction ici :
  const content =
    typeof walletJson === "string" ? walletJson : JSON.stringify(walletJson);
  fs.writeFileSync(walletPath, content, "utf-8");
  return walletPath;
});

// Handler pour connecter Web3.Storage (Filecoin)
ipcMain.handle("connect-web3storage", async () => {
  // Demande le token à l'utilisateur (à sécuriser ensuite)
  const { response } = await dialog.showMessageBox({
    type: "info",
    buttons: ["OK"],
    title: "Web3.Storage",
    message:
      "Pour connecter Web3.Storage, renseignez votre API Token dans le code ou via une future interface.",
  });
  return true;
});

// Fonction pour exporter un fichier vers Arweave
ipcMain.handle(
  "exportAppsStructureToArweave",
  async (event, filePath, filename, walletPath) => {
    console.log("[Arweave] filePath:", filePath);
    console.log("[Arweave] filename:", filename);
    console.log("[Arweave] walletPath:", walletPath);
    if (!filePath || !walletPath) {
      throw new Error("filePath ou walletPath manquant !");
    }
    const Arweave = require("arweave");
    const arweave = Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
    });
    try {
      const wallet = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
      const data = fs.readFileSync(filePath);
      const tx = await arweave.createTransaction({ data }, wallet);
      tx.addTag("Content-Type", "application/json");
      tx.addTag("App-Name", "HyperBox");
      tx.addTag("App-Version", "1.0.0");
      await arweave.transactions.sign(tx, wallet);
      const response = await arweave.transactions.post(tx);
      if (response.status !== 200) {
        throw new Error(`Erreur lors de l'upload : ${response.statusText}`);
      }
      console.log("Fichier exporté vers Arweave:", tx.id);
      return { success: true, txId: tx.id };
    } catch (e) {
      console.error("Erreur lors de l'export vers Arweave:", e);
      return { success: false, error: e.message };
    }
  }
);

// Handler pour exporter un fichier vers Arweave
ipcMain.handle(
  "export-file-to-arweave",
  async (event, filePath, filename, walletPath) => {
    try {
      if (!filePath || !walletPath) {
        throw new Error("filePath ou walletPath manquant !");
      }
      if (!fs.existsSync(walletPath)) {
        throw new Error("Le walletPath n'existe pas !");
      }
      if (!fs.existsSync(filePath)) {
        throw new Error("Le fichier à uploader n'existe pas !");
      }
      const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
      });

      const walletContent = fs.readFileSync(walletPath, "utf-8");
      const wallet = JSON.parse(walletContent);
      const data = fs.readFileSync(filePath);

      const tx = await arweave.createTransaction({ data }, wallet);
      tx.addTag("Content-Type", "application/zip");
      tx.addTag("App-Name", "HyperBox");
      tx.addTag("App-Version", "1.0.0");

      await arweave.transactions.sign(tx, wallet);
      const response = await arweave.transactions.post(tx);

      if (response.status !== 200) {
        throw new Error(`Erreur lors de l'upload : ${response.statusText}`);
      }

      console.log("Fichier exporté vers Arweave:", tx.id);
      return { success: true, txId: tx.id };
    } catch (e) {
      console.error("Erreur lors de l'export vers Arweave:", e);
      return { success: false, error: e.message };
    }
  }
);

// Handler pour uploader un fichier vers Web3.Storage
ipcMain.handle("upload-to-web3storage", async (event, filePath, token) => {
  try {
    const client = new Web3Storage({ token });
    const data = fs.readFileSync(filePath);
    const fileName = require("path").basename(filePath);
    const files = [new File([data], fileName)];
    const cid = await client.put(files);
    return cid;
  } catch (e) {
    console.error(e);
    return null;
  }
});

ipcMain.handle(
  "download-from-web3storage",
  async (event, cid, token, destPath) => {
    try {
      const client = new Web3Storage({ token });
      const res = await client.get(cid);
      if (!res.ok) throw new Error("Erreur de téléchargement");
      const files = await res.files();
      for (const file of files) {
        fs.writeFileSync(
          require("path").join(destPath, file.name),
          Buffer.from(await file.arrayBuffer())
        );
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
);

// Sauvegarde de la configuration HyperBox
ipcMain.handle("save-config", async (event, data) => {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf-8");
});

// Copie un fichier dans le dossier HyperBox (store)
ipcMain.handle("save-file", async (event, srcPath, filename) => {
  try {
    const destDir = path.join(app.getPath("userData"), "hyperbox_files");
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);
    fs.copyFileSync(srcPath, destPath);
    console.log(`[SAVE FILE] Copied ${srcPath} to ${destPath}`);
    return destPath;
  } catch (e) {
    console.error(`[SAVE FILE] Error copying ${srcPath}:`, e);
    return null;
  }
});

// APIs système fichiers/dossiers (exploration/CRUD)
ipcMain.handle("fs-list-dir", async (event, dirPath) => {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true }).map((dirent) => ({
      name: dirent.name,
      isFile: dirent.isFile(),
      isDirectory: dirent.isDirectory(),
    }));
  } catch (e) {
    return [];
  }
});

ipcMain.handle("fs-create", async (event, { type, path: dirPath, name }) => {
  try {
    const targetPath = path.join(dirPath, name);
    if (type === "file") fs.writeFileSync(targetPath, "");
    else if (type === "directory")
      fs.mkdirSync(targetPath, { recursive: true });
    return targetPath;
  } catch (e) {
    return null;
  }
});

ipcMain.handle("fs-rename", async (event, { oldPath, newPath }) => {
  try {
    fs.renameSync(oldPath, newPath);
    return newPath;
  } catch (e) {
    return null;
  }
});

ipcMain.handle("fs-delete", async (event, targetPath) => {
  try {
    if (fs.lstatSync(targetPath).isDirectory()) {
      fs.rmdirSync(targetPath, { recursive: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    return true;
  } catch (e) {
    return false;
  }
});

// Modifier l'API de déplacement pour être plus pratique
ipcMain.handle("fs-move", async (event, srcPath, filename) => {
  try {
    const destDir = path.join(app.getPath("userData"), "hyperbox_files");
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, filename || path.basename(srcPath));

    // Vérifier si le fichier de destination existe déjà
    if (fs.existsSync(destPath)) {
      throw new Error(
        `Un fichier "${filename}" existe déjà dans le dossier HyperBox`
      );
    }

    // Vérifier si c'est un dossier
    const isDirectory = fs.lstatSync(srcPath).isDirectory();

    // Déplacer le fichier ou dossier
    fs.renameSync(srcPath, destPath);

    console.log(`[MOVE] Successfully moved ${srcPath} to ${destPath}`);
    return destPath;
  } catch (e) {
    console.error(`[MOVE] Error moving ${srcPath}:`, e);
    throw e;
  }
});

// Handler pour ouvrir des fichiers ET dossiers
ipcMain.handle("open-file", async (event, filePath) => {
  try {
    console.log(`[OPEN] Tentative d'ouverture: ${filePath}`);

    // Si le chemin commence par / et n'est pas un chemin Unix valide, c'est invalide
    if (filePath.startsWith("/") && process.platform === "win32") {
      // Essayer de deviner le chemin sur Windows
      console.warn(`[OPEN] Chemin relatif détecté sur Windows: ${filePath}`);

      // Option 1: Chercher dans le répertoire utilisateur
      const userHome = require("os").homedir();
      const possiblePaths = [
        path.join(userHome, "Desktop", filePath.substring(1)),
        path.join(userHome, "Downloads", filePath.substring(1)),
        path.join(userHome, "Documents", filePath.substring(1)),
        path.join(userHome, filePath.substring(1)),
      ];

      let foundPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          foundPath = testPath;
          break;
        }
      }

      if (!foundPath) {
        throw new Error(
          `Cannot resolve relative path: ${filePath}. Please use the context menu to add files with full paths.`
        );
      }

      filePath = foundPath;
      console.log(`[OPEN] Chemin résolu: ${filePath}`);
    }

    // Vérifier si le fichier/dossier existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Vérifier si c'est un dossier
    const stats = fs.lstatSync(filePath);

    if (stats.isDirectory()) {
      // Ouvrir le dossier dans l'explorateur
      console.log(`[OPEN] Ouverture du dossier: ${filePath}`);
      await shell.openPath(filePath);
    } else {
      // Ouvrir le fichier avec l'application par défaut
      console.log(`[OPEN] Ouverture du fichier: ${filePath}`);
      await shell.openPath(filePath);
    }

    console.log(`[OPEN] Succès: ${filePath}`);
  } catch (e) {
    console.error(`[OPEN FILE] Error:`, e);
    throw e;
  }
});

// UNIVERSAL FILE ICON HANDLER (TOUT type de fichier/app/dossier)
ipcMain.handle("get-file-icon", async (event, filePath) => {
  try {
    const iconBuffer = await app.getFileIcon(filePath, { size: "large" });
    return iconBuffer.toDataURL();
  } catch (e) {
    console.error("Error getting file icon:", e);
    return null;
  }
});

// Sélectionne un dossier (avec icône native)
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];
  const name = path.basename(folderPath);
  let icon = "📁";
  try {
    const iconBuffer = await app.getFileIcon(folderPath, { size: "large" });
    icon = iconBuffer.toDataURL();
  } catch (e) {}
  return { name, path: folderPath, icon };
});

// Sélectionne une application (avec icône native)
ipcMain.handle("select-app", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Applications", extensions: ["exe", "app", "bat", "sh"] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const appPath = result.filePaths[0];
  const name = path.basename(appPath);
  let icon = "🖥️";
  try {
    const iconBuffer = await app.getFileIcon(appPath, { size: "large" });
    icon = iconBuffer.toDataURL();
  } catch (e) {}
  return { name, path: appPath, icon };
});

// ✅ Handler pour sélectionner tous les fichiers d'un dossier :
ipcMain.handle("select-all-files-in-folder", async (event, navigationPath) => {
  try {
    console.log("🔍 Navigation path reçu:", navigationPath);

    // ✅ Construire le chemin complet avec userData
    const userDataPath = app.getPath("userData");
    const hyperboxFilesPath = path.join(userDataPath, "hyperbox_files");

    // ✅ Ajouter le chemin de navigation
    const fullPath = navigationPath
      ? path.join(hyperboxFilesPath, navigationPath.replace(/\//g, path.sep))
      : hyperboxFilesPath;

    console.log("📁 Chemin userData:", userDataPath);
    console.log("📁 Chemin hyperbox_files:", hyperboxFilesPath);
    console.log("📁 Chemin final:", fullPath);

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log("📁 Dossier créé:", fullPath);
    }

    // Lire le contenu
    const files = fs.readdirSync(fullPath, { withFileTypes: true });

    const result = files.map((file) => ({
      name: file.name,
      path: path.join(fullPath, file.name),
      icon: file.isDirectory() ? "📁" : "📄",
      type: file.isDirectory() ? "folder" : "file",
    }));

    console.log(`✅ ${result.length} fichiers trouvés dans ${fullPath}`);
    return result;
  } catch (error) {
    console.error("❌ Erreur:", error);
    return [];
  }
});

// Sélectionne un fichier de tout type (avec icône native)
ipcMain.handle("select-file", async (event, options) => {
  const { dialog } = require("electron");
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    ...options,
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const name = path.basename(filePath);
  let icon = "📄";
  try {
    const iconBuffer = await app.getFileIcon(filePath, { size: "large" });
    icon = iconBuffer.toDataURL();
  } catch (e) {}
  return { name, path: filePath, icon };
});

// Handler pour lire le contenu d'un fichier (utilisé dans preload.js)
ipcMain.handle("get-file-content", async (event, filePath) => {
  const fs = require("fs");
  return fs.readFileSync(filePath, "utf-8");
});

// Helper pour obtenir le nom d'une application à partir de son chemin
ipcMain.handle("get-app-name-from-path", (event, appPath) => {
  if (!appPath) return "";
  const parts = appPath.split(/[\\/]/);
  const file = parts[parts.length - 1];
  return file.replace(/\.exe$/i, "");
});

// Handler pour copier des fichiers (utilisé dans preload.js)
ipcMain.handle("fs-copy", async (event, { srcPath, destPath }) => {
  try {
    // Vérifier si le fichier source existe
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Source file does not exist: ${srcPath}`);
    }

    // Créer le dossier de destination s'il n'existe pas
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Vérifier si c'est un dossier ou un fichier
    const stats = fs.lstatSync(srcPath);
    if (stats.isDirectory()) {
      // Copier récursivement le dossier
      copyDirRecursive(srcPath, destPath);
    } else {
      // Copier le fichier
      fs.copyFileSync(srcPath, destPath);
    }

    console.log(`[COPY] Successfully copied ${srcPath} to ${destPath}`);
    return destPath;
  } catch (e) {
    console.error(`[COPY] Error copying ${srcPath} to ${destPath}:`, e);
    throw e;
  }
});

// Handler pour exporter et importer la configuration HyperBox
ipcMain.handle("export-config", async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Exporter la configuration",
    defaultPath: "hyperbox-config.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (canceled || !filePath) return false;
  try {
    const data = fs.readFileSync(configPath, "utf-8");
    fs.writeFileSync(filePath, data, "utf-8");
    return true;
  } catch (e) {
    return false;
  }
});

// Handler pour importer une configuration HyperBox
ipcMain.handle("import-config", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Importer une configuration",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (canceled || !filePaths[0]) return false;
  try {
    const data = fs.readFileSync(filePaths[0], "utf-8");
    fs.writeFileSync(configPath, data, "utf-8");
    return true;
  } catch (e) {
    return false;
  }
});

// Fonction helper pour copier récursivement un dossier
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Handler pour obtenir une icône à partir d'une URL (favicon)
ipcMain.handle("get-file-icon-from-url", async (event, url) => {
  try {
    // Pour l'instant, retourne le favicon Google
    // Tu peux améliorer ça plus tard en téléchargeant réellement l'icône
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
      domain
    )}`;
  } catch (e) {
    console.error("Error getting icon from URL:", e);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
      url
    )}`;
  }
});

// Handler pour obtenir des informations détaillées sur un fichier
ipcMain.handle("get-file-info", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.lstatSync(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      extension: path.extname(filePath),
      modified: stats.mtime,
      created: stats.birthtime,
    };
  } catch (e) {
    console.error("Error getting file info:", e);
    return null;
  }
});

// AJOUTER après les autres handlers (ligne 460) :
ipcMain.handle("is-directory", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stats = fs.lstatSync(filePath);
    return stats.isDirectory();
  } catch (error) {
    console.error("Error checking if directory:", error);
    return false;
  }
});

// AJOUTER dans index.js (après les autres handlers) :
ipcMain.handle(
  "get-items-in-selection-box",
  async (event, { selectionBox, items }) => {
    try {
      console.log("🎯 Sélection par rectangle (Electron):", selectionBox);

      const selectedItems = [];

      // Simuler la détection d'intersection côté main process
      items.forEach((item, index) => {
        // Pour simplifier, on peut utiliser une logique basée sur l'index ou les coordonnées
        // Ici, exemple simple : sélectionner selon la taille du rectangle
        const shouldSelect =
          Math.random() < (selectionBox.width * selectionBox.height) / 10000;

        if (shouldSelect) {
          selectedItems.push({
            name: item.name,
            path: item.filePath || item.appPath || item.url || "",
            icon: item.icon || "📄",
            type: item.type,
          });
          console.log(`✅ Item sélectionné (Electron): ${item.name}`);
        }
      });

      console.log(
        `🎉 ${selectedItems.length} éléments sélectionnés via Electron`
      );
      return selectedItems;
    } catch (error) {
      console.error("❌ Erreur sélection rectangle:", error);
      return [];
    }
  }
);

// Handler pour ouvrir une fenêtre Transak
ipcMain.handle("open-transak-window", (event, url) => {
  const iconPath = path.join(__dirname, "assets", "transak-favicon.ico");
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    autoHideMenuBar: true,
    icon: iconPath,
    backgroundColor: "#030121",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Acheter des AR (Arweave) avec Transak",
  });
  win.loadURL(url);
});

ipcMain.handle("open-arweave-wallet-window", (event) => {
  const iconPath = path.join(__dirname, "assets", "arweave-favicon.ico");
  const win = new BrowserWindow({
    width: 800,
    height: 500,
    resizable: true,
    autoHideMenuBar: true,
    icon: iconPath,
    backgroundColor: "#181818",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Arweave Wallet",
  });
  win.setMenuBarVisibility(false);
  win.loadURL("https://arweave.app/wallet");
});
