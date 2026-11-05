import { onMounted, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // localStorage unavailable (private mode); fall back to system
  }
  return null
}

function writeStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
  }
}

// Shared state across all useTheme() callers
const theme = ref<Theme>('light')

let initialized = false
function init() {
  if (initialized) return
  initialized = true
  const stored = readStoredTheme()
  theme.value = stored ?? getSystemTheme()
  applyTheme(theme.value)

  if (typeof window !== 'undefined') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', (e) => {
      // Only follow system when no manual choice stored
      if (readStoredTheme() === null) {
        theme.value = e.matches ? 'dark' : 'light'
      }
    })
  }
}

export function useTheme() {
  if (!initialized) init()

  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    writeStoredTheme(theme.value)
  }

  watch(theme, (value) => {
    applyTheme(value)
  })

  onMounted(() => {
    applyTheme(theme.value)
  })

  return { theme, toggle }
}