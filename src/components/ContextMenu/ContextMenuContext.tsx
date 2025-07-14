import React, { createContext, ReactNode, useContext, useState } from "react";

export type ContextMenuOption = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
};

type ContextMenuState = {
  x: number;
  y: number;
  options: ContextMenuOption[];
  visible: boolean;
};

type ContextMenuContextType = {
  showMenu: (x: number, y: number, options: ContextMenuOption[]) => void;
  hideMenu: () => void;
} & ContextMenuState;

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(
  undefined
);

export const useContextMenu = () => {
  const ctx = useContext(ContextMenuContext);
  if (!ctx)
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  return ctx;
};

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    options: [],
    visible: false,
  });

  const showMenu = (x: number, y: number, options: ContextMenuOption[]) => {
    setState({ x, y, options, visible: true });
  };

  const hideMenu = () => setState((s) => ({ ...s, visible: false }));

  return (
    <ContextMenuContext.Provider value={{ ...state, showMenu, hideMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};
