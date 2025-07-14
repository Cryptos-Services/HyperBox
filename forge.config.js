const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    name: "HyperBox",
    executableName: "HyperBox",
    icon: "./src/assets/icon.ico",
    out: "out",
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    // ✅ WiX - Installeur Windows avec choix de répertoire
    /*{
      name: "@electron-forge/maker-wix",
      config: {
        name: "HyperBox",
        description: "HyperBox - Gestionnaire d'applications modulaire",
        manufacturer: "HyperBox Team",
        version: "1.0.0",
        icon: "./src/assets/icon.ico",
        // ✅ Permettre le choix du répertoire
        ui: {
          chooseDirectory: true,
        },
        // ✅ Raccourcis
        shortcuts: [
          {
            name: "HyperBox",
            description: "Gestionnaire d'applications HyperBox",
            target: "[INSTALLDIR]HyperBox.exe",
            workingDirectory: "[INSTALLDIR]",
            icon: "./src/assets/icon.ico",
          },
        ],
      },
    },
    // ✅ Garder Squirrel pour installation rapide
    / {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "HyperBox",
        setupIcon: "./src/assets/icon.ico",
      },
    },*/
    // ✅ Version portable
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32"],
      config: {
        name: "HyperBox-Portable",
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
