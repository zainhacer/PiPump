import { useNavigate } from 'react-router-dom'
import { usePortfolio } from '../../hooks/useProfile'
import { formatPrice, formatTokenAmount, formatPi } from '../../lib/bondingCurve'

function HoldingRow({ holding }) {
  const navigate = useNavigate()
  const { balance, tokens: token } = holding
  if (!token) return null

  const { id, name, ticker, image_url, current_price, price_change_24h, status } = token
  const value  = parseFloat(current_price || 0) * parseFloat(balance || 0)
  const change = parseFloat(price_change_24h || 0)

  return (
    <div
      onClick={() => navigate(`/token/${id}`)}
      className={`pi-card p-4 cursor-pointer transition-all duration-200
                  hover:border-pi-purple/30 active:scale-[0.99]
                  ${status === 'graduated' ? 'border-pi-lime/20' : ''}`}
    >
      <div className="flex items-center gap-3">

        {/* Image */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-pi-border flex-shrink-0">
          {image_url ? (
            <img src={image_url} alt={name} className="w-full h-full object-cover"
                 onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center
                            bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
              <span className="font-display font-black text-sm text-pi-white">
                {ticker?.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Token info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-display font-bold text-sm text-pi-white truncate">{name}</p>
            {status === 'graduated' && (
              <span className="badge-purple text-[9px] flex-shrink-0">🎓</span>
            )}
          </div>
          <p className="font-mono text-xs text-pi-muted mt-0.5">
            {formatTokenAmount(balance)} ${ticker}
          </p>
        </div>

        {/* Value */}
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-sm font-bold text-pi-white">
            {formatPi(value)}
          </p>
          <p className={`text-xs font-mono ${change >= 0 ? 'num-positive' : 'num-negative'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Per-token price */}
      <div className="flex justify-between mt-2.5 pt-2.5 border-t border-pi-border/30">
        <span className="text-[11px] text-pi-muted font-mono">Price per token</span>
        <span className="text-[11px] font-mono text-pi-muted">
          {formatPrice(parseFloat(current_price || 0))} π
        </span>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="pi-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shimmer rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 shimmer rounded" />
          <div className="h-3 w-16 shimmer rounded" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-16 shimmer rounded" />
          <div className="h-3 w-10 shimmer rounded" />
        </div>
      </div>
    </div>
  )
}

export default function PortfolioList({ piUid }) {
  const { holdings, loading, totalValue } = usePortfolio(piUid)

  if (loading) return (
    <div className="space-y-2">
      {Array(4).fill(0).map((_, i) => <Skeleton key={i} />)}
    </div>
  )

  if (holdings.length === 0) return (
    <div className="pi-card p-8 text-center">
      <p className="text-3xl mb-3">💼</p>
      <p className="font-display font-bold text-pi-white mb-1">No tokens held</p>
      <p className="text-pi-muted text-sm">Buy some tokens to build your portfolio!</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {/* Total value header */}
      <div className="pi-card px-4 py-3 flex items-center justify-between
                      border-pi-lime/20 bg-pi-lime/[0.02]">
        <div>
          <p className="text-[11px] text-pi-muted font-mono">Portfolio Value</p>
          <p className="font-mono text-lg font-bold text-pi-lime">
            {formatPi(totalValue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-pi-muted font-mono">Tokens held</p>
          <p className="font-mono text-sm font-bold text-pi-white">{holdings.length}</p>
        </div>
      </div>

      {holdings.map((h, i) => <HoldingRow key={i} holding={h} />)}
    </div>
  )
}
