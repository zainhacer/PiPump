import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth }    from '../hooks/useAuth'
import { useProfile, useUserStats } from '../hooks/useProfile'

import ProfileHeader      from '../components/profile/ProfileHeader'
import CreatedTokensList  from '../components/profile/CreatedTokensList'
import PortfolioList      from '../components/profile/PortfolioList'
import UserTradeHistory   from '../components/profile/UserTradeHistory'

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-xs font-mono font-bold rounded-xl transition-all flex-shrink-0
                  ${active
                    ? 'bg-pi-lime text-pi-bg shadow-lime'
                    : 'bg-pi-card border border-pi-border text-pi-muted hover:text-pi-text'
                  }`}
    >
      {label}
    </button>
  )
}

function UserNotFound() {
  return (
    <div className="page-container py-16 text-center">
      <p className="text-5xl mb-4">👤</p>
      <p className="font-display font-bold text-xl text-pi-white mb-2">User Not Found</p>
      <p className="text-pi-muted text-sm mb-6">This profile doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}

function ConnectPrompt() {
  const { connectWallet, loading, inPiBrowser } = useAuth()
  return (
    <div className="page-container py-16 text-center">
      <div className="text-5xl mb-4">👛</div>
      <h2 className="font-display font-black text-xl text-pi-white mb-2">Your Profile</h2>
      <p className="text-sm text-pi-muted mb-6 max-w-xs mx-auto">
        Connect your Pi wallet to view your profile, portfolio, and trade history.
      </p>
      <button onClick={connectWallet} disabled={loading} className="btn-primary mx-auto">
        {loading ? 'Connecting...' : 'Connect Pi Wallet'}
      </button>
      {!inPiBrowser && (
        <p className="text-xs text-pi-muted mt-4">📱 Open in Pi Browser for wallet access.</p>
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="page-container py-6 space-y-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 shimmer rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 shimmer rounded" />
          <div className="h-4 w-24 shimmer rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array(4).fill(0).map((_, i) => <div key={i} className="flex-1 h-14 shimmer rounded-xl" />)}
      </div>
      {Array(3).fill(0).map((_, i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
    </div>
  )
}

export default function Profile() {
  const { uid }      = useParams()
  const navigate     = useNavigate()
  const { user, isConnected } = useAuth()
  const [activeTab, setActiveTab] = useState('portfolio')

  const targetUid = uid || user?.pi_uid

  if (!uid && !isConnected) return <ConnectPrompt />

  const isOwn = user?.pi_uid === targetUid
  const { profile, loading, error, setProfile } = useProfile(targetUid)
  const { stats, loading: statsLoading } = useUserStats(targetUid)

  if (loading) return <ProfileSkeleton />
  if (error || !profile) return <UserNotFound />

  const tabs = [
    { key: 'portfolio', label: '💼 Portfolio' },
    { key: 'created',   label: '🚀 Created'   },
    { key: 'trades',    label: '📋 Trades'    },
  ]

  return (
    <div className="min-h-screen">
      <div className="page-container py-6">

        {uid && !isOwn && (
          <button onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-pi-muted hover:text-pi-text
                             text-sm font-mono transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back
          </button>
        )}

        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-6">

          {/* Left — sticky profile card */}
          <div className="md:sticky md:top-20 md:self-start space-y-4 mb-6 md:mb-0">
            <div className="pi-card p-5">
              <ProfileHeader
                profile={profile}
                stats={statsLoading ? null : stats}
                isOwn={isOwn}
                onProfileUpdate={setProfile}
              />
            </div>
            {isOwn && (
              <Link to="/create" className="btn-primary w-full flex items-center justify-center gap-2">
                <span>🚀</span><span>Create New Token</span>
              </Link>
            )}
            {profile.is_banned && (
              <div className="pi-card p-4 border-pi-red/30 bg-pi-red/5">
                <p className="text-xs text-pi-red font-mono text-center">
                  ⛔ This account has been suspended.
                </p>
              </div>
            )}
          </div>

          {/* Right — tabs */}
          <div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-4">
              {tabs.map(tab => (
                <Tab key={tab.key} label={tab.label}
                     active={activeTab === tab.key}
                     onClick={() => setActiveTab(tab.key)} />
              ))}
            </div>

            {activeTab === 'portfolio' && <PortfolioList    piUid={targetUid} />}
            {activeTab === 'created'   && <CreatedTokensList piUid={targetUid} />}
            {activeTab === 'trades'    && <UserTradeHistory  piUid={targetUid} />}
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}
