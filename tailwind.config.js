/** @type {import('tailwindcss').Config} */

// Every color below resolves through a CSS custom property, so a theme swap is
// a variable swap — no Tailwind class in any component has to change. The
// `<alpha-value>` placeholder keeps the `/10`, `/30` … opacity modifiers working.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

// `brand-*` predates the token system and is still used across the service
// layouts. Every step maps to the theme accent so those call sites pick up the
// active palette; the numeric scale survives only for backwards compatibility.
const brand = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [step, token('--accent')])
)

module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        brand,
        accent: {
          DEFAULT: token('--accent'),
          soft: token('--accent-soft'),
          contrast: token('--accent-contrast'),
        },
        ok: token('--ok'),
        warn: token('--warn'),
        danger: token('--danger'),

        chrome: token('--bg-base'),
        surface: token('--bg-app'),
        raised: token('--bg-raised'),
        overlay: token('--bg-overlay'),
        hair: token('--hair'),
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        // The design's micro-type steps, which the default Tailwind scale skips.
        '2xs': ['10px', '14px'],
        '3xs': ['9px', '12px'],
      },
    },
  },
  plugins: [],
}
