interface Props {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  /** Second line under the label explaining what the switch actually does. */
  hint?: string
  disabled?: boolean
}

/** The 28×16 switch used throughout settings. */
export default function Toggle({ checked, onChange, label, hint, disabled = false }: Props) {
  const knob = (
    <span
      className="relative shrink-0 transition-colors"
      style={{
        width: 28,
        height: 16,
        borderRadius: 8,
        backgroundColor: checked ? 'rgb(var(--accent))' : 'rgb(var(--hair))',
      }}
    >
      <span
        className="absolute rounded-full bg-white transition-all"
        style={{ top: 2, left: checked ? 14 : 2, width: 12, height: 12 }}
      />
    </span>
  )

  if (!label) {
    return (
      <button onClick={() => !disabled && onChange(!checked)} disabled={disabled} className="shrink-0">
        {knob}
      </button>
    )
  }

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[7px] text-left transition-colors hover:bg-raised disabled:opacity-50"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-[12.5px] text-1">{label}</span>
        {hint && <span className="block text-[11px] text-3 mt-0.5 text-pretty">{hint}</span>}
      </span>
      {knob}
    </button>
  )
}
