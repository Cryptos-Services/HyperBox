const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

// Fonction utilitaire pour nettoyer les noms de fichiers
function safeFileName(name) {
  // Supprime les espaces en fin/début et caractères interdits Windows
  return name.trim().replace(/[<>:"/\\|?*]+/g, "_");
}

// Fonction pour créer un raccourci URL
function createUrlShortcut(targetPath, url, name) {
  fs.mkdirSync(targetPath, { recursive: true });
  const shortcut = `[InternetShortcut]\nURL=${url}\n`;
  const shortcutPath = path.join(targetPath, `${safeFileName(name)}.url`);
  fs.writeFileSync(shortcutPath, shortcut, "utf8");
  console.log(`[HyperBox] Raccourci créé : ${shortcutPath}`);
}

// Fonction pour créer les dossiers et les raccourcis
function createFoldersAndShortcuts(node, currentPath) {
  // Applique safeFileName uniquement sur le nom du dossier courant
  const safeCurrentPath = path.join(
    path.dirname(currentPath),
    safeFileName(path.basename(currentPath))
  );

  // Si le noeud est de type "folder", crée le dossier même s'il n'a pas d'items/children
  if (node.type === "folder") {
    fs.mkdirSync(safeCurrentPath, { recursive: true });
    console.log(`[HyperBox] Dossier (folder) créé : ${safeCurrentPath}`);
  }

  // Crée le dossier pour tout type (pour compatibilité descendante)
  fs.mkdirSync(safeCurrentPath, { recursive: true });

  if (node.items) {
    for (const item of node.items) {
      if ((item.type === "app" || item.type === "web") && item.url) {
        createUrlShortcut(safeCurrentPath, item.url, item.name);
      } else if (item.type === "file" && item.filePath) {
        const destPath = path.join(safeCurrentPath, safeFileName(item.name));
        try {
          if (fs.existsSync(item.filePath)) {
            fs.copyFileSync(item.filePath, destPath);
            console.log(`[HyperBox] Fichier copié : ${destPath}`);
          } else {
            console.warn(
              `[HyperBox] Fichier source introuvable : ${item.filePath}`
            );
          }
        } catch (e) {
          console.error(`[HyperBox] Erreur copie fichier : ${e.message}`);
        }
      } else if (item.type === "folder") {
        // Crée le sous-dossier même s'il est vide
        const folderPath = path.join(safeCurrentPath, safeFileName(item.name));
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`[HyperBox] Sous-dossier (folder) créé : ${folderPath}`);
        // Si le dossier a des items ou children, on les traite récursivement
        createFoldersAndShortcuts(item, folderPath);
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      createFoldersAndShortcuts(child, path.join(safeCurrentPath, child.name));
    }
  }
}

// Fonction pour scanner un dossier et créer une structure
function scanFolderToStructure(folderPath) {
  const name = path.basename(folderPath);
  const node = { name, items: [], children: [] };

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      node.children.push(scanFolderToStructure(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".url")) {
      // Lecture du .url pour récupérer l'URL
      const content = fs.readFileSync(entryPath, "utf8");
      const urlMatch = content.match(/^URL=(.+)$/m);
      node.items.push({
        type: "web",
        name: entry.name.replace(/\.url$/, ""),
        url: urlMatch ? urlMatch[1] : "",
      });
    }
  }
  return node;
}

// Fonction pour scanner un dossier et créer une structure
function saveAppsStructureToFile(appsRoot, savePath) {
  const structure = [];
  const entries = fs.readdirSync(appsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      structure.push(scanFolderToStructure(path.join(appsRoot, entry.name)));
    }
  }
  fs.writeFileSync(savePath, JSON.stringify(structure, null, 2), "utf8");
  console.log(
    `[HyperBox] Structure HyperBoxSav sauvegardée dans : ${savePath}`
  );
}

// Fonction pour créer la structure par défaut de HyperBox
function createDefaultHyperBoxStructure(categories, rootPath) {
  // Crée le dossier Apps dans rootPath
  const appsRoot = path.join(rootPath, "HyperBoxSav");
  fs.mkdirSync(appsRoot, { recursive: true });
  console.log("[HyperBox] Racine HyperBoxSav créée :", appsRoot);
  for (const cat of categories) {
    createFoldersAndShortcuts(cat, path.join(appsRoot, cat.name));
  }
  console.log("[HyperBox] Génération terminée !");
}

// Fonction pour "Sauvegarder" la structure HyperBoxSav à l'emplacement choisi
function saveHyperBoxStructureToInstallPath(categories, installPath) {
  // Crée le dossier HyperBoxSav dans le chemin choisi par l'utilisateur
  const appsRoot = path.join(installPath, "HyperBoxSav");
  fs.mkdirSync(appsRoot, { recursive: true });
  console.log(
    "[HyperBox] HyperBoxSav créé à l'emplacement choisi (📂 Répertoire d'Installation) :",
    appsRoot
  );
  for (const cat of categories) {
    createFoldersAndShortcuts(cat, path.join(appsRoot, cat.name));
  }
  console.log("[HyperBox] Génération terminée !");
}

// Fonction pour régénérer la structure HyperBoxSav dans le projet et l'emplacement d'installation
function regenerateHyperBoxStructure(categories, projectRoot, installPath) {
  createDefaultHyperBoxStructure(categories, projectRoot);
  saveHyperBoxStructureToInstallPath(categories, installPath);
  console.log(
    "[HyperBox] Structure régénérée à la fois dans le projet et dans le dossier d'installation !"
  );
}

// Fonction pour copier récursivement un dossier
async function copyFolderRecursiveAsync(source, target) {
  const rel = path.relative(source, target);
  if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
    throw new Error(
      "La destination ne doit pas être un sous-dossier de la source !"
    );
  }
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

  const entries = await fs.promises.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    // Ignore app.asar et node_modules si besoin
    if (entry.name === "app.asar" || entry.name === "node_modules") continue;
    const srcPath = path.join(source, entry.name);
    const tgtPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyFolderRecursiveAsync(srcPath, tgtPath);
    } else {
      await fs.promises.copyFile(srcPath, tgtPath);
    }
  }
}

// Fonction pour zipper le dossier HyperBoxSav
function zipHyperBoxSav(installPath) {
  const folderPath = path.join(installPath, "HyperBoxSav");
  const zipPath = path.join(installPath, "HyperBoxSav.zip");
  const zip = new AdmZip();
  zip.addLocalFolder(folderPath);
  zip.writeZip(zipPath);
  return zipPath;
}

module.exports = {
  createDefaultHyperBoxStructure,
  saveHyperBoxStructureToInstallPath,
  regenerateHyperBoxStructure,
  copyFolderRecursiveAsync,
  scanFolderToStructure,
  saveAppsStructureToFile,
  createFoldersAndShortcuts,
  createUrlShortcut,
  safeFileName,
  zipHyperBoxSav,
};
