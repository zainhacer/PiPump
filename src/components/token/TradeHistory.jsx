import { useTokenTrades } from '../../hooks/useTokens'
import { formatPi, formatTokenAmount, formatPrice } from '../../lib/bondingCurve'
import { formatDistanceToNow } from 'date-fns'

function TradeRow({ trade, isNew }) {
  const {
    type, pi_amount, token_amount,
    price_per_token, created_at,
    users: trader,
  } = trade

  const isBuy = type === 'buy'
  const time  = formatDistanceToNow(new Date(created_at), { addSuffix: true })

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-pi-border/30
                     last:border-0 ${isNew ? 'animate-fade-in' : ''}`}>

      {/* Type badge */}
      <div className={`w-12 flex-shrink-0 text-center py-1 rounded-lg text-[11px] font-mono font-bold
                       ${isBuy
                         ? 'bg-pi-green/10 text-green-400 border border-green-500/20'
                         : 'bg-pi-red/10 text-pi-red border border-red-500/20'
                       }`}>
        {isBuy ? 'BUY' : 'SELL'}
      </div>

      {/* Amounts */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-pi-white font-bold">
          {formatTokenAmount(token_amount)} tokens
        </p>
        <p className="text-[11px] text-pi-muted font-mono">
          @ {formatPrice(price_per_token)} π
        </p>
      </div>

      {/* Pi amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-mono font-bold
                       ${isBuy ? 'num-negative' : 'num-positive'}`}>
          {isBuy ? '-' : '+'}{formatPi(pi_amount)}
        </p>
        <p className="text-[10px] text-pi-muted">{time}</p>
      </div>

      {/* Trader */}
      {trader?.username && (
        <div className="w-16 flex-shrink-0 text-right hidden md:block">
          <p className="text-[11px] text-pi-muted truncate">{trader.username}</p>
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-pi-border/30 animate-pulse">
      <div className="w-12 h-6 shimmer rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-24 shimmer rounded" />
        <div className="h-2.5 w-16 shimmer rounded" />
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-3 w-14 shimmer rounded" />
        <div className="h-2 w-10 shimmer rounded" />
      </div>
    </div>
  )
}

export default function TradeHistory({ tokenId }) {
  const { trades, loading } = useTokenTrades(tokenId, 50)

  return (
    <div className="pi-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-pi-white text-sm">Trade History</h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full
                          bg-pi-green/10 border border-pi-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-pi-green animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">LIVE</span>
          </div>
        </div>
        <span className="text-xs text-pi-muted font-mono">{trades.length} trades</span>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-3 pb-2 border-b border-pi-border/50 mb-1">
        <span className="w-12 text-[10px] font-mono text-pi-muted flex-shrink-0">Type</span>
        <span className="flex-1 text-[10px] font-mono text-pi-muted">Amount</span>
        <span className="text-[10px] font-mono text-pi-muted">Pi</span>
      </div>

      {/* Trades */}
      <div className="max-h-[280px] overflow-y-auto pr-1">
        {loading
          ? Array(5).fill(0).map((_, i) => <Skeleton key={i} />)
          : trades.length === 0
            ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🦗</p>
                <p className="text-pi-muted text-sm">No trades yet. Be the first!</p>
              </div>
            )
            : trades.map((trade, idx) => (
                <TradeRow key={trade.id} trade={trade} isNew={idx === 0} />
              ))
        }
      </div>
    </div>
  )
}
