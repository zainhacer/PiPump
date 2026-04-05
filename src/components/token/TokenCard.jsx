import { useNavigate } from 'react-router-dom'
import { formatPrice, formatPi, getGraduationProgress } from '../../lib/bondingCurve'

// ─── Helpers ─────────────────────────────────────────────
function PriceChange({ value }) {
  const v = parseFloat(value || 0)
  if (v > 0) return <span className="num-positive text-xs font-mono font-bold">+{v.toFixed(2)}%</span>
  if (v < 0) return <span className="num-negative text-xs font-mono font-bold">{v.toFixed(2)}%</span>
  return <span className="text-pi-muted text-xs font-mono">0.00%</span>
}

function GradBar({ realPi, threshold }) {
  const pct = getGraduationProgress(realPi || 0)
  return (
    <div className="curve-bar mt-2">
      <div className="curve-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────
export function TokenCardSkeleton() {
  return (
    <div className="token-card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 shimmer rounded" />
          <div className="h-3 w-16 shimmer rounded" />
        </div>
        <div className="h-4 w-16 shimmer rounded" />
      </div>
    </div>
  )
}

// ─── Main TokenCard ───────────────────────────────────────
export default function TokenCard({ token, rank }) {
  const navigate = useNavigate()

  const {
    id, name, ticker, image_url, description,
    current_price, price_change_24h,
    volume_24h, real_pi_collected, graduation_threshold,
    holder_count, trade_count,
    is_verified, is_featured, status,
    users: creator,
  } = token

  const gradPct = getGraduationProgress(real_pi_collected || 0)
  const isNearGrad = gradPct >= 80

  return (
    <div
      className={`token-card group relative overflow-hidden
        ${is_featured ? 'border-pi-lime/30 shadow-inner-lime' : ''}
        ${isNearGrad  ? 'border-pi-purple/30' : ''}
      `}
      onClick={() => navigate(`/token/${id}`)}
    >
      {/* Featured glow */}
      {is_featured && (
        <div className="absolute inset-0 bg-pi-lime/[0.02] pointer-events-none" />
      )}

      <div className="flex items-start gap-3">

        {/* Rank badge */}
        {rank && (
          <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-pi-border/80
                          flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-pi-muted">{rank}</span>
          </div>
        )}

        {/* Token image */}
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden
                         bg-pi-border relative ${rank ? 'ml-6' : ''}`}>
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center
                            bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
              <span className="font-display font-black text-lg text-pi-white">
                {ticker?.charAt(0) || '?'}
              </span>
            </div>
          )}

          {/* Verified badge */}
          {is_verified && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full
                            bg-pi-lime flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-pi-bg" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          )}
        </div>

        {/* Token info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-display font-bold text-pi-white text-sm truncate">
              {name}
            </span>
            {is_featured && (
              <span className="badge-lime text-[9px] px-1.5 py-0.5 flex-shrink-0">🔥 HOT</span>
            )}
            {isNearGrad && !is_featured && (
              <span className="badge-purple text-[9px] px-1.5 py-0.5 flex-shrink-0">🎓 SOON</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-pi-muted">${ticker}</span>
            {creator?.username && (
              <span className="text-[11px] text-pi-muted truncate">
                by {creator.username}
              </span>
            )}
          </div>

          {/* Description preview */}
          {description && (
            <p className="text-[11px] text-pi-muted mt-1 line-clamp-1 leading-tight">
              {description}
            </p>
          )}
        </div>

        {/* Price & change */}
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-xs text-pi-white font-bold">
            {formatPrice(current_price || 0)} π
          </p>
          <PriceChange value={price_change_24h} />
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-pi-border/50">
        <div className="stat-item">
          <span className="stat-label">Vol 24h</span>
          <span className="stat-value text-xs">{formatPi(volume_24h || 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Holders</span>
          <span className="stat-value text-xs">{holder_count || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Trades</span>
          <span className="stat-value text-xs">{trade_count || 0}</span>
        </div>

        {/* Graduation progress */}
        <div className="flex-1 text-right">
          <span className="text-[10px] font-mono text-pi-muted">
            {gradPct.toFixed(0)}% to 🎓
          </span>
        </div>
      </div>

      {/* Graduation bar */}
      <GradBar realPi={real_pi_collected} threshold={graduation_threshold} />
    </div>
  )
}

// ─── Compact card (for ticker / small lists) ──────────────
export function TokenCardCompact({ token }) {
  const navigate = useNavigate()
  const { id, name, ticker, image_url, current_price, price_change_24h } = token
  const change = parseFloat(price_change_24h || 0)

  return (
    <div
      className="flex items-center gap-2.5 p-2.5 pi-card cursor-pointer
                 hover:border-pi-purple/30 active:scale-[0.98] transition-all"
      onClick={() => navigate(`/token/${id}`)}
    >
      <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden bg-pi-border">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-full object-cover"
               onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center
                          bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
            <span className="font-display font-black text-xs text-pi-white">
              {ticker?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs font-bold text-pi-white truncate">${ticker}</p>
        <p className="text-[11px] text-pi-muted truncate">{name}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-xs text-pi-white">{formatPrice(current_price || 0)}</p>
        {change > 0
          ? <p className="text-[11px] num-positive">+{change.toFixed(2)}%</p>
          : <p className="text-[11px] num-negative">{change.toFixed(2)}%</p>
        }
      </div>
    </div>
  )
}
