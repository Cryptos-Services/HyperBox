# HyperBox

## 🚀 Présentation (FR)

**HyperBox** est une application open source qui centralise tous vos logiciels, applications, dossiers et sites web favoris dans une interface moderne, claire et personnalisable. Simplifiez votre environnement de travail : ne perdez plus de temps à chercher vos outils, à encombrer votre bureau ou votre barre des tâches, ni à multiplier les onglets dans votre navigateur.

Grâce à HyperBox, organisez vos raccourcis par catégories (Développement, Crypto, Bureautique, etc.), personnalisez et lancez vos applications en un clic. Libérez de l’espace sur votre disque principal : déplacez vos applications où vous voulez, HyperBox s’occupe de tout.

---

### 🎯 Fonctionnalités principales

- **Interface type “menu démarrer”** : accessible depuis la barre des tâches
- **Catégories personnalisées** : 3 modes par défaut (Développement, Crypto, Bureautique), création/suppression/renommage illimités
- **Ajout ultra-rapide** : capturez un logiciel, un exécutable, un dossier ou un site web par simple glisser-déposer dans la catégorie de votre choix
- **Lancement instantané** : ouvrez n’importe quel raccourci en un clic
- **Configuration intégrée** : gérez tout depuis l’application (nom, icône, chemin, etc.), sans manipuler de fichiers à la main
- **Stockage flexible** : installez et organisez vos outils hors du disque C: si vous le souhaitez
- **Mode utilisateur** : choisissez un profil de départ (Dev, Crypto, Bureautique) ou créez le vôtre
- **Open source** : améliorez, proposez, partagez !

---

### 🖼️ Exemples d’utilisation

- Regroupez tous vos wallets crypto, vos explorateurs de blockchains et vos outils de trading dans la catégorie "Crypto"
- Centralisez vos IDE, terminaux, frameworks et outils de documentation dans "Développement"
- Rassemblez bureautique, cloud, gestionnaires de tâches et favoris web dans "Bureautique"
- Créez autant de catégories que nécessaire : Jeux, Design, Formation, etc.

---

### 🛠️ Fonctionnalités à venir

- Drag & drop (glisser-déposer) pour ajouter vos applications/raccourcis/sites web
- Import/export de configuration
- Thèmes (clair, sombre, personnalisés)
- Recherche rapide
- Synchro Cloud
- Plugins/extensions

---

### 📦 Installation

*À venir : instructions pour Windows, Mac et Linux. Restez connectés !*

---

<<<<<<< HEAD
### 🌴 Arborescence

src/
│
├─ components/
│   ├─ Sidebar/
│   │   ├─ Sidebar.jsx
│   │   └─ Sidebar.module.css
│   ├─ CategoryList/
│   │   ├─ CategoryList.jsx
│   │   └─ CategoryList.module.css
│   ├─ AppGrid/
│   │   ├─ AppGrid.jsx
│   │   └─ AppGrid.module.css
│   ├─ Footer/
│   │   ├─ Footer.jsx
│   │   └─ Footer.module.css
│   ├─ UserTypeSelector/
│   │   ├─ UserTypeSelector.jsx
│   │   └─ UserTypeSelector.module.css
│   ├─ SettingsModal/
│   │   ├─ SettingsModal.jsx
│   │   └─ SettingsModal.module.css
│   └─ (autres composants à venir)
│
├─ assets/
│   ├─ icons/
│   └─ (logos, images, etc.)
│
├─ styles/
│   └─ variables.css  (pour les couleurs principales, ou tailwind config si tu veux Tailwind)
│
├─ App.jsx
├─ index.jsx
└─ index.css

---

### 📚 Documentation

=======

### 🌴 Arborescence

src/
├─ components/
│   ├─ Sidebar/
│   ├─ CategoryList/
│   ├─ AppGrid/
│   ├─ Footer/
│   ├─ UserTypeSelector/
│   └─ SettingsModal/
├─ App.tsx
├─ categories-data.ts
├─ main.tsx
├─ index.css
├─ index.js
├─ index.html
└─preload.js

