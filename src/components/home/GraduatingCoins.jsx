import { useNavigate } from 'react-router-dom'
import { useTokens } from '../../hooks/useTokens'
import { getGraduationProgress, formatPi } from '../../lib/bondingCurve'

function GradCard({ token }) {
  const navigate = useNavigate()
  const { id, name, ticker, image_url, real_pi_collected, graduation_threshold } = token
  const pct = getGraduationProgress(real_pi_collected || 0)
  const remaining = (graduation_threshold || 800) - (real_pi_collected || 0)

  return (
    <div
      className="pi-card p-3 cursor-pointer min-w-[180px] flex-shrink-0
                 border-pi-purple/20 hover:border-pi-purple/50 active:scale-[0.98]
                 transition-all duration-200"
      onClick={() => navigate(`/token/${id}`)}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-pi-border flex-shrink-0">
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
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-pi-white truncate">${ticker}</p>
          <p className="text-[11px] text-pi-muted truncate">{name}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-1.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-mono text-pi-muted">Graduation</span>
          <span className="text-[10px] font-mono text-pi-purpleLt font-bold">
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="curve-bar">
          <div className="curve-bar-fill animate-pulse" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p className="text-[11px] text-pi-muted text-right">
        {remaining > 0 ? `${formatPi(remaining)} left` : '🎓 Graduated!'}
      </p>
    </div>
  )
}

export default function GraduatingCoins() {
  const { tokens, loading } = useTokens('graduating', 8)

  if (!loading && tokens.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎓</span>
        <h2 className="section-label">Graduating Soon</h2>
        <span className="badge-purple text-[10px]">80%+</span>
      </div>

      {/* Horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4
                      scrollbar-none snap-x snap-mandatory">
        {loading
          ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="pi-card p-3 min-w-[180px] flex-shrink-0 animate-pulse">
                <div className="h-8 shimmer rounded-lg mb-3" />
                <div className="h-3 shimmer rounded mb-2" />
                <div className="h-2 shimmer rounded" />
              </div>
            ))
          : tokens.map(token => (
              <div key={token.id} className="snap-start">
                <GradCard token={token} />
              </div>
            ))
        }
      </div>
    </section>
  )
}
