import type { ComponentType } from 'react'
import type { Theme } from '../../../shared/themes'
import type { ShellProps } from './types'
import LegacyShell from './LegacyShell'
import ConsoleShell from './ConsoleShell'
import GraphiteShell from './GraphiteShell'
import TerminalShell from './TerminalShell'
import DaylightShell from './DaylightShell'
import BlueprintShell from './BlueprintShell'
import SlateShell from './SlateShell'
import SignalShell from './SignalShell'
import PaperShell from './PaperShell'

/**
 * Theme -> shell. Each design direction is a different application shell, so
 * switching theme switches the whole frame, not just the palette. The default theme
 * maps to the app's original composition.
 *
 * Typed `Record<Theme, ...>` so a new theme without a shell is a tsc error.
 */
export const SHELLS: Record<Theme, ComponentType<ShellProps>> = {
  dark: LegacyShell,
  console: ConsoleShell,
  graphite: GraphiteShell,
  terminal: TerminalShell,
  daylight: DaylightShell,
  blueprint: BlueprintShell,
  slate: SlateShell,
  signal: SignalShell,
  paper: PaperShell,
}

export {
  LegacyShell, ConsoleShell, GraphiteShell, TerminalShell,
  DaylightShell, BlueprintShell, SlateShell, SignalShell, PaperShell,
}
export type { ShellProps }
