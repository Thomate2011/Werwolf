// src/ViewModeContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

type ViewMode = 'mobile' | 'desktop';

interface ViewModeContextType {
  viewMode: ViewMode;
  toggleViewMode: () => void;
  // Utility-Funktionen für Klassen
  container: string;
  padding: string;
  textXl: string;
  text2xl: string;
  text3xl: string;
  text4xl: string;
  text6xl: string;
  buttonPy: string;
  buttonPx: string;
  maxHeight: string;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile');
  };

  // Klassen-Mappings
  const classes: ViewModeContextType = {
    viewMode,
    toggleViewMode,
    container: viewMode === 'mobile' ? 'max-w-lg' : 'max-w-3xl',
    padding: viewMode === 'mobile' ? 'p-8' : 'p-12',
    textXl: viewMode === 'mobile' ? 'text-lg' : 'text-xl',
    text2xl: viewMode === 'mobile' ? 'text-xl' : 'text-2xl',
    text3xl: viewMode === 'mobile' ? 'text-2xl' : 'text-4xl',
    text4xl: viewMode === 'mobile' ? 'text-2xl' : 'text-4xl',
    text6xl: viewMode === 'mobile' ? 'text-5xl' : 'text-6xl',
    buttonPy: viewMode === 'mobile' ? 'py-3' : 'py-4',
    buttonPx: viewMode === 'mobile' ? 'px-6' : 'px-8',
    maxHeight: viewMode === 'mobile' ? 'max-h-80' : 'max-h-96',
  };

  return (
    <ViewModeContext.Provider value={classes}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = (): ViewModeContextType => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};