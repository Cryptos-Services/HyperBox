import React from "react";

interface UserTypeSelectorProps {
  userTypes: { name: string; color?: string }[]; // color devient optionnel
  selectedType: string;
  onSelectType: (name: string) => void;
}

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({
  userTypes,
  selectedType,
  onSelectType,
}) => {
  return (
    <select
      className="rounded-[8px] px-[6px] py-[2px] bg-[#000000] text-[#ffffff] border-1 border-[#FFDE59] focus:outline-none mr-[8px]"
      value={selectedType}
      onChange={(e) => onSelectType(e.target.value)}
      aria-label="Choix du mode d’utilisation"
    >
      {userTypes.map((type) => (
        <option key={type.name} value={type.name}>
          {type.name}
        </option>
      ))}
    </select>
  );
};

export default UserTypeSelector;
