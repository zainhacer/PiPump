import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/bondingCurve'

export default function SearchBar() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const wrapRef  = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('tokens')
        .select('id, name, ticker, image_url, current_price, status')
        .or(`name.ilike.%${query}%,ticker.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(6)

      setResults(data || [])
      setOpen(true)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function goToToken(id) {
    navigate(`/token/${id}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-sm mx-auto md:mx-0 mb-6">
      {/* Input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pi-muted pointer-events-none"
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tokens..."
          className="pi-input pl-9 pr-9"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-pi-border border-t-pi-purple rounded-full animate-spin" />
          </div>
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-pi-muted hover:text-pi-text"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50
                        bg-pi-card border border-pi-border rounded-xl shadow-card
                        overflow-hidden animate-slide-up">
          {results.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-pi-muted">
              No tokens found for "{query}"
            </div>
          ) : (
            results.map(token => (
              <button
                key={token.id}
                onClick={() => goToToken(token.id)}
                className="w-full flex items-center gap-3 px-4 py-3
                           hover:bg-pi-border/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-pi-border flex-shrink-0">
                  {token.image_url ? (
                    <img src={token.image_url} alt={token.name}
                         className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center
                                    bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
                      <span className="font-display font-black text-xs text-pi-white">
                        {token.ticker?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-mono text-xs font-bold text-pi-white">${token.ticker}</p>
                  <p className="text-[11px] text-pi-muted">{token.name}</p>
                </div>
                <p className="font-mono text-xs text-pi-muted">
                  {formatPrice(token.current_price || 0)} π
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
