import { useNavigate } from 'react-router-dom'
import { useUserTrades } from '../../hooks/useProfile'
import { formatPi, formatTokenAmount, formatPrice } from '../../lib/bondingCurve'
import { formatDistanceToNow, format } from 'date-fns'

function TradeRow({ trade }) {
  const navigate = useNavigate()
  const {
    type, pi_amount, token_amount,
    price_per_token, fee_amount, created_at,
    tokens: token,
  } = trade

  const isBuy  = type === 'buy'
  const time   = formatDistanceToNow(new Date(created_at), { addSuffix: true })
  const fullDate = format(new Date(created_at), 'MMM d, yyyy HH:mm')

  return (
    <div
      onClick={() => token && navigate(`/token/${token.id}`)}
      className={`flex items-center gap-3 py-3 border-b border-pi-border/30
                  last:border-0 cursor-pointer
                  hover:bg-pi-border/10 rounded-xl px-2 -mx-2
                  transition-colors`}
    >
      {/* Token image */}
      {token && (
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-pi-border flex-shrink-0">
          {token.image_url ? (
            <img src={token.image_url} alt={token.name}
                 className="w-full h-full object-cover"
                 onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center
                            bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
              <span className="font-display font-black text-sm text-pi-white">
                {token.ticker?.charAt(0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md
                            ${isBuy
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-pi-red border border-red-500/20'
                            }`}>
            {isBuy ? 'BUY' : 'SELL'}
          </span>
          <span className="font-mono text-xs text-pi-white font-bold truncate">
            {token ? `$${token.ticker}` : 'Unknown'}
          </span>
        </div>
        <p className="text-[11px] text-pi-muted font-mono">
          {formatTokenAmount(token_amount)} tokens
          @ {formatPrice(price_per_token)} π
        </p>
      </div>

      {/* Amount + time */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-mono font-bold
                       ${isBuy ? 'num-negative' : 'num-positive'}`}>
          {isBuy ? '-' : '+'}{formatPi(pi_amount)}
        </p>
        <p className="text-[10px] text-pi-muted" title={fullDate}>{time}</p>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-pi-border/30 animate-pulse">
      <div className="w-9 h-9 shimmer rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-24 shimmer rounded" />
        <div className="h-3 w-32 shimmer rounded" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="h-3.5 w-16 shimmer rounded" />
        <div className="h-3 w-10 shimmer rounded" />
      </div>
    </div>
  )
}

export default function UserTradeHistory({ piUid }) {
  const { trades, loading } = useUserTrades(piUid, 50)

  if (loading) return (
    <div className="pi-card p-4">
      {Array(5).fill(0).map((_, i) => <Skeleton key={i} />)}
    </div>
  )

  if (trades.length === 0) return (
    <div className="pi-card p-8 text-center">
      <p className="text-3xl mb-3">📋</p>
      <p className="font-display font-bold text-pi-white mb-1">No trades yet</p>
      <p className="text-pi-muted text-sm">Your buy & sell history will appear here.</p>
    </div>
  )

  // Group by date
  const grouped = trades.reduce((acc, trade) => {
    const day = format(new Date(trade.created_at), 'MMM d, yyyy')
    if (!acc[day]) acc[day] = []
    acc[day].push(trade)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([day, dayTrades]) => (
        <div key={day} className="pi-card p-4">
          <p className="text-[11px] font-mono text-pi-muted mb-2 pb-2
                        border-b border-pi-border/40">
            {day}
          </p>
          {dayTrades.map(trade => <TradeRow key={trade.id} trade={trade} />)}
        </div>
      ))}
    </div>
  )
}
