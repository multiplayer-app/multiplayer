import React, { createContext, useContext, useState, ReactNode } from "react";

interface SettingsLayoutContextType {
  isOpen: boolean;
  onToggle: () => void;
}

const SettingsLayoutContext = createContext<SettingsLayoutContextType | undefined>(
  undefined
);

export const SettingsLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <SettingsLayoutContext.Provider value={{ isOpen, onToggle }}>
      {children}
    </SettingsLayoutContext.Provider>
  );
};

export const useSettingsLayout = () => {
  const context = useContext(SettingsLayoutContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsLayout must be used within a SettingsLayoutProvider"
    );
  }
  return context;
};
