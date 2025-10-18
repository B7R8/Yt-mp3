
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLight: boolean;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage for saved theme on initialization
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    }
    // Default to light mode if no saved theme
    return 'light';
  });

  // Apply theme to DOM immediately
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(newTheme);
    
    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0f0f0f' : '#ffffff');
    }
    
    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
  }, []);

  // Initialize theme on mount - sync with what was set in HTML
  useEffect(() => {
    // Check what theme is currently applied to the DOM
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    // If there's a mismatch, use the saved theme
    if (savedTheme && savedTheme !== currentTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Sync the state with what's currently applied
      setTheme(currentTheme);
      if (!savedTheme) {
        localStorage.setItem('theme', currentTheme);
      }
    }
  }, [applyTheme]);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      return newTheme;
    });
  }, []);

  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      isLight,
      isDark
    }}>
      {children}
    </ThemeContext.Provider>
  );
};