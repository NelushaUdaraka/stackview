/**
 * StackView theming — the "Slate Split" design.
 *
 * Every theme is the *same design*. The surface roles, their relationships and
 * the density they imply are fixed; only the colors change. A theme declares a
 * compact palette below and the CSS custom properties that components actually
 * read are derived from it — so adding a theme is one entry, never a block of
 * hand-written variables that can drift out of step with the others.
 *
 * Surface ramp, darkest-reading to lightest-reading (inverted for light themes):
 *
 *   chrome   panels — nav rail, sidebars, inspector, table headers, inputs
 *   app      content — the main working surface, sits *above* chrome
 *   raised   hover and selected rows, chips, secondary buttons
 *   overlay  one step further — pressed states, wells nested inside raised
 *   border   hairlines that separate regions
 *   hair     brighter than border, for dividers that must read as a line
 */

export interface ThemePalette {
  label: string
  /** Drives `nativeTheme.themeSource` and the light/dark state-color defaults. */
  dark: boolean
  chrome: string
  app: string
  raised: string
  overlay: string
  border: string
  hair: string
  /** Primary text. */
  t1: string
  /** Secondary text — labels, inactive tabs. */
  t2: string
  /** Tertiary text — captions, placeholders. */
  t3: string
  /** Quaternary text — disabled, gutter numbers. */
  t4: string
  /** Primary action color. Also the "warn"/pending state in status mappings. */
  accent: string
  ok: string
  warn: string
  danger: string
}

