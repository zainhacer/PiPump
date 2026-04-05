import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { formatPi } from '../../lib/bondingCurve'
import toast from 'react-hot-toast'

function StatPill({ label, value, accent }) {
  return (
    <div className="pi-card px-4 py-3 text-center flex-1">
      <p className={`font-mono text-base font-bold ${accent ? 'text-pi-lime' : 'text-pi-white'}`}>
        {value}
      </p>
      <p className="text-[11px] text-pi-muted font-mono mt-0.5">{label}</p>
    </div>
  )
}

export default function ProfileHeader({ profile, stats, isOwn, onProfileUpdate }) {
  const { user } = useAuth()
  const [editing,   setEditing]   = useState(false)
  const [bio,       setBio]       = useState(profile?.bio || '')
  const [username,  setUsername]  = useState(profile?.username || '')
  const [saving,    setSaving]    = useState(false)

  async function saveProfile() {
    if (!username.trim()) return toast.error('Username cannot be empty')
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: bio.trim(), username: username.trim() })
        .eq('pi_uid', user.pi_uid)
      if (error) throw error
      onProfileUpdate?.({ ...profile, bio: bio.trim(), username: username.trim() })
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const pnlColor = stats?.pnl >= 0 ? 'text-green-400' : 'text-pi-red'
  const pnlSign  = stats?.pnl >= 0 ? '+' : ''

  return (
    <div className="space-y-4">

      {/* Avatar + Name row */}
      <div className="flex items-start gap-4">

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pi-purple/60 to-pi-lime/20
                          border border-pi-border flex items-center justify-center
                          shadow-purple">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar"
                   className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="font-display font-black text-2xl text-pi-white">
                {profile?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          {/* Online dot */}
          {isOwn && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full
                            bg-pi-green border-2 border-pi-bg" />
          )}
        </div>

        {/* Name + bio */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={32}
              className="pi-input text-base font-bold mb-2"
            />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-black text-xl text-pi-white">
                {profile?.username || 'Anonymous'}
              </h1>
              {profile?.is_admin && (
                <span className="badge-lime text-[10px]">⚡ Admin</span>
              )}
            </div>
          )}

          <p className="text-xs font-mono text-pi-muted mt-0.5 truncate">
            Pi UID: {profile?.pi_uid?.slice(0, 12)}...
          </p>

          {editing ? (
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Write a short bio..."
              maxLength={160}
              rows={2}
              className="pi-input resize-none text-sm mt-2"
            />
          ) : (
            profile?.bio && (
              <p className="text-sm text-pi-muted mt-1.5 leading-relaxed line-clamp-2">
                {profile.bio}
              </p>
            )
          )}
        </div>

        {/* Edit button — own profile */}
        {isOwn && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex-shrink-0 p-2 rounded-xl bg-pi-card border border-pi-border
                       text-pi-muted hover:text-pi-text hover:border-pi-purple/40
                       transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Edit actions */}
      {editing && (
        <div className="flex gap-2">
          <button onClick={saveProfile} disabled={saving}
                  className="btn-primary flex-1 text-sm py-2">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button onClick={() => { setEditing(false); setBio(profile?.bio || ''); setUsername(profile?.username || '') }}
                  className="btn-ghost flex-1 text-sm py-2">
            Cancel
          </button>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="flex gap-2">
          <StatPill label="Trades"  value={stats.totalTrades}    />
          <StatPill label="Created" value={stats.tokensCreated}  />
          <StatPill label="Holding" value={stats.tokensHolding}  />
          <div className="pi-card px-4 py-3 text-center flex-1">
            <p className={`font-mono text-base font-bold ${pnlColor}`}>
              {pnlSign}{formatPi(Math.abs(stats.pnl || 0))}
            </p>
            <p className="text-[11px] text-pi-muted font-mono mt-0.5">PnL</p>
          </div>
        </div>
      )}

      {/* Stats loading shimmer */}
      {!stats && (
        <div className="flex gap-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="pi-card px-4 py-3 flex-1 animate-pulse">
              <div className="h-4 shimmer rounded mb-1" />
              <div className="h-3 shimmer rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
