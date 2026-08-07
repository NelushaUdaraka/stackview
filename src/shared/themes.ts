import {
  DESIGN_THEME_DEFINITIONS,
  DESIGN_THEME_CSS_VARS,
  LIGHT_DESIGN_THEMES,
} from './designThemes'

/**
 * The app's original look, kept as the default so an upgrade changes nothing until
 * the user picks a direction. It carries colour only — `design-themes.css` supplies
 * `:root` fallbacks for the other 20 tokens.
 */
export const BASE_THEME_DEFINITIONS = {
  dark: {
    label: 'Dark',
    group: 'Default',
    preview: { bg: '#090909', surface: '#121212', text: '#fafafa', accent: '#0ea5e9' },
  },
} as const

export const BASE_THEME_CSS_VARS: Record<keyof typeof BASE_THEME_DEFINITIONS, Record<string, string>> = {
  dark: {
    '--bg-app':          '0 0 0',
    '--bg-base':         '9 9 9',
    '--bg-raised':       '18 18 18',
    '--bg-overlay':      '28 28 28',
    '--border':          '28 28 28',
    '--border-sub':      '18 18 18',
    '--text-1':          '250 250 250',
    '--text-2':          '163 163 163',
    '--text-3':          '115 115 115',
    '--text-4':          '82 82 82',
    '--scrollbar-thumb': '#333333',
  },
}

export const THEME_DEFINITIONS = {
  ...BASE_THEME_DEFINITIONS,
  ...DESIGN_THEME_DEFINITIONS,
} as const

export type Theme = keyof typeof THEME_DEFINITIONS

export const ALL_THEMES = Object.keys(THEME_DEFINITIONS) as Theme[]

/** Fallback when the persisted theme is unknown — e.g. a removed colour theme. */
export const DEFAULT_THEME: Theme = 'dark'

/** Ordered group headings for the theme picker. */
export const THEME_GROUPS = ['Default', 'Directions'] as const

/** CSS custom-property values for each theme, keyed by property name. */
export const THEME_CSS_VARS: Record<Theme, Record<string, string>> = {
  ...BASE_THEME_CSS_VARS,
  ...DESIGN_THEME_CSS_VARS,
}

/** Themes on a light canvas — drives `nativeTheme.themeSource` in the main process. */
export const LIGHT_THEMES: Theme[] = [...LIGHT_DESIGN_THEMES]

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (ALL_THEMES as string[]).includes(value)
}
