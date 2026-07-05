import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'weavectl-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

function systemPrefersDark(): boolean {
  return media.matches
}

/** An explicit user choice persisted in localStorage, or null to follow the system. */
function readStoredTheme(): ThemeMode | null {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : null
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeStore {
  theme: ThemeMode
  /** Explicitly set and persist a theme, overriding the system preference. */
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
}

const initialTheme: ThemeMode = readStoredTheme() ?? (systemPrefersDark() ? 'dark' : 'light')
applyTheme(initialTheme)

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initialTheme,

  setTheme(t) {
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
    set({ theme: t })
  },

  toggleTheme() {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
  },
}))

// Live-follow OS theme changes for as long as the user hasn't made an explicit choice.
media.addEventListener('change', (e) => {
  if (readStoredTheme() !== null) return
  const t: ThemeMode = e.matches ? 'dark' : 'light'
  applyTheme(t)
  useThemeStore.setState({ theme: t })
})
