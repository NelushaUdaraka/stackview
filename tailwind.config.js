/** @type {import('tailwindcss').Config} */

// Elevation scale tinted by the active theme (--shadow / --shadow-strength are
// set per light/dark mode in src/shared/themes.ts), so popovers and dialogs read
// as raised in dark themes without looking muddy in light ones.
const shade = (alpha) => `rgb(var(--shadow) / calc(${alpha} * var(--shadow-strength)))`

module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        sm: `0 1px 2px 0 ${shade(0.05)}`,
        DEFAULT: `0 1px 3px 0 ${shade(0.08)}, 0 1px 2px -1px ${shade(0.08)}`,
        md: `0 4px 8px -2px ${shade(0.08)}, 0 2px 4px -2px ${shade(0.06)}`,
        lg: `0 12px 20px -6px ${shade(0.1)}, 0 4px 8px -4px ${shade(0.06)}`,
        xl: `0 20px 32px -8px ${shade(0.12)}, 0 8px 12px -6px ${shade(0.08)}`,
        '2xl': `0 28px 56px -12px ${shade(0.18)}, 0 12px 20px -8px ${shade(0.08)}`
      }
    }
  },
  plugins: []
}
