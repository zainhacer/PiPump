import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ─── Platform stats ───────────────────────────────────────
export function usePlatformStats() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const [config, tokens, users, trades] = await Promise.all([
        supabase.from('platform_config').select('*').maybeSingle(),
        supabase.from('tokens').select('status'),
        supabase.from('users').select('id, created_at, is_banned'),
        supabase.from('trades').select('pi_amount, fee_amount, type, created_at').eq('status', 'completed'),
      ])

      const tokenList = tokens.data || []
      const tradeList = trades.data || []
      const userList  = users.data  || []
      const now   = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const week  = new Date(today - 7 * 86400000)

      const todayTrades = tradeList.filter(t => new Date(t.created_at) >= today)
      const weekTrades  = tradeList.filter(t => new Date(t.created_at) >= week)

      setStats({
        ...config.data,
        activeTokens:    tokenList.filter(t => t.status === 'active').length,
        graduatedTokens: tokenList.filter(t => t.status === 'graduated').length,
        suspendedTokens: tokenList.filter(t => t.status === 'suspended').length,
        totalTokens:     tokenList.length,
        totalUsers:      userList.length,
        bannedUsers:     userList.filter(u => u.is_banned).length,
        newUsersToday:   userList.filter(u => new Date(u.created_at) >= today).length,
        newUsersWeek:    userList.filter(u => new Date(u.created_at) >= week).length,
        todayVolume:     todayTrades.reduce((s, t) => s + parseFloat(t.pi_amount), 0),
        weekVolume:      weekTrades.reduce((s, t) => s + parseFloat(t.pi_amount), 0),
        totalFees:       tradeList.reduce((s, t) => s + parseFloat(t.fee_amount || 0), 0),
        todayTrades:     todayTrades.length,
        weekTrades:      weekTrades.length,
      })
      setLoading(false)
    }
    fetch()
  }, [])

  return { stats, loading }
}

// ─── Admin token list ─────────────────────────────────────
export function useAdminTokens(filter = 'all', search = '') {
  const [tokens,  setTokens]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('tokens')
      .select(`
        id, name, ticker, image_url, status, is_featured, is_verified,
        current_price, volume_total, real_pi_collected, graduation_threshold,
        holder_count, trade_count, created_at,
        users!creator_uid(username, pi_uid)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') query = query.eq('status', filter)
    if (search.trim()) query = query.or(`name.ilike.%${search}%,ticker.ilike.%${search}%`)

    query.then(({ data }) => { setTokens(data || []); setLoading(false) })
  }, [filter, search])

  return { tokens, setTokens, loading }
}

// ─── Admin user list ──────────────────────────────────────
export function useAdminUsers(search = '') {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100)
    if (search.trim()) query = query.ilike('username', `%${search}%`)
    query.then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [search])

  return { users, setUsers, loading }
}

// ─── Reports queue ────────────────────────────────────────
export function useReports(filter = 'pending') {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('reports')
      .select(`
        id, reason, status, created_at,
        tokens(id, name, ticker, image_url),
        users!reporter_uid(username)
      `)
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setReports(data || []); setLoading(false) })
  }, [filter])

  return { reports, setReports, loading }
}

// ─── Admin actions ────────────────────────────────────────
export const adminActions = {
  async setTokenStatus(tokenId, status) {
    const update = { status }
    if (status === 'graduated') update.graduated_at = new Date().toISOString()
    const { error } = await supabase.from('tokens').update(update).eq('id', tokenId)
    if (error) throw error
  },
  async toggleFeatured(tokenId, current) {
    const { error } = await supabase.from('tokens').update({ is_featured: !current }).eq('id', tokenId)
    if (error) throw error
  },
  async toggleVerified(tokenId, current) {
    const { error } = await supabase.from('tokens').update({ is_verified: !current }).eq('id', tokenId)
    if (error) throw error
  },
  async deleteToken(tokenId) {
    const { error } = await supabase.from('tokens').delete().eq('id', tokenId)
    if (error) throw error
  },
  async toggleBan(userId, current) {
    const { error } = await supabase.from('users').update({ is_banned: !current }).eq('pi_uid', userId)
    if (error) throw error
    if (!current) {
      await supabase.from('tokens').update({ status: 'suspended' })
        .eq('creator_uid', userId).eq('status', 'active')
    }
  },
  async toggleAdmin(userId, current) {
    const { error } = await supabase.from('users').update({ is_admin: !current }).eq('pi_uid', userId)
    if (error) throw error
  },
  async resolveReport(reportId, action) {
    const { error } = await supabase.from('reports').update({ status: action }).eq('id', reportId)
    if (error) throw error
  },
  async updateConfig(updates) {
    const { error } = await supabase.from('platform_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .not('id', 'is', null)
    if (error) throw error
  },
  async updateContent(key, value) {
    const { error } = await supabase.from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) throw error
  },
}
