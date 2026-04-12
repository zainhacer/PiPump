import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToken } from '../hooks/useTokens'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

import BondingCurveChart from '../components/token/BondingCurveChart'
import BuySellPanel      from '../components/token/BuySellPanel'
import TradeHistory      from '../components/token/TradeHistory'
import TokenInfo         from '../components/token/TokenInfo'
import HoldersTab        from '../components/token/HoldersTab'

function BackBtn() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-pi-muted hover:text-pi-text
                       text-sm font-mono transition-colors mb-4">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
           stroke="currentColor" strokeWidth="2">
        <path d="m15 18-6-6 6-6"/>
      </svg>
      Back
    </button>
  )
}

function TokenDetailSkeleton() {
  return (
    <div className="page-container py-4 space-y-4 animate-pulse">
      <div className="h-4 w-16 shimmer rounded" />
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 shimmer rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 shimmer rounded" />
          <div className="h-4 w-20 shimmer rounded" />
        </div>
        <div className="h-8 w-24 shimmer rounded" />
      </div>
      <div className="h-48 shimmer rounded-2xl" />
      <div className="h-64 shimmer rounded-2xl" />
    </div>
  )
}

function TokenNotFound() {
  return (
    <div className="page-container py-16 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <p className="font-display font-bold text-xl text-pi-white mb-2">Token Not Found</p>
      <p className="text-pi-muted text-sm mb-6">This token doesn't exist or was removed.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}

function TabPill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex-shrink-0
                        ${active
                          ? 'bg-pi-lime text-pi-bg shadow-lime'
                          : 'text-pi-muted hover:text-pi-text bg-pi-card border border-pi-border'}`}>
      {label}
    </button>
  )
}

export default function TokenDetail() {
  const { id }   = useParams()
  const { user } = useAuth()
  const { token, loading, error } = useToken(id)

  const [tab,         setTab]         = useState('trades')
  const [userHolding, setUserHolding] = useState(0)
  const [refreshKey,  setRefreshKey]  = useState(0)
  const channelRef = useRef(null)

  // ─── Fetch user holding ──────────────────────────────
  const fetchHolding = async () => {
    if (!user || !id) return
    const { data } = await supabase
      .from('token_holders')
      .select('balance')
      .eq('token_id', id)
      .eq('user_uid', user.pi_uid)
      .maybeSingle()
    setUserHolding(data ? Math.max(0, parseFloat(data.balance)) : 0)
  }

  useEffect(() => {
    fetchHolding()
  }, [user, id, refreshKey])

  // ─── Realtime: update holding on new trades ──────────
  useEffect(() => {
    if (!user || !id) return

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`holding-${id}-${user.pi_uid}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'token_holders',
          filter: `token_id=eq.${id}`,
        },
        (payload) => {
          console.log('[TokenDetail] token_holders changed:', payload)
          // Re-fetch holding when any holder changes
          fetchHolding()
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'trades',
          filter: `token_id=eq.${id}`,
        },
        (payload) => {
          console.log('[TokenDetail] New trade:', payload.new?.type)
          // Small delay to let execute_trade finish updating everything
          setTimeout(fetchHolding, 500)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, id])

  // ─── After trade: refresh everything ─────────────────
  function handleTradeComplete() {
    // Increment refreshKey to trigger re-fetch
    setRefreshKey(k => k + 1)
    // Also fetch holding immediately
    setTimeout(fetchHolding, 300)
    setTimeout(fetchHolding, 1500) // second fetch after DB settles
  }

  if (loading) return <TokenDetailSkeleton />
  if (error || !token) return <TokenNotFound />

  // ─── Holding badge ────────────────────────────────────
  const HoldingBadge = user && userHolding > 0 ? (
    <div className="pi-card px-4 py-2.5 mb-3 flex items-center justify-between
                    border-pi-lime/20 bg-pi-lime/[0.02]">
      <span className="text-xs text-pi-muted font-mono">Your holding</span>
      <span className="font-mono text-sm font-bold text-pi-lime">
        {userHolding.toLocaleString()} ${token.ticker}
      </span>
    </div>
  ) : null

  return (
    <div className="min-h-screen">

      {/* ─── Mobile layout ─── */}
      <div className="page-container py-4 md:hidden">
        <BackBtn />
        <TokenInfo token={token} />
        <div className="h-4" />
        <BondingCurveChart token={token} />
        <div className="h-4" />
        {HoldingBadge}
        <BuySellPanel
          token={token}
          userHolding={userHolding}
          onTradeComplete={handleTradeComplete}
        />
        <div className="h-4" />
        <div className="flex gap-2 mb-3">
          <TabPill label="Trades"  active={tab === 'trades'}  onClick={() => setTab('trades')} />
          <TabPill label="Holders" active={tab === 'holders'} onClick={() => setTab('holders')} />
        </div>
        {tab === 'trades'
          ? <TradeHistory tokenId={id} />
          : <div className="pi-card p-4"><HoldersTab tokenId={id} totalSupply={token.total_supply} /></div>
        }
        <div className="h-6" />
      </div>

      {/* ─── Desktop layout ─── */}
      <div className="hidden md:block page-container py-6">
        <BackBtn />
        <div className="grid grid-cols-[1fr_360px] gap-6">

          {/* Left */}
          <div className="space-y-4 min-w-0">
            <div className="pi-card p-5">
              <TokenInfo token={token} />
            </div>
            <BondingCurveChart token={token} />
            <div>
              <div className="flex gap-2 mb-3">
                <TabPill label="Trades"  active={tab === 'trades'}  onClick={() => setTab('trades')} />
                <TabPill label="Holders" active={tab === 'holders'} onClick={() => setTab('holders')} />
              </div>
              {tab === 'trades'
                ? <TradeHistory tokenId={id} />
                : <div className="pi-card p-4"><HoldersTab tokenId={id} totalSupply={token.total_supply} /></div>
              }
            </div>
          </div>

          {/* Right sticky */}
          <div className="space-y-4">
            {HoldingBadge}
            <div className="sticky top-20">
              <BuySellPanel
                token={token}
                userHolding={userHolding}
                onTradeComplete={handleTradeComplete}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
