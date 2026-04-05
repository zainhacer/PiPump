import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

// Pi icon SVG
function PiIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
      <text x="12" y="16" textAnchor="middle" fill="currentColor"
        fontSize="12" fontWeight="bold" fontFamily="Space Mono">π</text>
    </svg>
  )
}

export default function Navbar() {
  const { user, isConnected, connectWallet, disconnect, loading, inPiBrowser } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleConnect() {
    if (!inPiBrowser) {
      toast.error('Please open PiPump in Pi Browser to connect your wallet', {
        duration: 5000,
        icon: '🌐',
      })
      return
    }
    try {
      await connectWallet()
      toast.success('Wallet connected!', { icon: '✅' })
    } catch (err) {
      if (err.message === 'USER_BANNED') {
        toast.error('Your account has been suspended.')
      } else if (err.message === 'PI_BROWSER_REQUIRED') {
        toast.error('Please open in Pi Browser.')
      } else {
        toast.error('Connection failed. Try again.')
      }
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-pi-bg/90 backdrop-blur-md border-b border-pi-border">
      <div className="page-container">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-pi-lime flex items-center justify-center
                            group-hover:shadow-lime transition-shadow duration-200">
              <span className="font-display font-black text-pi-bg text-sm">π</span>
            </div>
            <span className="font-display font-bold text-pi-white text-lg tracking-tight
                             hidden xs:block">
              PiPump
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-pi-muted hover:text-pi-text text-sm font-body transition-colors">
              Explore
            </Link>
            <Link to="/create" className="text-pi-muted hover:text-pi-text text-sm font-body transition-colors">
              Create Token
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Create button — desktop only */}
            <Link
              to="/create"
              className="hidden md:flex btn-primary text-xs px-4 py-2"
            >
              + Create Token
            </Link>

            {/* Wallet connect button */}
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl
                             bg-pi-card border border-pi-border
                             hover:border-pi-purple/40 transition-all duration-150"
                >
                  <div className="w-6 h-6 rounded-full bg-pi-purple/20 flex items-center justify-center">
                    <span className="text-xs text-pi-purpleLt font-mono font-bold">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-pi-text hidden xs:block max-w-[80px] truncate">
                    {user?.username}
                  </span>
                  <svg className={`w-3 h-3 text-pi-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44
                                  bg-pi-card border border-pi-border rounded-xl shadow-card
                                  overflow-hidden z-50 animate-slide-up">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-pi-text
                                 hover:bg-pi-border/30 transition-colors"
                    >
                      👤 My Profile
                    </Link>
                    <Link
                      to="/create"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-pi-text
                                 hover:bg-pi-border/30 transition-colors"
                    >
                      🚀 Create Token
                    </Link>
                    <div className="glow-line" />
                    <button
                      onClick={() => { disconnect(); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-pi-red
                                 hover:bg-red-500/5 transition-colors"
                    >
                      🔌 Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="inline-block w-3 h-3 border-2 border-pi-bg/30
                                   border-t-pi-bg rounded-full animate-spin" />
                ) : (
                  <PiIcon size={14} />
                )}
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  )
}
