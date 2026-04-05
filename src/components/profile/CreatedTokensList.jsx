import { useNavigate } from 'react-router-dom'
import { useCreatedTokens } from '../../hooks/useProfile'
import { formatPrice, formatPi, getGraduationProgress } from '../../lib/bondingCurve'
import { formatDistanceToNow } from 'date-fns'

function StatusBadge({ status }) {
  const map = {
    active:     { cls: 'badge-green',  label: '● Active'     },
    graduated:  { cls: 'badge-purple', label: '🎓 Graduated' },
    suspended:  { cls: 'badge-red',    label: '⛔ Suspended' },
    pending:    { cls: 'badge-muted',  label: '⏳ Pending'   },
  }
  const s = map[status] || map.pending
  return <span className={`${s.cls} text-[10px]`}>{s.label}</span>
}

function TokenRow({ token }) {
  const navigate = useNavigate()
  const {
    id, name, ticker, image_url,
    current_price, price_change_24h,
    volume_total, holder_count, trade_count,
    real_pi_collected, graduation_threshold,
    status, created_at,
  } = token

  const gradPct = getGraduationProgress(real_pi_collected || 0)
  const change  = parseFloat(price_change_24h || 0)

  return (
    <div
      onClick={() => navigate(`/token/${id}`)}
      className="pi-card p-4 cursor-pointer hover:border-pi-purple/30
                 active:scale-[0.99] transition-all duration-200"
    >
      <div className="flex items-start gap-3">

        {/* Image */}
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-pi-border flex-shrink-0">
          {image_url ? (
            <img src={image_url} alt={name} className="w-full h-full object-cover"
                 onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center
                            bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
              <span className="font-display font-black text-base text-pi-white">
                {ticker?.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-display font-bold text-pi-white text-sm">{name}</span>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-pi-muted">${ticker}</span>
            <span className="text-[11px] text-pi-muted">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-sm font-bold text-pi-lime">
            {formatPrice(parseFloat(current_price || 0))} π
          </p>
          <p className={`text-xs font-mono ${change >= 0 ? 'num-positive' : 'num-negative'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-pi-border/40">
        <div className="stat-item">
          <span className="stat-label">Volume</span>
          <span className="stat-value text-xs">{formatPi(volume_total || 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Holders</span>
          <span className="stat-value text-xs">{holder_count || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Trades</span>
          <span className="stat-value text-xs">{trade_count || 0}</span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-[10px] font-mono text-pi-muted">
            {gradPct.toFixed(0)}% 🎓
          </span>
        </div>
      </div>

      {/* Graduation bar */}
      <div className="curve-bar mt-2">
        <div className="curve-bar-fill" style={{ width: `${gradPct}%` }} />
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="pi-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shimmer rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 shimmer rounded" />
          <div className="h-3 w-20 shimmer rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 shimmer rounded" />
          <div className="h-3 w-10 shimmer rounded" />
        </div>
      </div>
    </div>
  )
}

export default function CreatedTokensList({ piUid }) {
  const { tokens, loading } = useCreatedTokens(piUid)

  if (loading) return (
    <div className="space-y-2">
      {Array(3).fill(0).map((_, i) => <Skeleton key={i} />)}
    </div>
  )

  if (tokens.length === 0) return (
    <div className="pi-card p-8 text-center">
      <p className="text-3xl mb-3">🌱</p>
      <p className="font-display font-bold text-pi-white mb-1">No tokens created yet</p>
      <p className="text-pi-muted text-sm">Launch your first token on PiPump!</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {tokens.map(token => <TokenRow key={token.id} token={token} />)}
    </div>
  )
}
