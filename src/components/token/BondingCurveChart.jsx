import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import {
  generateCurveData,
  getGraduationProgress,
  formatPrice,
  formatPi,
  INITIAL_STATE
} from '../../lib/bondingCurve'

// ─── Custom Tooltip ───────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className="bg-pi-card border border-pi-border rounded-xl px-3 py-2.5 shadow-card">
      <p className="text-[11px] text-pi-muted font-mono mb-1">Pi Collected</p>
      <p className="text-sm font-mono font-bold text-pi-white">{formatPi(d.pi)}</p>
      <div className="glow-line my-1.5" />
      <p className="text-[11px] text-pi-muted font-mono mb-0.5">Price</p>
      <p className="text-sm font-mono font-bold text-pi-lime">{formatPrice(d.price)} π</p>
    </div>
  )
}

// ─── Current position dot ─────────────────────────────────
function CurrentDot({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#C8FF00" opacity={0.3} />
      <circle cx={cx} cy={cy} r={3} fill="#C8FF00" />
    </g>
  )
}

export default function BondingCurveChart({ token }) {
  const {
    virtual_pi_reserve,
    virtual_token_reserve,
    k_constant,
    real_pi_collected,
    graduation_threshold,
    current_price,
  } = token

  const state = {
    virtualPiReserve:    parseFloat(virtual_pi_reserve    || INITIAL_STATE.virtualPiReserve),
    virtualTokenReserve: parseFloat(virtual_token_reserve || INITIAL_STATE.virtualTokenReserve),
    k:                   parseFloat(k_constant            || INITIAL_STATE.k),
  }

  const realPi  = parseFloat(real_pi_collected    || 0)
  const gradPi  = parseFloat(graduation_threshold || 800)
  const gradPct = getGraduationProgress(realPi)

  // Generate curve data points
  const curveData = useMemo(() => generateCurveData(state, 60), [
    virtual_pi_reserve, virtual_token_reserve
  ])

  // Current position on curve
  const currentIdx = useMemo(() => {
    let closest = 0
    let minDiff = Infinity
    curveData.forEach((d, i) => {
      const diff = Math.abs(d.pi - realPi)
      if (diff < minDiff) { minDiff = diff; closest = i }
    })
    return closest
  }, [curveData, realPi])

  return (
    <div className="pi-card p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-pi-muted font-mono mb-0.5">Bonding Curve</p>
          <p className="font-mono text-lg font-bold text-pi-lime">
            {formatPrice(parseFloat(current_price || 0))} π
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-pi-muted font-mono mb-0.5">To Graduation</p>
          <p className="font-mono text-sm font-bold text-pi-white">
            {gradPct.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[180px] md:h-[220px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curveData}
                     margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#C8FF00" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#C8FF00" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#C8FF00" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="pi"
              tickFormatter={v => `${v}π`}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Space Mono' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickCount={4}
            />
            <YAxis
              tickFormatter={v => formatPrice(v)}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Space Mono' }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickCount={4}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Graduation reference line */}
            <ReferenceLine
              x={gradPi}
              stroke="#7C3AED"
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{
                value: '🎓',
                position: 'top',
                fontSize: 12,
              }}
            />

            {/* Current position reference line */}
            {realPi > 0 && (
              <ReferenceLine
                x={curveData[currentIdx]?.pi}
                stroke="#C8FF00"
                strokeDasharray="3 2"
                strokeWidth={1}
              />
            )}

            <Area
              type="monotone"
              dataKey="price"
              stroke="url(#curveStroke)"
              strokeWidth={2}
              fill="url(#curveGrad)"
              dot={false}
              activeDot={<CurrentDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Graduation progress bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-mono text-pi-muted">
            {formatPi(realPi)} collected
          </span>
          <span className="text-[11px] font-mono text-pi-muted">
            Goal: {formatPi(gradPi)}
          </span>
        </div>
        <div className="curve-bar">
          <div className="curve-bar-fill" style={{ width: `${gradPct}%` }} />
        </div>
        <p className="text-[11px] font-mono text-pi-muted mt-1.5 text-center">
          {gradPct >= 100
            ? '🎓 Graduated! Liquidity locked.'
            : `${formatPi(Math.max(0, gradPi - realPi))} more Pi needed to graduate`
          }
        </p>
      </div>
    </div>
  )
}
