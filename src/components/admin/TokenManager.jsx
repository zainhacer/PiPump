import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAdminTokens, adminActions } from '../../hooks/useAdmin'
import { formatPi, formatPrice, getGraduationProgress } from '../../lib/bondingCurve'
import { formatDistanceToNow } from 'date-fns'

function StatusBadge({ status }) {
  const map = {
    active:    'badge-green',
    graduated: 'badge-purple',
    suspended: 'badge-red',
    pending:   'badge-muted',
  }
  return (
    <span className={`${map[status] || 'badge-muted'} text-[10px] capitalize`}>
      {status}
    </span>
  )
}

function ActionBtn({ onClick, color, label, disabled }) {
  const colors = {
    red:    'text-pi-red   hover:bg-red-500/10   border-red-500/20',
    green:  'text-green-400 hover:bg-green-500/10 border-green-500/20',
    yellow: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20',
    lime:   'text-pi-lime  hover:bg-pi-lime/10   border-pi-lime/20',
    purple: 'text-pi-purpleLt hover:bg-pi-purple/10 border-pi-purple/20',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold
                  border transition-all active:scale-95 disabled:opacity-40
                  ${colors[color] || colors.green}`}
    >
      {label}
    </button>
  )
}

function TokenRow({ token, onUpdate }) {
  const navigate   = useNavigate()
  const [busy, setBusy] = useState(false)

  async function act(fn, successMsg) {
    setBusy(true)
    try {
      await fn()
      toast.success(successMsg)
      onUpdate()
    } catch (err) {
      toast.error('Action failed: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const gradPct = getGraduationProgress(token.real_pi_collected || 0)

  return (
    <div className="pi-card p-3 space-y-3">

      {/* Top row */}
      <div className="flex items-start gap-3">

        {/* Image */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-pi-border flex-shrink-0 cursor-pointer"
             onClick={() => navigate(`/token/${token.id}`)}>
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-sm text-pi-white truncate">
              {token.name}
            </span>
            <span className="font-mono text-xs text-pi-muted">${token.ticker}</span>
            <StatusBadge status={token.status} />
            {token.is_featured && <span className="badge-lime text-[9px]">🔥 Featured</span>}
            {token.is_verified && <span className="badge-green text-[9px]">✓ Verified</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-pi-muted">
              by {token.users?.username || '—'}
            </span>
            <span className="text-[11px] text-pi-muted">
              {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-xs text-pi-lime font-bold">
            {formatPrice(parseFloat(token.current_price || 0))} π
          </p>
          <p className="text-[11px] text-pi-muted">
            Vol: {formatPi(token.volume_total || 0)}
          </p>
          <p className="text-[11px] text-pi-muted">
            {token.holder_count || 0} holders
          </p>
        </div>
      </div>

      {/* Graduation bar */}
      <div className="curve-bar">
        <div className="curve-bar-fill" style={{ width: `${gradPct}%` }} />
      </div>
      <p className="text-[10px] text-pi-muted font-mono">{gradPct.toFixed(1)}% to graduation</p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1">

        {/* Suspend / Restore */}
        {token.status === 'active' ? (
          <ActionBtn color="red" label="⛔ Suspend" disabled={busy}
            onClick={() => act(
              () => adminActions.setTokenStatus(token.id, 'suspended'),
              `${token.ticker} suspended`
            )} />
        ) : token.status === 'suspended' ? (
          <ActionBtn color="green" label="✅ Restore" disabled={busy}
            onClick={() => act(
              () => adminActions.setTokenStatus(token.id, 'active'),
              `${token.ticker} restored`
            )} />
        ) : null}

        {/* Feature toggle */}
        <ActionBtn
          color={token.is_featured ? 'yellow' : 'lime'}
          label={token.is_featured ? '🔥 Unfeature' : '🔥 Feature'}
          disabled={busy}
          onClick={() => act(
            () => adminActions.toggleFeatured(token.id, token.is_featured),
            `${token.ticker} ${token.is_featured ? 'unfeatured' : 'featured'}`
          )}
        />

        {/* Verify toggle */}
        <ActionBtn
          color={token.is_verified ? 'yellow' : 'purple'}
          label={token.is_verified ? '✓ Unverify' : '✓ Verify'}
          disabled={busy}
          onClick={() => act(
            () => adminActions.toggleVerified(token.id, token.is_verified),
            `${token.ticker} ${token.is_verified ? 'unverified' : 'verified'}`
          )}
        />

        {/* Graduate manually */}
        {token.status === 'active' && (
          <ActionBtn color="purple" label="🎓 Graduate" disabled={busy}
            onClick={() => act(
              () => adminActions.setTokenStatus(token.id, 'graduated'),
              `${token.ticker} graduated!`
            )} />
        )}

        {/* Delete */}
        <ActionBtn color="red" label="🗑 Delete" disabled={busy}
          onClick={() => {
            if (!confirm(`Delete ${token.name}? This is irreversible.`)) return
            act(
              () => adminActions.deleteToken(token.id),
              `${token.ticker} deleted`
            )
          }} />
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="pi-card p-3 animate-pulse space-y-2">
      <div className="flex gap-3">
        <div className="w-10 h-10 shimmer rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 shimmer rounded" />
          <div className="h-3 w-20 shimmer rounded" />
        </div>
      </div>
      <div className="h-1.5 shimmer rounded-full" />
      <div className="flex gap-2">
        <div className="h-7 w-20 shimmer rounded-lg" />
        <div className="h-7 w-20 shimmer rounded-lg" />
      </div>
    </div>
  )
}

export default function TokenManager() {
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [refresh, setRefresh] = useState(0)

  const { tokens, loading } = useAdminTokens(filter, search)

  const filters = [
    { key: 'all',       label: 'All'        },
    { key: 'active',    label: '● Active'   },
    { key: 'suspended', label: '⛔ Suspended'},
    { key: 'graduated', label: '🎓 Graduated'},
  ]

  return (
    <div className="space-y-4">

      {/* Search + filter */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or ticker..."
          className="pi-input"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold
                                flex-shrink-0 transition-all
                                ${filter === f.key
                                  ? 'bg-pi-lime text-pi-bg'
                                  : 'bg-pi-card border border-pi-border text-pi-muted hover:text-pi-text'
                                }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-pi-muted font-mono">
          {tokens.length} token{tokens.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} />)
          : tokens.length === 0
            ? (
              <div className="pi-card p-8 text-center">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-pi-muted text-sm">No tokens found.</p>
              </div>
            )
            : tokens.map(token => (
                <TokenRow
                  key={token.id}
                  token={token}
                  onUpdate={() => setRefresh(r => r + 1)}
                />
              ))
        }
      </div>
    </div>
  )
}
