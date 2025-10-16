
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === Theme.DARK || savedTheme === Theme.LIGHT || savedTheme === Theme.SYSTEM) {
      return savedTheme;
    }
    return Theme.SYSTEM; // Default to system theme
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Get the effective theme (resolves system theme to actual light/dark)
  const getEffectiveTheme = useCallback(() => {
    if (theme === Theme.SYSTEM) {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Apply theme to DOM
  const applyTheme = useCallback((effectiveTheme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class with smooth transition
    root.classList.add(effectiveTheme);
    
    // Set body background color
    if (effectiveTheme === 'dark') {
      document.body.style.backgroundColor = '#1a1a1a';
    } else {
      document.body.style.backgroundColor = '#f9fafb';
    }
    
    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1a1a1a' : '#f9fafb');
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Also listen for the older addListener method for better browser support
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // Apply theme when theme or system theme changes
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme();
    applyTheme(effectiveTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, systemTheme, getEffectiveTheme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => {
      if (prevTheme === Theme.SYSTEM) {
        return systemTheme === 'dark' ? Theme.LIGHT : Theme.DARK;
      }
      return prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    });
  }, [systemTheme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme, 
      systemTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};