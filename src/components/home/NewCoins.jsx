import { useNavigate } from 'react-router-dom'
import { useTokens } from '../../hooks/useTokens'
import { formatPrice } from '../../lib/bondingCurve'
import { formatDistanceToNow } from 'date-fns'

function NewCoinRow({ token, isNew }) {
  const navigate = useNavigate()
  const { id, name, ticker, image_url, current_price, created_at, users: creator } = token

  return (
    <div
      className={`flex items-center gap-3 p-3 pi-card cursor-pointer
                  hover:border-pi-purple/30 active:scale-[0.98] transition-all
                  ${isNew ? 'animate-slide-up border-pi-lime/20' : ''}`}
      onClick={() => navigate(`/token/${id}`)}
    >
      {/* Image */}
      <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-pi-border">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-full object-cover"
               onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center
                          bg-gradient-to-br from-pi-purple/30 to-pi-lime/10">
            <span className="font-display font-black text-base text-pi-white">
              {ticker?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-bold text-sm text-pi-white truncate">{name}</span>
          {isNew && (
            <span className="badge-lime text-[9px] px-1.5 flex-shrink-0">NEW</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-mono text-xs text-pi-muted">${ticker}</span>
          <span className="text-pi-border">·</span>
          {creator?.username && (
            <span className="text-[11px] text-pi-muted truncate">by {creator.username}</span>
          )}
        </div>
      </div>

      {/* Price + time */}
      <div className="text-right flex-shrink-0">
        <p className="font-mono text-xs text-pi-white font-bold">
          {formatPrice(current_price || 0)} π
        </p>
        <p className="text-[10px] text-pi-muted mt-0.5">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex items-center gap-3 p-3 pi-card animate-pulse">
      <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 shimmer rounded" />
        <div className="h-3 w-20 shimmer rounded" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-3 w-16 shimmer rounded" />
        <div className="h-3 w-12 shimmer rounded" />
      </div>
    </div>
  )
}

export default function NewCoins() {
  const { tokens, loading } = useTokens('new', 10)

  return (
    <section className="mb-8" id="explore">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🆕</span>
          <h2 className="section-label">New Coins</h2>
          {/* Live indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full
                          bg-pi-green/10 border border-pi-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-pi-green animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading
          ? Array(5).fill(0).map((_, i) => <Skeleton key={i} />)
          : tokens.length === 0
            ? (
              <div className="pi-card p-8 text-center">
                <p className="text-4xl mb-3">🌱</p>
                <p className="text-pi-white font-display font-bold mb-1">No tokens yet!</p>
                <p className="text-pi-muted text-sm">Be the first to create a token on PiPump.</p>
              </div>
            )
            : tokens.map((token, idx) => (
                <NewCoinRow key={token.id} token={token} isNew={idx === 0} />
              ))
        }
      </div>
    </section>
  )
}
