import { useTokens } from '../../hooks/useTokens'
import { formatPrice } from '../../lib/bondingCurve'

function TickerItem({ token }) {
  const change = parseFloat(token.price_change_24h || 0)
  const isUp   = change >= 0

  return (
    <span className="inline-flex items-center gap-1.5 px-4 border-r border-pi-border/40 whitespace-nowrap">
      <span className="font-mono text-xs font-bold text-pi-white">${token.ticker}</span>
      <span className="font-mono text-xs text-pi-muted">{formatPrice(token.current_price || 0)} π</span>
      <span className={`font-mono text-xs font-bold ${isUp ? 'num-positive' : 'num-negative'}`}>
        {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
      </span>
    </span>
  )
}

export default function TickerTape() {
  const { tokens, loading } = useTokens('hot', 20)

  if (loading || tokens.length === 0) {
    return (
      <div className="h-8 bg-pi-card border-b border-pi-border flex items-center px-4">
        <span className="text-xs text-pi-muted font-mono animate-pulse">Loading market data...</span>
      </div>
    )
  }

  // Duplicate for seamless scroll
  const items = [...tokens, ...tokens]

  return (
    <div className="h-8 bg-pi-card/80 border-b border-pi-border ticker-wrap">
      <div className="ticker-inner flex items-center h-full">
        {items.map((token, i) => (
          <TickerItem key={`${token.id}-${i}`} token={token} />
        ))}
      </div>
    </div>
  )
}