Chaque composant représente une zone fonctionnelle de l’application :

- *Sidebar* (catégories à gauche, rétractable)
- *CategoryList* (catégories/sous-catégories)
- *AppGrid* (zone centrale : applis/logiels/sites)
- *Footer* (barre tout en bas)
- *UserTypeSelector* (choix du mode d’utilisation)
- *SettingsModal* (paramètres en pop-up)

Le style est géré principalement avec Tailwind CSS et les couleurs de la charte Cryptos Services.

---

### 📚 Documentation (FR)

- [Guide de démarrage](docs/FR_guide_demarrage.md) *(en cours)*
- [FAQ](docs/FR_faq.md) *(en cours)*
- [Contribuer](CONTRIBUTING.md)

---

### 🧑‍💻 Contribuer

HyperBox est ouvert à toutes vos idées !
Pour proposer une amélioration ou corriger un bug :
=======
HyperBox est ouvert à toutes vos idées !
Pour proposer une amélioration ou corriger un bug :

1. Forkez le dépôt
2. Ouvrez une issue ou une pull request
3. Rejoignez la communauté !

---

### 📝 Licence

[MIT](LICENSE)

---

## 🌐 Overview (EN)

**HyperBox** is an open-source launcher that centralizes all your favorite software, apps, folders, and websites in one modern, customizable interface. Streamline your workspace: no more searching, desktop clutter, taskbar overload, or endless browser tabs.

With HyperBox, organize your shortcuts by category (Development, Crypto, Office, etc.), personalize, and launch any app in one click. Free up space on your main drive: move your apps wherever you want—HyperBox handles the rest.

---

### 🎯 Main Features

- **Start-menu-like interface**: accessible from the taskbar
- **Custom categories**: 3 default modes (Development, Crypto, Office), unlimited creation/renaming/removal
- **Lightning-fast adding**: simply drag and drop any software, executable, folder, or website into your chosen category
- **One-click launching**: open any shortcut instantly
- **Built-in configuration**: manage everything from the app (name, icon, path, etc.), no manual file editing needed
- **Flexible storage**: install and organize your tools outside the C: drive if you wish
- **User mode**: pick a starter profile (Dev, Crypto, Office) or create your own
- **Open source**: contribute, improve, and share!

---

### 🖼️ Usage Examples

- Group all your crypto wallets, blockchain explorers, and trading tools under "Crypto"
- Centralize your IDEs, terminals, frameworks, and docs under "Development"
- Gather office apps, cloud services, to-do managers, and web favorites under "Office"
- Create as many categories as you need: Gaming, Design, Learning, etc.

---

### 🛠️ Upcoming Features

- Drag & drop to add apps/shortcuts/websites
- Config import/export
- Light, dark, and custom themes
- Quick search
- Cloud sync
- Plugins/extensions

---

<<<<<<< HEAD
### 📦 Installation
=======
### 📦 Upload
>>>>>>> b0074b9 (Initial commit: source, config, docs)

*Coming soon: Windows, Mac, and Linux instructions. Stay tuned!*

---

<<<<<<< HEAD
### 🌴 Arborescence

src/
│
├─ components/
│   ├─ Sidebar/
│   │   ├─ Sidebar.jsx
│   │   └─ Sidebar.module.css
│   ├─ CategoryList/
│   │   ├─ CategoryList.jsx
│   │   └─ CategoryList.module.css
│   ├─ AppGrid/
│   │   ├─ AppGrid.jsx
│   │   └─ AppGrid.module.css
│   ├─ Footer/
│   │   ├─ Footer.jsx
│   │   └─ Footer.module.css
│   ├─ UserTypeSelector/
│   │   ├─ UserTypeSelector.jsx
│   │   └─ UserTypeSelector.module.css
│   ├─ SettingsModal/
│   │   ├─ SettingsModal.jsx
│   │   └─ SettingsModal.module.css
│   └─ (autres composants à venir)
│
├─ assets/
│   ├─ icons/
│   └─ (logos, images, etc.)
│
├─ styles/
│   └─ variables.css  (pour les couleurs principales, ou tailwind config si tu veux Tailwind)
│
├─ App.jsx
├─ index.jsx
└─ index.css

