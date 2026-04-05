import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import TickerTape       from '../components/home/TickerTape'
import HeroSection      from '../components/home/HeroSection'
import HotCoins         from '../components/home/HotCoins'
import TrendingCoins    from '../components/home/TrendingCoins'
import NewCoins         from '../components/home/NewCoins'
import GraduatingCoins  from '../components/home/GraduatingCoins'
import SearchBar        from '../components/home/SearchBar'
import FilterTabs       from '../components/home/FilterTabs'
import TokenCard, { TokenCardSkeleton } from '../components/token/TokenCard'
import { useTokens }    from '../hooks/useTokens'

// ─── Explore all tokens with filter ──────────────────────
function ExploreSection({ filter }) {
  const { tokens, loading } = useTokens(filter, 30)

  return (
    <div className="space-y-2">
      {loading
        ? Array(5).fill(0).map((_, i) => <TokenCardSkeleton key={i} />)
        : tokens.length === 0
          ? (
            <div className="pi-card p-10 text-center">
              <p className="text-4xl mb-3">🌵</p>
              <p className="font-display font-bold text-pi-white mb-1">Nothing here yet</p>
              <p className="text-pi-muted text-sm">Create the first token in this category!</p>
            </div>
          )
          : tokens.map((token, idx) => (
              <TokenCard key={token.id} token={token} rank={idx + 1} />
            ))
      }
    </div>
  )
}

// ─── Announcement banner (from CMS) ──────────────────────
function AnnouncementBanner({ text }) {
  const [visible, setVisible] = useState(true)
  if (!text || !visible) return null

  return (
    <div className="bg-pi-purple/10 border-b border-pi-purple/20 px-4 py-2.5
                    flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm flex-shrink-0">📢</span>
        <p className="text-xs text-pi-purpleLt truncate">{text}</p>
      </div>
      <button onClick={() => setVisible(false)}
              className="text-pi-muted hover:text-pi-text flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
             stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Main Home page ───────────────────────────────────────
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [mode,        setMode]        = useState(tabParam || 'overview') // 'overview' | filter key
  const [activeFilter, setActiveFilter] = useState(tabParam || 'new')
  const [announcement, setAnnouncement] = useState('')

  // Fetch announcement from CMS
  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('site_content')
        .select('value')
        .eq('key', 'announcement')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value) setAnnouncement(data.value)
        })
    })
  }, [])

  // Sync tab param
  useEffect(() => {
    if (tabParam && tabParam !== 'overview') {
      setMode('explore')
      setActiveFilter(tabParam)
    }
  }, [tabParam])

  function handleFilterChange(key) {
    setActiveFilter(key)
    setMode('explore')
    setSearchParams({ tab: key })
  }

  function goOverview() {
    setMode('overview')
    setSearchParams({})
  }

  return (
    <div className="min-h-screen">
      {/* Live price ticker */}
      <TickerTape />

      {/* Announcement */}
      <AnnouncementBanner text={announcement} />

      {/* Hero */}
      <HeroSection />

      {/* Divider */}
      <div className="glow-line" />

      {/* Main content */}
      <div className="page-container py-6">

        {/* Search */}
        <SearchBar />

        {/* Mode toggle: Overview vs Explore */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={goOverview}
            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-all
                        ${mode === 'overview'
                          ? 'bg-pi-white/10 text-pi-white'
                          : 'text-pi-muted hover:text-pi-text'
                        }`}
          >
            Overview
          </button>
          <button
            onClick={() => setMode('explore')}
            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-all
                        ${mode === 'explore'
                          ? 'bg-pi-white/10 text-pi-white'
                          : 'text-pi-muted hover:text-pi-text'
                        }`}
          >
            Explore All
          </button>
        </div>

        {mode === 'overview' ? (
          /* ─ Overview: curated sections ─ */
          <div>
            {/* Graduating soon — horizontal scroll */}
            <GraduatingCoins />

            {/* Hot coins */}
            <HotCoins />

            {/* Divider */}
            <div className="glow-line my-6" />

            {/* Trending */}
            <TrendingCoins />

            {/* Divider */}
            <div className="glow-line my-6" />

            {/* New coins — live feed */}
            <NewCoins />
          </div>
        ) : (
          /* ─ Explore: full list with filter tabs ─ */
          <div>
            <FilterTabs active={activeFilter} onChange={handleFilterChange} />
            <ExploreSection filter={activeFilter} />
          </div>
        )}

        {/* Bottom spacer for mobile nav */}
        <div className="h-6" />
      </div>
    </div>
  )
}
