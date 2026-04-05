import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAdminUsers, adminActions } from '../../hooks/useAdmin'
import { formatDistanceToNow } from 'date-fns'

function UserRow({ user, onUpdate, currentAdminUid }) {
  const navigate = useNavigate()
  const [busy,   setBusy]   = useState(false)
  const isSelf   = user.pi_uid === currentAdminUid

  async function act(fn, msg) {
    setBusy(true)
    try {
      await fn()
      toast.success(msg)
      onUpdate()
    } catch (err) {
      toast.error('Action failed: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`pi-card p-4 ${user.is_banned ? 'border-pi-red/20 bg-pi-red/[0.02]' : ''}`}>
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl bg-pi-purple/20 flex-shrink-0 cursor-pointer
                     flex items-center justify-center border border-pi-border"
          onClick={() => navigate(`/profile/${user.pi_uid}`)}
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username}
                 className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="font-bold text-pi-purpleLt text-sm">
              {user.username?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-display font-bold text-sm text-pi-white">
              {user.username}
            </span>
            {user.is_admin   && <span className="badge-lime   text-[9px]">⚡ Admin</span>}
            {user.is_banned  && <span className="badge-red    text-[9px]">⛔ Banned</span>}
            {isSelf          && <span className="badge-muted  text-[9px]">You</span>}
          </div>
          <p className="text-[11px] text-pi-muted font-mono truncate">
            {user.pi_uid?.slice(0, 20)}...
          </p>
          {user.bio && (
            <p className="text-[11px] text-pi-muted mt-1 line-clamp-1">{user.bio}</p>
          )}
          <p className="text-[11px] text-pi-muted mt-1">
            Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Actions */}
      {!isSelf && (
        <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-pi-border/40">

          {/* View profile */}
          <button
            onClick={() => navigate(`/profile/${user.pi_uid}`)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold
                       border border-pi-border text-pi-muted hover:text-pi-text
                       transition-all active:scale-95"
          >
            👤 Profile
          </button>

          {/* Ban / Unban */}
          <button
            disabled={busy}
            onClick={() => act(
              () => adminActions.toggleBan(user.pi_uid, user.is_banned),
              user.is_banned ? `${user.username} unbanned` : `${user.username} banned`
            )}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold
                        border transition-all active:scale-95 disabled:opacity-40
                        ${user.is_banned
                          ? 'text-green-400 border-green-500/20 hover:bg-green-500/10'
                          : 'text-pi-red border-red-500/20 hover:bg-red-500/10'
                        }`}
          >
            {user.is_banned ? '✅ Unban' : '⛔ Ban'}
          </button>

          {/* Admin toggle */}
          <button
            disabled={busy}
            onClick={() => {
              if (!confirm(`${user.is_admin ? 'Remove' : 'Give'} admin access for ${user.username}?`)) return
              act(
                () => adminActions.toggleAdmin(user.pi_uid, user.is_admin),
                user.is_admin ? `${user.username} admin removed` : `${user.username} is now admin`
              )
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold
                        border transition-all active:scale-95 disabled:opacity-40
                        ${user.is_admin
                          ? 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
                          : 'text-pi-purpleLt border-pi-purple/20 hover:bg-pi-purple/10'
                        }`}
          >
            {user.is_admin ? '⚡ Remove Admin' : '⚡ Make Admin'}
          </button>
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="pi-card p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 shimmer rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 shimmer rounded" />
          <div className="h-3 w-40 shimmer rounded" />
          <div className="h-3 w-20 shimmer rounded" />
        </div>
      </div>
    </div>
  )
}

export default function UserManager({ currentAdminUid }) {
  const [search,  setSearch]  = useState('')
  const [refresh, setRefresh] = useState(0)
  const { users, loading }    = useAdminUsers(search)

  return (
    <div className="space-y-4">

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by username..."
        className="pi-input"
      />

      {/* Count */}
      {!loading && (
        <p className="text-xs text-pi-muted font-mono">
          {users.length} user{users.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} />)
          : users.length === 0
            ? (
              <div className="pi-card p-8 text-center">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-pi-muted text-sm">No users found.</p>
              </div>
            )
            : users.map(user => (
                <UserRow
                  key={user.pi_uid}
                  user={user}
                  currentAdminUid={currentAdminUid}
                  onUpdate={() => setRefresh(r => r + 1)}
                />
              ))
        }
      </div>
    </div>
  )
}