export const THEME_PALETTES = {
  'slate-split': {
    label: 'Slate Split', dark: true,
    chrome: '#15171a', app: '#1b1d21', raised: '#22252a', overlay: '#2b2f35',
    border: '#32363d', hair: '#3f444c',
    t1: '#eef1f5', t2: '#a8b0bd', t3: '#7d8592', t4: '#5d6470',
    accent: '#e0993e', ok: '#5bc98f', warn: '#e0993e', danger: '#e05b4e',
  },

  light: {
    label: 'Light', dark: false,
    chrome: '#f4f7fa', app: '#ffffff', raised: '#e9eef4', overlay: '#dde5ee',
    border: '#d8e0ea', hair: '#c3cdd9',
    t1: '#0f172a', t2: '#475569', t3: '#64748b', t4: '#94a3b8',
    accent: '#0284c7', ok: '#15803d', warn: '#b45309', danger: '#b91c1c',
  },
  'quiet-light': {
    label: 'Quiet Light', dark: false,
    chrome: '#f0f0f0', app: '#fafafa', raised: '#e6e6e6', overlay: '#dbdbdb',
    border: '#d0d0d0', hair: '#bcbcbc',
    t1: '#333333', t2: '#555555', t3: '#777777', t4: '#aaaaaa',
    accent: '#4b83cd', ok: '#448c27', warn: '#a67f0a', danger: '#a31515',
  },
  'solarized-light': {
    label: 'Solarized Light', dark: false,
    chrome: '#f2ecd9', app: '#fdf6e3', raised: '#e8e1cb', overlay: '#ddd6bd',
    border: '#cec7ae', hair: '#b9b299',
    t1: '#586e75', t2: '#657b83', t3: '#839496', t4: '#93a1a1',
    accent: '#b58900', ok: '#859900', warn: '#cb4b16', danger: '#dc322f',
  },
  'tokyo-day': {
    label: 'Tokyo Day', dark: false,
    chrome: '#dfe0e6', app: '#e9eaef', raised: '#d5d6dd', overlay: '#c9cad3',
    border: '#bcbeca', hair: '#a8abbb',
    t1: '#343e58', t2: '#4c5a87', t3: '#6172b0', t4: '#8990b8',
    accent: '#2e7de9', ok: '#587539', warn: '#8c6c3e', danger: '#f52a65',
  },

  dark: {
    label: 'Dark', dark: true,
    chrome: '#0d0d0d', app: '#131313', raised: '#1e1e1e', overlay: '#272727',
    border: '#2c2c2c', hair: '#3d3d3d',
    t1: '#fafafa', t2: '#a3a3a3', t3: '#737373', t4: '#525252',
    accent: '#e0993e', ok: '#5bc98f', warn: '#e0993e', danger: '#e05b4e',
  },
  midnight: {
    label: 'Midnight', dark: true,
    chrome: '#0b1220', app: '#0f172a', raised: '#1e293b', overlay: '#293548',
    border: '#334155', hair: '#44536b',
    t1: '#f1f5f9', t2: '#94a3b8', t3: '#64748b', t4: '#475569',
    accent: '#38bdf8', ok: '#4ade80', warn: '#fbbf24', danger: '#f87171',
  },
  abyss: {
    label: 'Abyss', dark: true,
    chrome: '#000814', app: '#000f22', raised: '#06182f', overlay: '#0d2748',
    border: '#1a3d70', hair: '#27528f',
    t1: '#6688cc', t2: '#5779b8', t3: '#425f94', t4: '#2f4670',
    accent: '#2f7fd1', ok: '#46a758', warn: '#d9a441', danger: '#d84a4a',
  },
  nord: {
    label: 'Nord', dark: true,
    chrome: '#242933', app: '#2e3440', raised: '#3b4252', overlay: '#434c5e',
    border: '#4c566a', hair: '#5c6b81',
    t1: '#eceff4', t2: '#d8dee9', t3: '#a3b1c2', t4: '#7b899c',
    accent: '#88c0d0', ok: '#a3be8c', warn: '#ebcb8b', danger: '#bf616a',
  },
  mocha: {
    label: 'Mocha', dark: true,
    chrome: '#181825', app: '#1e1e2e', raised: '#313244', overlay: '#45475a',
    border: '#45475a', hair: '#585b70',
    t1: '#cdd6f4', t2: '#a6adc8', t3: '#7f849c', t4: '#6c7086',
    accent: '#cba6f7', ok: '#a6e3a1', warn: '#f9e2af', danger: '#f38ba8',
  },
  macchiato: {
    label: 'Macchiato', dark: true,
    chrome: '#1e2030', app: '#24273a', raised: '#363a4f', overlay: '#494d64',
    border: '#494d64', hair: '#5b6078',
    t1: '#cad3f5', t2: '#a5adcb', t3: '#8087a2', t4: '#6e738d',
    accent: '#c6a0f6', ok: '#a6da95', warn: '#eed49f', danger: '#ed8796',
  },
  frappe: {
    label: 'Frappé', dark: true,
    chrome: '#292c3c', app: '#303446', raised: '#414559', overlay: '#51576d',
    border: '#51576d', hair: '#626880',
    t1: '#c6d0f5', t2: '#a5adce', t3: '#838ba7', t4: '#737994',
    accent: '#ca9ee6', ok: '#a6d189', warn: '#e5c890', danger: '#e78284',
  },
  solarized: {
    label: 'Solarized', dark: true,
    chrome: '#002b36', app: '#073642', raised: '#134350', overlay: '#235360',
    border: '#2c5c68', hair: '#3d6d78',
    t1: '#fdf6e3', t2: '#eee8d5', t3: '#93a1a1', t4: '#657b83',
    accent: '#b58900', ok: '#859900', warn: '#cb4b16', danger: '#dc322f',
  },
  dracula: {
    label: 'Dracula', dark: true,
    chrome: '#21222c', app: '#282a36', raised: '#343746', overlay: '#44475a',
    border: '#44475a', hair: '#565a70',
    t1: '#f8f8f2', t2: '#c9c6dd', t3: '#8f8ba8', t4: '#6272a4',
    accent: '#bd93f9', ok: '#50fa7b', warn: '#f1fa8c', danger: '#ff5555',
  },
  gruvbox: {
    label: 'Gruvbox', dark: true,
    chrome: '#1d2021', app: '#282828', raised: '#3c3836', overlay: '#504945',
    border: '#504945', hair: '#665c54',
    t1: '#ebdbb2', t2: '#d5c4a1', t3: '#a89984', t4: '#7c6f64',
    accent: '#fabd2f', ok: '#b8bb26', warn: '#fe8019', danger: '#fb4934',
  },
  kimbie: {
    label: 'Kimbie Dark', dark: true,
    chrome: '#1c150c', app: '#221a0f', raised: '#2c2316', overlay: '#3a2e1e',
    border: '#4e3e2a', hair: '#63503a',
    t1: '#d3af86', t2: '#b4946c', t3: '#8a6f4c', t4: '#6b543a',
    accent: '#f79a32', ok: '#889b4a', warn: '#f79a32', danger: '#dc3958',
  },
  monokai: {
    label: 'Monokai', dark: true,
    chrome: '#1e1e1c', app: '#272822', raised: '#32332c', overlay: '#3e4038',
    border: '#4b4c43', hair: '#5f6055',
    t1: '#f8f8f2', t2: '#d4d3ba', t3: '#94927b', t4: '#75715e',
    accent: '#e6db74', ok: '#a6e22e', warn: '#fd971f', danger: '#f92672',
  },
  'monokai-dimmed': {
    label: 'Monokai Dimmed', dark: true,
    chrome: '#161614', app: '#1e1e1a', raised: '#282823', overlay: '#34342e',
    border: '#40403a', hair: '#52524a',
    t1: '#c5c5be', t2: '#a5a59e', t3: '#787872', t4: '#4e4e48',
    accent: '#6e9cbe', ok: '#9aa83a', warn: '#d08770', danger: '#c76b6b',
  },
  red: {
    label: 'Red', dark: true,
    chrome: '#200000', app: '#390000', raised: '#4a0808', overlay: '#5a1010',
    border: '#6e1c1c', hair: '#8a2c2c',
    t1: '#f8f8f8', t2: '#dcc8c8', t3: '#aa8c8c', t4: '#785a5a',
    accent: '#ffab70', ok: '#7fd67f', warn: '#ffab70', danger: '#ff6b6b',
  },
  'tokyo-night': {
    label: 'Tokyo Night', dark: true,
    chrome: '#16161e', app: '#1a1b26', raised: '#24283b', overlay: '#292e42',
    border: '#3b4261', hair: '#4c5478',
    t1: '#c0caf5', t2: '#a9b1d6', t3: '#7a83b3', t4: '#565f89',
    accent: '#7aa2f7', ok: '#9ece6a', warn: '#e0af68', danger: '#f7768e',
  },
  'tokyo-storm': {
    label: 'Tokyo Storm', dark: true,
    chrome: '#1f2335', app: '#24283b', raised: '#292e42', overlay: '#2f3450',
    border: '#3b4261', hair: '#4c5478',
    t1: '#c0caf5', t2: '#a9b1d6', t3: '#7a83b3', t4: '#565f89',
    accent: '#7aa2f7', ok: '#9ece6a', warn: '#e0af68', danger: '#f7768e',
  },
  'rose-pine': {
    label: 'Rose Pine', dark: true,
    chrome: '#16141f', app: '#191724', raised: '#1f1d2e', overlay: '#26233a',
    border: '#35314d', hair: '#4a4463',
    t1: '#e0def4', t2: '#c4bfe0', t3: '#908caa', t4: '#6e6a86',
    accent: '#ebbcba', ok: '#9ccfd8', warn: '#f6c177', danger: '#eb6f92',
  },
  ayu: {
    label: 'Ayu', dark: true,
    chrome: '#131721', app: '#1c2433', raised: '#253044', overlay: '#2e3c53',
    border: '#38455e', hair: '#4a5872',
    t1: '#e6e1cf', t2: '#b5b7b3', t3: '#8a8f97', t4: '#5c6673',
    accent: '#ffb454', ok: '#b8cc52', warn: '#ffb454', danger: '#ff3333',
  },
  everforest: {
    label: 'Everforest', dark: true,
    chrome: '#232a2e', app: '#2d353b', raised: '#343f44', overlay: '#3d484d',
    border: '#475258', hair: '#56646c',
    t1: '#d3c6aa', t2: '#9da9a0', t3: '#7a8478', t4: '#5c6a72',
    accent: '#a7c080', ok: '#a7c080', warn: '#dbbc7f', danger: '#e67e80',
  },
  kanagawa: {
    label: 'Kanagawa', dark: true,
    chrome: '#16161d', app: '#1f1f28', raised: '#2a2a37', overlay: '#363646',
    border: '#44444f', hair: '#54546d',
    t1: '#dcd7ba', t2: '#c8c093', t3: '#938f7f', t4: '#727169',
    accent: '#7e9cd8', ok: '#98bb6c', warn: '#ffa066', danger: '#e82424',
  },
  'one-dark': {
    label: 'One Dark', dark: true,
    chrome: '#21252b', app: '#282c34', raised: '#2c313c', overlay: '#383e4a',
    border: '#454b56', hair: '#5a616e',
    t1: '#d7dae0', t2: '#abb2bf', t3: '#828997', t4: '#5c6370',
    accent: '#61afef', ok: '#98c379', warn: '#e5c07b', danger: '#e06c75',
  },
  'night-owl': {
    label: 'Night Owl', dark: true,
    chrome: '#011627', app: '#0d2035', raised: '#0b2942', overlay: '#132f4c',
    border: '#1f3f5f', hair: '#2d5478',
    t1: '#d6deeb', t2: '#a3b3cc', t3: '#5c758c', t4: '#44607a',
    accent: '#82aaff', ok: '#addb67', warn: '#ecc48d', danger: '#ef5350',
  },
  'tomorrow-blue': {
    label: 'Tomorrow Blue', dark: true,
    chrome: '#002451', app: '#003064', raised: '#003f8f', overlay: '#0050ad',
    border: '#0057b8', hair: '#1a6fd0',
    t1: '#ffffff', t2: '#bbdaff', t3: '#8098c8', t4: '#5a76ad',
    accent: '#ffc58f', ok: '#d1f1a9', warn: '#ffc58f', danger: '#ff9da4',
  },
  synthwave: {
    label: 'Synthwave', dark: true,
    chrome: '#14092a', app: '#1a1139', raised: '#241650', overlay: '#321d66',
    border: '#40277f', hair: '#543399',
    t1: '#ffffff', t2: '#cdc7e0', t3: '#848bbd', t4: '#615891',
    accent: '#ff7edb', ok: '#72f1b8', warn: '#fede5d', danger: '#fe4450',
  },
  horizon: {
    label: 'Horizon', dark: true,
    chrome: '#16141f', app: '#1c1e26', raised: '#232530', overlay: '#2e3040',
    border: '#3b3d4d', hair: '#4e4f5c',
    t1: '#d5d8da', t2: '#b9bcc4', t3: '#848793', t4: '#6a6c78',
    accent: '#fab795', ok: '#29d398', warn: '#fac29a', danger: '#e95678',
  },
  moonlight: {
    label: 'Moonlight', dark: true,
    chrome: '#191a2a', app: '#212337', raised: '#2f334d', overlay: '#383c5a',
    border: '#444a73', hair: '#545c85',
    t1: '#c8d3f5', t2: '#a9b8e8', t3: '#7a88cf', t4: '#5c6796',
    accent: '#c099ff', ok: '#c3e88d', warn: '#ffc777', danger: '#ff757f',
  },
} as const satisfies Record<string, ThemePalette>

