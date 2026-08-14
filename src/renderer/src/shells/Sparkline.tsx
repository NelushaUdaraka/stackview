/**
 * Single-series bar sparkline for the Signal board.
 *
 * One series, so no legend is needed — the tile's own label names it. Bars carry a
 * 2px surface gap and rounded data-ends anchored to the baseline. Colour is a status
 * value, never an identity: every caller also renders the state word, so the reading
 * never depends on hue alone.
 */
export default function Sparkline({
  values, tone = 'accent', width = 76, height = 26,
}: {
  values: number[]
  tone?: 'accent' | 'ok' | 'warn' | 'danger' | 'muted'
  width?: number
  height?: number
}) {
  if (values.length === 0) {
    return <div style={{ width, height }} aria-hidden />
  }
  const max = Math.max(1, ...values)
  const GAP = 2
  const n = values.length
  const barW = Math.max(1.5, (width - GAP * (n - 1)) / n)
  const fill = tone === 'muted' ? 'rgb(var(--text-4))' : `rgb(var(--${tone === 'accent' ? 'accent' : tone}))`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden
      style={{ display: 'block', overflow: 'visible' }}>
      {values.map((v, i) => {
        const h = Math.max(1.5, (v / max) * height)
        const x = i * (barW + GAP)
        return (
          <rect key={i} x={x} y={height - h} width={barW} height={h}
            rx={Math.min(2, barW / 2)} fill={fill}
            opacity={i === n - 1 ? 1 : 0.45 + (i / n) * 0.4} />
        )
      })}
    </svg>
  )
}
