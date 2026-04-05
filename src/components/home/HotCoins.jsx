import TokenCard, { TokenCardSkeleton } from '../token/TokenCard'
import { useTokens } from '../../hooks/useTokens'
import { Link } from 'react-router-dom'

export default function HotCoins() {
  const { tokens, loading } = useTokens('hot', 5)

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h2 className="section-label">Hot Coins</h2>
          <span className="badge-red text-[10px]">24H VOL</span>
        </div>
        <Link to="/?tab=hot"
              className="text-xs text-pi-muted hover:text-pi-purpleLt font-mono
                         transition-colors flex items-center gap-1">
          See all
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading
          ? Array(3).fill(0).map((_, i) => <TokenCardSkeleton key={i} />)
          : tokens.length === 0
            ? <EmptyState message="No hot coins yet — be the first to trade!" />
            : tokens.map((token, idx) => (
                <TokenCard key={token.id} token={token} rank={idx + 1} />
              ))
        }
      </div>
    </section>
  )
}

function EmptyState({ message }) {
  return (
    <div className="pi-card p-6 text-center">
      <p className="text-3xl mb-2">🌵</p>
      <p className="text-pi-muted text-sm">{message}</p>
    </div>
  )
}
