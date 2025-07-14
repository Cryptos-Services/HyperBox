import React from "react";
import { AppGridItem } from "../../types/AppGridItem";
import UserTypeSelector from "../UserTypeSelector/UserTypeSelector";

interface FooterProps {
  userTypes: AppGridItem[]; // Correction ici
  selectedType: string;
  onSelectType: (name: string) => void;
  onOpenSettings?: () => void;
  settingsOpen?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  userTypes,
  selectedType,
  onSelectType,
  onOpenSettings,
  settingsOpen = false, // Valeur par défaut
}) => (
  <footer className="w-auto h-[36px] bg-[#030121] flex items-center justify-between border-y-[1px] border-[#FFDE59] px-[8px]">
    <div>
      <UserTypeSelector
        userTypes={userTypes}
        selectedType={selectedType}
        onSelectType={onSelectType}
      />
    </div>

    <div className="flex items-center gap-[4px]">
      <a
        className="bg-[#FFFFFF00] w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer"
        title="Cryptos Services"
        onClick={() => window.open("https://cryptosservices.fr/", "_blank")}
      >
        <img
          src="https://img1.wsimg.com/isteam/ip/6d25da8f-89df-417e-a036-7e4d7ef17267/blob-5ec6088.png/:/rs=w:69,h:69,cg:true,m/cr=w:69,h:69/qt=q:95"
          alt=""
          className="w-[28px] h-[28px]"
        />
      </a>
      <button
        className={`bg-[#FFFFFF00] pb-[4px] w-[30px] h-[30px] text-[22px] cursor-pointer rounded-full border border-[#ffde59] flex items-center justify-center transition-colors
    ${
      settingsOpen
        ? "bg-[#008000] text-[#ff00ff]"
        : "bg-[#FFFFFF00] text-[#ff00ff]"
    }
    hover:bg-[#008000] hover:text-[#ec53ec]`}
        title="Paramètres"
        onClick={onOpenSettings}
      >
        ⚙️
      </button>
    </div>
  </footer>
);

export default Footer;
