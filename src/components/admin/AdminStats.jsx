import { usePlatformStats } from '../../hooks/useAdmin'
import { formatPi } from '../../lib/bondingCurve'

function StatCard({ icon, label, value, sub, accent, loading }) {
  if (loading) return (
    <div className="pi-card p-4 animate-pulse">
      <div className="h-4 w-20 shimmer rounded mb-3" />
      <div className="h-7 w-24 shimmer rounded mb-1" />
      <div className="h-3 w-16 shimmer rounded" />
    </div>
  )
  return (
    <div className="pi-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-pi-muted font-mono">{label}</span>
      </div>
      <p className={`font-mono text-2xl font-bold ${accent || 'text-pi-white'}`}>{value}</p>
      {sub && <p className="text-[11px] text-pi-muted font-mono mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-mono text-pi-muted">{label}</span>
        <span className="text-xs font-mono font-bold text-pi-white">{value}</span>
      </div>
      <div className="h-1.5 bg-pi-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`}
             style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AdminStats() {
  const { stats, loading } = usePlatformStats()

  return (
    <div className="space-y-4">

      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon="🪙" label="Total Tokens"
          value={stats?.totalTokens?.toLocaleString() || '—'}
          sub={`+${stats?.activeTokens || 0} active`}
          loading={loading} />
        <StatCard icon="👥" label="Total Users"
          value={stats?.totalUsers?.toLocaleString() || '—'}
          sub={`+${stats?.newUsersToday || 0} today`}
          loading={loading} />
        <StatCard icon="⚡" label="Total Trades"
          value={stats?.total_trades?.toLocaleString() || '—'}
          sub={`${stats?.todayTrades || 0} today`}
          loading={loading} />
        <StatCard icon="💰" label="Fees Collected"
          value={stats ? formatPi(stats.totalFees) : '—'}
          sub={`Vol: ${stats ? formatPi(stats.total_volume || 0) : '—'}`}
          accent="text-pi-lime"
          loading={loading} />
      </div>

      {/* Row 2: Token breakdown + Volume breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Token status breakdown */}
        <div className="pi-card p-4">
          <p className="text-xs font-mono text-pi-muted mb-4">Token Status Breakdown</p>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-8 shimmer rounded" />)}
            </div>
          ) : (
            <>
              <MiniBar label="Active"    value={stats?.activeTokens    || 0}
                       max={stats?.totalTokens || 1} color="bg-green-500" />
              <MiniBar label="Graduated" value={stats?.graduatedTokens || 0}
                       max={stats?.totalTokens || 1} color="bg-pi-purpleLt" />
              <MiniBar label="Suspended" value={stats?.suspendedTokens || 0}
                       max={stats?.totalTokens || 1} color="bg-pi-red" />
            </>
          )}
        </div>

        {/* Volume breakdown */}
        <div className="pi-card p-4">
          <p className="text-xs font-mono text-pi-muted mb-4">Volume Overview</p>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-8 shimmer rounded" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Today',     value: formatPi(stats?.todayVolume || 0),    trades: stats?.todayTrades },
                { label: 'This week', value: formatPi(stats?.weekVolume  || 0),    trades: stats?.weekTrades  },
                { label: 'All time',  value: formatPi(stats?.total_volume || 0),   trades: stats?.total_trades },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between
                                                py-2 border-b border-pi-border/30 last:border-0">
                  <span className="text-xs font-mono text-pi-muted">{row.label}</span>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-pi-white">{row.value}</p>
                    <p className="text-[11px] text-pi-muted">{row.trades || 0} trades</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: User stats */}
      <div className="pi-card p-4">
        <p className="text-xs font-mono text-pi-muted mb-3">User Overview</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',    value: stats?.totalUsers    || 0 },
            { label: 'New Today',      value: stats?.newUsersToday || 0 },
            { label: 'New This Week',  value: stats?.newUsersWeek  || 0 },
            { label: 'Banned',         value: stats?.bannedUsers   || 0, red: true },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className={`font-mono text-xl font-bold ${item.red ? 'text-pi-red' : 'text-pi-white'}`}>
                {loading ? '—' : item.value}
              </p>
              <p className="text-[11px] text-pi-muted font-mono">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