---

### 📚 Documentation
=======
## 🗂️ Architecture des fichiers

src/
├─ components/
│   ├─ Sidebar/
│   ├─ CategoryList/
│   ├─ AppGrid/
│   ├─ Footer/
│   ├─ UserTypeSelector/
│   └─ SettingsModal/
├─ App.tsx
├─ categories-data.ts
├─ main.tsx
├─ index.css
├─ index.js
├─ index.html
└─preload.js

Chaque composant représente une zone fonctionnelle de l’application :

- *Sidebar* (catégories à gauche, rétractable)
- *CategoryList* (catégories/sous-catégories)
- *AppGrid* (zone centrale : applis/logiels/sites)
- *Footer* (barre tout en bas)
- *UserTypeSelector* (choix du mode d’utilisation)
- *SettingsModal* (paramètres en pop-up)

Le style est géré principalement avec Tailwind CSS et les couleurs de la charte Cryptos Services.

---

### 📚 Documentation (EN)
>>>>>>> b0074b9 (Initial commit: source, config, docs)

- [Getting Started Guide](docs/EN_getting_started.md) *(in progress)*
- [FAQ](docs/EN_faq.md) *(in progress)*
- [Contributing](CONTRIBUTING.md)

---

### 🧑‍💻 Contributing

HyperBox welcomes all your ideas!
To suggest an enhancement or fix a bug:
<<<<<<< HEAD
=======

>>>>>>> b0074b9 (Initial commit: source, config, docs)
1. Fork the repo
2. Open an issue or pull request
3. Join the community!

---

### 📝 License

[MIT](LICENSE)

---
<<<<<<< HEAD
=======

Paramètres
├── 🎨 Apparence
├── 📁 Applications  ⭐ (priorité)
├── 🔧 Comportement
├── 📊 Stockage
└── ℹ️ À propos

🎨 1. Apparence & Interface

Thème : Dark / Light / Système (PC)
Taille de la grille : 6, 8, 10, 12 colonnes
Taille des icônes : Petit, Moyen, Grand
Animation sidebar : Activée/Désactivée
Langue : FR/EN (préparation future)

📁 2. Gestion des Applications
Répertoire d'installation : Choix du dossier central HyperBox (Fait)
Mode d'ajout par défaut :
✅ Conserver l'emplacement actuel (raccourci)
✅ Déplacer vers HyperBox (centralisation)
✅ Toujours demander
Nettoyage automatique : Supprimer les raccourcis cassés
Mise à jour des icônes : Refresh automatique des favicons

🔧 3. Comportement
Ouverture au démarrage : Lancer HyperBox avec Windows
Minimiser en tray : Réduire dans la barre système
Raccourcis clavier : Ctrl+Alt+H pour ouvrir, etc.
Double-clic : Action par défaut (ouvrir/éditer)

📊 4. Stockage & Sauvegarde
Dossier de configuration : Localisation des données
Export/Import : Sauvegarder/Restaurer la configuration
Synchronisation Cloud : (futur) OneDrive, Google Drive, etc.
Sauvegarde automatique : Fréquence des backups

🚀 5. Performance
Cache des icônes : Taille limite, nettoyage
Démarrage rapide : Précharger au boot
Animations : Réduire pour performance
Logs de debug : Activer/Désactiver

ℹ️ 6. Informations
Version : HyperBox v1.0.0
À propos : Liens GitHub, licence MIT
Statistiques : Nombre d'apps, d'utilisation
Aide : Documentation, raccourcis

node --experimental-modules generate-storacha-agent.js
>>>>>>> b0074b9 (Initial commit: source, config, docs)
