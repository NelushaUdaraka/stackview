import { Check } from 'lucide-react'
import { THEME_DEFINITIONS, THEME_GROUPS, ALL_THEMES } from '../../../../shared/themes'
import type { Theme } from '../../types'

interface ThemePickerProps {
  theme: Theme
  onSetTheme: (t: Theme) => void
}

/**
 * Swatch grid for the settings menus in NavRail and ConnectionScreen.
 * Grouped by `THEME_DEFINITIONS[k].group` so the design directions sit under their
 * own heading. Each swatch previews canvas, surface, text and accent.
 */
export default function ThemePicker({ theme, onSetTheme }: ThemePickerProps) {
  return (
    <div className="space-y-2.5">
      {THEME_GROUPS.map(group => {
        const keys = ALL_THEMES.filter(k => THEME_DEFINITIONS[k].group === group)
        if (keys.length === 0) return null
        return (
          <div key={group}>
            <p className="text-[9px] font-semibold text-4 uppercase tracking-wider mb-1.5">{group}</p>
            <div className="grid grid-cols-3 gap-1">
              {keys.map(themeKey => {
                const def = THEME_DEFINITIONS[themeKey]
                const isActive = theme === themeKey
                return (
                  <button
                    key={themeKey}
                    title={def.label}
                    onClick={() => onSetTheme(themeKey)}
                    className="r-control overflow-hidden transition-all hover:scale-[1.02]"
                    style={{
                      outline: isActive ? '2px solid rgb(var(--accent))' : '1px solid transparent',
                      outlineOffset: 1,
                    }}
                  >
                    <div className="relative h-6 w-full" style={{ backgroundColor: def.preview.bg }}>
                      {isActive && (
                        <span className="absolute top-0.5 right-0.5">
                          <Check size={9} color={def.preview.text} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div
                      className="h-6 w-full flex items-center px-1.5 gap-1"
                      style={{ backgroundColor: def.preview.surface }}
                    >
                      <span
                        className="text-[8px] font-semibold flex-1 truncate leading-none text-left"
                        style={{ color: def.preview.text }}
                      >
                        {def.label}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: def.preview.text }} />
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: def.preview.accent }} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
