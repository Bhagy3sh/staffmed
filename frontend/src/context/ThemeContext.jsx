import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('staffmed_dark') === 'true');

  const onThemeToggle = (e) => {
    const val = e.target.checked;
    setIsDark(val);
    localStorage.setItem('staffmed_dark', val);
  };

  return (
    <ThemeContext.Provider value={{ isDark, onThemeToggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
