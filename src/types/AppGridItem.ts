export interface AppGridItem {
  id: string;
  name: string;
  type: "web" | "file" | "app" | "folder";
  icon?: string; // base64, url, ou emoji pour tous types
  favicon?: string; // spécifique aux liens web si tu veux différencier
  description?: string;
  color?: string;
  isDefault?: boolean;
  isFavorite?: boolean;
  isHidden?: boolean;
  title?: string; // pour les liens web, le nom affiché dans l'onglet

  // Spécifique à chaque type
  url?: string; // pour type web
  filePath?: string; // pour type file
  appPath?: string; // pour type app

  // Structure hiérarchique (pour dossiers)
  children?: AppGridItem[]; // pour les sous-dossiers
  items?: AppGridItem[]; // pour les fichiers/apps/contenus

  // Optionnel : propriétés système (si besoin)
  systemIcon?: string;
  isSystem?: boolean;
  isShortcut?: boolean;

  // Optionnel : typage/facilitation de filtrage rapide
  isExecutable?: boolean;
  isImage?: boolean;
  isAudio?: boolean;
  isVideo?: boolean;
  isDocument?: boolean;
  isArchive?: boolean;
  isLink?: boolean; // pour les liens web

  // Optionnel : pour extensions/futures personnalisations
  custom?: { [key: string]: any };
}
