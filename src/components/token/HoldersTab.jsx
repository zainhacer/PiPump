import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatTokenAmount } from '../../lib/bondingCurve'
import { Link } from 'react-router-dom'

export default function HoldersTab({ tokenId, totalSupply }) {
  const [holders, setHolders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokenId) return
    supabase
      .from('token_holders')
      .select(`
        balance, updated_at,
        users!user_uid(username, pi_uid)
      `)
      .eq('token_id', tokenId)
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHolders(data || [])
        setLoading(false)
      })
  }, [tokenId])

  const total = parseFloat(totalSupply || 0)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
            <div className="w-6 h-4 shimmer rounded flex-shrink-0" />
            <div className="w-8 h-8 shimmer rounded-full flex-shrink-0" />
            <div className="flex-1 h-3 shimmer rounded" />
            <div className="w-16 h-3 shimmer rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (holders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">👥</p>
        <p className="text-pi-muted text-sm">No holders yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {holders.map((h, idx) => {
        const pct = total > 0 ? ((parseFloat(h.balance) / total) * 100).toFixed(2) : '0'
        return (
          <Link
            key={h.users?.pi_uid || idx}
            to={`/profile/${h.users?.pi_uid}`}
            className="flex items-center gap-3 py-2.5 px-1 rounded-xl
                       hover:bg-pi-border/20 transition-colors"
          >
            {/* Rank */}
            <span className="w-5 text-[11px] font-mono text-pi-muted text-center flex-shrink-0">
              {idx + 1}
            </span>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-pi-purple/20 flex-shrink-0
                            flex items-center justify-center border border-pi-border">
              <span className="text-[11px] font-bold text-pi-purpleLt">
                {h.users?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>

            {/* Username */}
            <span className="flex-1 text-sm text-pi-text font-body truncate">
              {h.users?.username || 'Unknown'}
            </span>

            {/* Balance */}
            <span className="text-xs font-mono text-pi-muted">
              {formatTokenAmount(h.balance)}
            </span>

            {/* % */}
            <span className="text-xs font-mono font-bold text-pi-purpleLt w-12 text-right flex-shrink-0">
              {pct}%
            </span>
          </Link>
        )
      })}
    </div>
  )
}
