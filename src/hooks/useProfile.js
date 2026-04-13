import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ─── Fetch user profile ───────────────────────────────────
export function useProfile(piUid) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!piUid) { setLoading(false); return }
    setLoading(true)

    supabase
      .from('users')
      .select('*')
      .eq('pi_uid', piUid)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setProfile(data)
        setLoading(false)
      })
  }, [piUid])

  return { profile, loading, error, setProfile }
}

// ─── Tokens created by user ───────────────────────────────
export function useCreatedTokens(piUid) {
  const [tokens,  setTokens]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!piUid) { setLoading(false); return }

    supabase
      .from('tokens')
      .select(`
        id, name, ticker, image_url, current_price,
        price_change_24h, volume_total, holder_count,
        trade_count, real_pi_collected, graduation_threshold,
        status, created_at
      `)
      .eq('creator_uid', piUid)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTokens(data || []); setLoading(false) })
  }, [piUid])

  return { tokens, loading }
}

// ─── User portfolio (holdings) ────────────────────────────
export function usePortfolio(piUid) {
  const [holdings,   setHoldings]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    if (!piUid) { setLoading(false); return }

    supabase
      .from('token_holders')
      .select(`
        balance, updated_at,
        tokens(id, name, ticker, image_url, current_price, price_change_24h, status)
      `)
      .eq('user_uid', piUid)
      .gt('balance', 0)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        const h = data || []
        const total = h.reduce((sum, item) => {
          return sum + (parseFloat(item.tokens?.current_price || 0) * parseFloat(item.balance || 0))
        }, 0)
        setHoldings(h)
        setTotalValue(total)
        setLoading(false)
      })
  }, [piUid])

  return { holdings, loading, totalValue }
}

// ─── User trade history ───────────────────────────────────
export function useUserTrades(piUid, limit = 30) {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!piUid) { setLoading(false); return }

    supabase
      .from('trades')
      .select(`
        id, type, pi_amount, token_amount,
        price_per_token, fee_amount, status, created_at,
        tokens(id, name, ticker, image_url)
      `)
      .eq('trader_uid', piUid)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => { setTrades(data || []); setLoading(false) })
  }, [piUid, limit])

  return { trades, loading }
}

// ─── User stats summary ───────────────────────────────────
export function useUserStats(piUid) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!piUid) { setLoading(false); return }

    Promise.all([
      supabase.from('trades').select('pi_amount').eq('trader_uid', piUid).eq('type', 'buy').eq('status', 'completed'),
      supabase.from('trades').select('pi_amount').eq('trader_uid', piUid).eq('type', 'sell').eq('status', 'completed'),
      supabase.from('tokens').select('id', { count: 'exact' }).eq('creator_uid', piUid),
      supabase.from('token_holders').select('id', { count: 'exact' }).eq('user_uid', piUid).gt('balance', 0),
    ]).then(([buys, sells, created, holding]) => {
      const totalSpent    = (buys.data  || []).reduce((s, t) => s + parseFloat(t.pi_amount), 0)
      const totalReceived = (sells.data || []).reduce((s, t) => s + parseFloat(t.pi_amount), 0)
      setStats({
        totalTrades:   (buys.data?.length  || 0) + (sells.data?.length || 0),
        totalSpent,
        totalReceived,
        pnl:           totalReceived - totalSpent,
        tokensCreated: created.count  || 0,
        tokensHolding: holding.count  || 0,
      })
      setLoading(false)
    })
  }, [piUid])

  return { stats, loading }
}
