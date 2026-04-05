import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth }          from '../hooks/useAuth'
import AdminStats           from '../components/admin/AdminStats'
import TokenManager         from '../components/admin/TokenManager'
import UserManager          from '../components/admin/UserManager'
import ReportsQueue         from '../components/admin/ReportsQueue'
import PlatformSettings     from '../components/admin/PlatformSettings'

function Tab({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono
                  font-bold transition-all flex-shrink-0 relative
                  ${active
                    ? 'bg-pi-lime text-pi-bg shadow-lime'
                    : 'bg-pi-card border border-pi-border text-pi-muted hover:text-pi-text'
                  }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                          ${active ? 'bg-pi-bg/20 text-pi-bg' : 'bg-pi-red text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── Access denied ────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="page-container py-16 text-center">
      <p className="text-5xl mb-4">🔒</p>
      <p className="font-display font-bold text-xl text-pi-white mb-2">Access Denied</p>
      <p className="text-pi-muted text-sm mb-6">
        You don't have admin access to PiPump.
      </p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}

function ConnectFirst() {
  const { connectWallet, loading } = useAuth()
  return (
    <div className="page-container py-16 text-center">
      <p className="text-5xl mb-4">🛡️</p>
      <p className="font-display font-bold text-xl text-pi-white mb-2">Admin Dashboard</p>
      <p className="text-pi-muted text-sm mb-6">Connect your wallet to access admin panel.</p>
      <button onClick={connectWallet} disabled={loading} className="btn-primary">
        {loading ? 'Connecting...' : 'Connect Pi Wallet'}
      </button>
    </div>
  )
}

export default function Admin() {
  const { user, isConnected, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  if (!isConnected) return <ConnectFirst />
  if (!isAdmin)     return <AccessDenied />

  const tabs = [
    { key: 'overview',  icon: '📊', label: 'Overview'  },
    { key: 'tokens',    icon: '🪙', label: 'Tokens'    },
    { key: 'users',     icon: '👥', label: 'Users'     },
    { key: 'reports',   icon: '🚨', label: 'Reports'   },
    { key: 'settings',  icon: '⚙️', label: 'Settings'  },
  ]

  return (
    <div className="min-h-screen">
      <div className="page-container py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-black text-2xl text-pi-white flex items-center gap-2">
              <span>🛡️</span> Admin Dashboard
            </h1>
            <p className="text-xs text-pi-muted font-mono mt-1">
              Logged in as <span className="text-pi-purpleLt">{user?.username}</span>
            </p>
          </div>
          <Link to="/" className="btn-ghost text-xs px-3 py-2">← Site</Link>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6
                        border-b border-pi-border">
          {tabs.map(tab => (
            <Tab key={tab.key} {...tab}
                 active={activeTab === tab.key}
                 onClick={() => setActiveTab(tab.key)} />
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview'  && <AdminStats />}
        {activeTab === 'tokens'    && <TokenManager />}
        {activeTab === 'users'     && <UserManager currentAdminUid={user?.pi_uid} />}
        {activeTab === 'reports'   && <ReportsQueue />}
        {activeTab === 'settings'  && <PlatformSettings />}

        <div className="h-8" />
      </div>
    </div>
  )
}
