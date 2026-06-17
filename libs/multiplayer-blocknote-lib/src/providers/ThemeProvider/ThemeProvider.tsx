import { createContext, useContext, ReactNode } from 'react'

interface IThemeContext {
  theme: 'light' | 'dark'
}

const ThemeContext = createContext<IThemeContext | null>(null)

const ThemeProvider = ({ children, theme = 'light' }: { children: ReactNode; theme?: 'light' | 'dark' }) => {
  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export { ThemeProvider }
