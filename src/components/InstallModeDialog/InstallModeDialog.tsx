import React from "react";

interface InstallModeDialogProps {
  open: boolean;
  appName: string;
  appPath: string;
  onChoice: (mode: "keep" | "move") => void;
  onCancel: () => void;
  isInstalling?: boolean;
  installProgress?: number;
  installStatus?: string;
}

const InstallModeDialog: React.FC<InstallModeDialogProps> = ({
  open,
  appName,
  appPath,
  onChoice,
  onCancel,
  isInstalling = false,
  installProgress = 0,
  installStatus = "",
}) => {
  if (!open) return null;

  return (
    <div className="install-dialog-overlay">
      <div>
        <h3 className="text-[#FFDE59] text-[16px] font-bold mb-[4px] text-center">
          📦 Mode d'Installation
        </h3>

        <div className="install-dialog-section">
          <p className="install-dialog-section-label">
            Comment voulez-vous ajouter :
          </p>
          <div className="install-dialog-card">
            <div className="install-dialog-appname">{appName}</div>
            <div className="install-dialog-apppath">{appPath}</div>
          </div>
        </div>

        {isInstalling && (
          <div className="install-dialog-progress-section">
            <div className="install-dialog-status">{installStatus}</div>
            <div className="install-dialog-progress-bg">
              <div className="install-dialog-progress-bar width: ${installProgress}%"></div>
            </div>
            <div className="install-dialog-progress-text">
              {installProgress}%
            </div>
          </div>
        )}

        <div className="install-dialog-btns">
          <button
            onClick={() => onChoice("keep")}
            disabled={isInstalling}
            className="install-dialog-btn"
          >
            <div className="install-dialog-btn-content">
              <span className="install-dialog-btn-icon">🔗</span>
              <div>
                <div className="install-dialog-btn-title">
                  Conserver l'emplacement
                </div>
                <div className="install-dialog-btn-desc">
                  Crée un raccourci vers l'emplacement actuel
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onChoice("move")}
            disabled={isInstalling}
            className="install-dialog-btn"
          >
            <div className="install-dialog-btn-content">
              <span className="install-dialog-btn-icon">📦</span>
              <div>
                <div className="install-dialog-btn-title">
                  Déplacer vers HyperBox
                </div>
                <div className="install-dialog-btn-desc">
                  Centralise l'application dans HyperBox
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="install-dialog-actions">
          <button onClick={onCancel} className="install-dialog-cancel">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallModeDialog;
