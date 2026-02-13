import type { AccentColor } from '../types'

export const ACCENT_COLORS: Record<AccentColor, { 
  name: string
  primary: string
  primaryLight: string
  primaryDark: string
}> = {
  sky: {
    name: 'Sky',
    primary: '#0ea5e9',
    primaryLight: '#e0f2fe',
    primaryDark: '#0369a1',
  },
  violet: {
    name: 'Violet',
    primary: '#8b5cf6',
    primaryLight: '#ede9fe',
    primaryDark: '#6d28d9',
  },
  rose: {
    name: 'Rose',
    primary: '#f43f5e',
    primaryLight: '#ffe4e6',
    primaryDark: '#be123c',
  },
  amber: {
    name: 'Amber',
    primary: '#f59e0b',
    primaryLight: '#fef3c7',
    primaryDark: '#b45309',
  },
  emerald: {
    name: 'Emerald',
    primary: '#10b981',
    primaryLight: '#d1fae5',
    primaryDark: '#047857',
  },
}

export function applyAccentColor(color: AccentColor) {
  const theme = ACCENT_COLORS[color]
  document.documentElement.style.setProperty('--color-primary', theme.primary)
  document.documentElement.style.setProperty('--color-primary-light', theme.primaryLight)
  document.documentElement.style.setProperty('--color-primary-dark', theme.primaryDark)
}

export function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
