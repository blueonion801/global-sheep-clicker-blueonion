import React, { createContext, useContext } from 'react';
import { THEMES } from '../types/game';

interface ThemeContextType {
  currentTheme: typeof THEMES[0];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  selectedTheme: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, selectedTheme }) => {
  const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ currentTheme }}>
      <div 
        className={`min-h-screen bg-gradient-to-br ${currentTheme.colors.background} transition-all duration-1000`}
        style={{
          '--theme-primary': currentTheme.colors.primary,
          '--theme-secondary': currentTheme.colors.secondary,
          '--theme-accent': currentTheme.colors.accent,
          '--theme-gradient': `linear-gradient(to right, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};