import React, { useEffect } from "react";
import "../../index.css";
import { useContextMenu } from "./ContextMenuContext";

const ContextMenu: React.FC = () => {
  const { x, y, options, visible, hideMenu } = useContextMenu();

  useEffect(() => {
    if (!visible) return;
    const onClick = () => hideMenu();
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [visible, hideMenu]);

  if (!visible) return null;

  return (
    <div
      className="context-menu bg-[#030121] text-[#f0f0f0] rounded-lg shadow-lg min-w-[160px] p-[1.5px] border border-[#ffde59] flex flex-col context-menu-top context-menu-left"
      onContextMenu={(e) => e.preventDefault()}
    >
      {options.map((opt, i) => (
        <div
          key={i}
          className={`px-[3px] py-[2px] flex items-center gap-[2px] cursor-pointer select-none hover:bg-[#2a2250] ${
            opt.danger ? "text-[#ff0000]" : ""
          }`}
          onClick={() => {
            hideMenu();
            opt.onClick();
          }}
        >
          {opt.icon}
          {opt.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
