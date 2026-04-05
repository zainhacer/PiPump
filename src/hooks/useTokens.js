import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useTokens(filter = 'new', limit = 20) {
  const [tokens,  setTokens]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    setLoading(true)

    async function fetchTokens() {
      try {
        let query = supabase
          .from('tokens')
          .select(`
            id, name, ticker, image_url, description,
            current_price, price_change_24h,
            volume_24h, volume_total,
            real_pi_collected, graduation_threshold,
            circulating_supply, total_supply,
            holder_count, trade_count,
            is_featured, is_verified, status,
            created_at,
            users!creator_uid(username, avatar_url)
          `)
          .eq('status', 'active')
          .limit(limit)

        if (filter === 'hot') {
          query = query.order('volume_24h', { ascending: false })
        } else if (filter === 'trending') {
          query = query.order('price_change_24h', { ascending: false })
        } else if (filter === 'new') {
          query = query.order('created_at', { ascending: false })
        } else if (filter === 'graduating') {
          query = query
            .gte('real_pi_collected', 500)
            .order('real_pi_collected', { ascending: false })
        }

        const { data, error: err } = await query
        if (err) throw err
        setTokens(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTokens()

    // Unique name prevents StrictMode double-subscribe crash
    const channel = supabase
      .channel(`tokens-${filter}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTokens(prev => [payload.new, ...prev].slice(0, limit))
          } else if (payload.eventType === 'UPDATE') {
            setTokens(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t))
          } else if (payload.eventType === 'DELETE') {
            setTokens(prev => prev.filter(t => t.id !== payload.old.id))
          }
        })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [filter, limit])

  return { tokens, loading, error, refetch: () => {} }
}

export function useToken(tokenId) {
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!tokenId) return
    setLoading(true)

    async function fetchToken() {
      try {
        const { data, error: err } = await supabase
          .from('tokens')
          .select(`*, users!creator_uid(username, avatar_url, pi_uid)`)
          .eq('id', tokenId)
          .single()
        if (err) throw err
        setToken(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchToken()

    const channel = supabase
      .channel(`token-${tokenId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tokens', filter: `id=eq.${tokenId}` },
        (payload) => { setToken(prev => prev ? { ...prev, ...payload.new } : payload.new) })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [tokenId])

  return { token, loading, error }
}

export function useTokenTrades(tokenId, limit = 50) {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!tokenId) return

    supabase
      .from('trades')
      .select(`id, type, pi_amount, token_amount, price_per_token, fee_amount, status, created_at, users!trader_uid(username)`)
      .eq('token_id', tokenId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => { setTrades(data || []); setLoading(false) })

    const channel = supabase
      .channel(`trades-${tokenId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades', filter: `token_id=eq.${tokenId}` },
        (payload) => { setTrades(prev => [payload.new, ...prev].slice(0, limit)) })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [tokenId, limit])

  return { trades, loading }
}

export function useUserHoldings(userUid) {
  const [holdings, setHoldings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!userUid) { setLoading(false); return }
    supabase
      .from('token_holders')
      .select(`balance, updated_at, tokens(id, name, ticker, image_url, current_price, status)`)
      .eq('user_uid', userUid)
      .gt('balance', 0)
      .order('updated_at', { ascending: false })
      .then(({ data }) => { setHoldings(data || []); setLoading(false) })
  }, [userUid])

  return { holdings, loading }
}