export type Theme = keyof typeof THEME_PALETTES

export const ALL_THEMES = Object.keys(THEME_PALETTES) as Theme[]

/** The palette the app opens with, and the fallback for an unrecognised saved value. */
export const DEFAULT_THEME: Theme = 'slate-split'

// ── Derivation ──────────────────────────────────────────────────────────────

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/** `"238 241 245"` — the space-separated form `rgb(var(--x) / <alpha>)` needs. */
function triplet(hex: string): string {
  return channels(hex).join(' ')
}

/** Relative luminance, good enough for picking readable text over a fill. */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = channels(a)
  const [br, bg, bb] = channels(b)
  const at = (x: number, y: number) => Math.round(x + (y - x) * t)
  return [at(ar, br), at(ag, bg), at(ab, bb)].join(' ')
}

function varsFor(p: ThemePalette): Record<string, string> {
  return {
    '--bg-app': triplet(p.app),
    '--bg-base': triplet(p.chrome),
    '--bg-raised': triplet(p.raised),
    '--bg-overlay': triplet(p.overlay),

    '--border': triplet(p.border),
    // Row separators inside a list read as a tint of the surface, not a line.
    '--border-sub': triplet(p.raised),
    '--hair': triplet(p.hair),

    '--text-1': triplet(p.t1),
    '--text-2': triplet(p.t2),
    '--text-3': triplet(p.t3),
    '--text-4': triplet(p.t4),

    '--accent': triplet(p.accent),
    // The flat chip fill behind accent text — accent bled into the panel tone.
    '--accent-soft': mix(p.chrome, p.accent, 0.18),
    // Text/icons sitting *on* a solid accent fill.
    '--accent-contrast': luminance(p.accent) > 0.45 ? triplet(p.chrome) : '255 255 255',

    '--ok': triplet(p.ok),
    '--warn': triplet(p.warn),
    '--danger': triplet(p.danger),

    '--scrollbar-thumb': triplet(p.hair),
  }
}

/** CSS custom-property values for each theme, keyed by property name. */
export const THEME_CSS_VARS: Record<Theme, Record<string, string>> = Object.fromEntries(
  ALL_THEMES.map(t => [t, varsFor(THEME_PALETTES[t])])
) as Record<Theme, Record<string, string>>

/** Label + swatch colors for the theme picker. */
export const THEME_DEFINITIONS: Record<
  Theme,
  { label: string; preview: { bg: string; surface: string; text: string; accent: string } }
> = Object.fromEntries(
  ALL_THEMES.map(t => {
    const p = THEME_PALETTES[t]
    return [t, { label: p.label, preview: { bg: p.app, surface: p.chrome, text: p.t1, accent: p.accent } }]
  })
) as Record<Theme, { label: string; preview: { bg: string; surface: string; text: string; accent: string } }>

/** Whether a theme reads as dark — drives `nativeTheme.themeSource` in the main process. */
export const THEME_IS_DARK: Record<Theme, boolean> = Object.fromEntries(
  ALL_THEMES.map(t => [t, THEME_PALETTES[t].dark])
) as Record<Theme, boolean>
