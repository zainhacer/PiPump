import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatPi } from '../../lib/bondingCurve'
import { useAuth } from '../../hooks/useAuth'

function StatCard({ label, value, icon }) {
  return (
    <div className="pi-card px-4 py-3 flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-mono text-sm font-bold text-pi-white">{value}</p>
        <p className="text-[11px] text-pi-muted">{label}</p>
      </div>
    </div>
  )
}

export default function HeroSection() {
  const { inPiBrowser } = useAuth()
  const [stats, setStats] = useState({
    total_tokens: 0,
    total_volume: 0,
    total_trades: 0,
  })

  useEffect(() => {
    supabase
      .from('platform_config')
      .select('total_tokens, total_volume, total_trades')
      .single()
      .then(({ data }) => {
        if (data) setStats(data)
      })
  }, [])

  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid bg-grid pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 lime-glow-bottom pointer-events-none" />

      <div className="page-container relative pt-8 pb-6 md:pt-14 md:pb-10">

        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                        bg-pi-purple/10 border border-pi-purple/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-pi-lime animate-pulse" />
          <span className="text-xs font-mono text-pi-purpleLt">Live on Pi Testnet</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-black text-3xl md:text-5xl text-pi-white
                       leading-tight tracking-tight mb-3 max-w-lg">
          Launch your{' '}
          <span className="text-pi-lime relative">
            memecoin
            <svg className="absolute -bottom-1 left-0 w-full" height="4" viewBox="0 0 100 4">
              <path d="M0 2 Q50 0 100 2" stroke="#C8FF00" strokeWidth="2"
                    fill="none" opacity="0.6"/>
            </svg>
          </span>{' '}
          on Pi Network.
        </h1>

        <p className="text-pi-muted text-sm md:text-base max-w-sm mb-6 leading-relaxed">
          Create tokens, ride the bonding curve, earn Pi.
          No rug pulls — liquidity locks at graduation. 🎓
        </p>

        {/* CTA buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/create" className="btn-primary flex items-center gap-2 text-sm">
            <span>🚀</span>
            <span>Create Token</span>
          </Link>
          <a
            href="#explore"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <span>🔍</span>
            <span>Explore Tokens</span>
          </a>
        </div>

        {/* Pi Browser notice — shown in normal browser */}
        {!inPiBrowser && (
          <div className="mt-5 inline-flex items-start gap-2.5 px-4 py-3 rounded-xl
                          bg-amber-500/8 border border-amber-500/20 max-w-sm">
            <span className="text-lg flex-shrink-0">📱</span>
            <p className="text-xs text-amber-300/90 leading-relaxed">
              <strong className="text-amber-300">Best experience on Pi Browser.</strong>{' '}
              Open PiPump in the Pi app to connect your wallet and trade.
            </p>
          </div>
        )}

        {/* Platform stats */}
        <div className="grid grid-cols-3 gap-2 mt-8 md:max-w-lg">
          <StatCard
            icon="🪙"
            label="Tokens"
            value={stats.total_tokens?.toLocaleString() || '0'}
          />
          <StatCard
            icon="📊"
            label="Volume"
            value={formatPi(stats.total_volume || 0)}
          />
          <StatCard
            icon="⚡"
            label="Trades"
            value={stats.total_trades?.toLocaleString() || '0'}
          />
        </div>
      </div>
    </section>
  )
}
