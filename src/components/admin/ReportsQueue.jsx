import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useReports, adminActions } from '../../hooks/useAdmin'
import { formatDistanceToNow } from 'date-fns'

function ReportCard({ report, onUpdate }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const { id, reason, created_at, tokens: token, users: reporter } = report

  async function resolve(action) {
    setBusy(true)
    try {
      await adminActions.resolveReport(id, action)
      if (action === 'actioned' && token?.id) {
        await adminActions.setTokenStatus(token.id, 'suspended')
        toast.success('Report actioned — token suspended')
      } else {
        toast.success('Report dismissed')
      }
      onUpdate()
    } catch (err) {
      toast.error('Action failed: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pi-card p-4 border-amber-500/10">

      {/* Token info */}
      {token && (
        <div
          className="flex items-center gap-3 mb-3 cursor-pointer"
          onClick={() => navigate(`/token/${token.id}`)}
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-pi-border flex-shrink-0">
            {token.image_url ? (
              <img src={token.image_url} alt={token.name}
                   className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center
                              bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
                <span className="font-display font-black text-sm text-pi-white">
                  {token.ticker?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="font-mono text-sm font-bold text-pi-white">${token.ticker}</p>
            <p className="text-[11px] text-pi-muted">{token.name}</p>
          </div>
          <svg className="w-4 h-4 text-pi-muted ml-auto" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      )}

      {/* Report reason */}
      <div className="bg-pi-bg rounded-xl p-3 mb-3 border border-pi-border/50">
        <p className="text-[11px] text-pi-muted font-mono mb-1">Report reason:</p>
        <p className="text-sm text-pi-text leading-relaxed">{reason}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-pi-muted">
          By <span className="text-pi-purpleLt">{reporter?.username || 'Unknown'}</span>
        </p>
        <p className="text-[11px] text-pi-muted">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => resolve('actioned')}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold
                     bg-pi-red/10 text-pi-red border border-red-500/20
                     hover:bg-pi-red/20 active:scale-95 transition-all disabled:opacity-40"
        >
          ⛔ Suspend Token
        </button>
        <button
          disabled={busy}
          onClick={() => resolve('dismissed')}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold
                     bg-pi-card border border-pi-border text-pi-muted
                     hover:text-pi-text active:scale-95 transition-all disabled:opacity-40"
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="pi-card p-4 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-9 h-9 shimmer rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-20 shimmer rounded" />
          <div className="h-3 w-14 shimmer rounded" />
        </div>
      </div>
      <div className="h-12 shimmer rounded-xl" />
      <div className="flex gap-2">
        <div className="flex-1 h-8 shimmer rounded-xl" />
        <div className="flex-1 h-8 shimmer rounded-xl" />
      </div>
    </div>
  )
}

export default function ReportsQueue() {
  const [filter,  setFilter]  = useState('pending')
  const [refresh, setRefresh] = useState(0)
  const { reports, loading }  = useReports(filter)

  return (
    <div className="space-y-4">

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'pending',   label: '⏳ Pending'   },
          { key: 'actioned',  label: '⛔ Actioned'  },
          { key: 'dismissed', label: '✕ Dismissed'  },
        ].map(f => (
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

      {/* Count */}
      {!loading && (
        <p className="text-xs text-pi-muted font-mono">
          {reports.length} report{reports.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading
          ? Array(3).fill(0).map((_, i) => <Skeleton key={i} />)
          : reports.length === 0
            ? (
              <div className="pi-card p-8 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-pi-muted text-sm">
                  {filter === 'pending' ? 'No pending reports. All clear!' : 'No reports here.'}
                </p>
              </div>
            )
            : reports.map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onUpdate={() => setRefresh(r => r + 1)}
                />
              ))
        }
      </div>
    </div>
  )
}
