import { useState, useEffect, createContext, useContext } from 'react'
import { initPiSDK, authenticatePi, isPiBrowser } from '../lib/piSDK'
import { supabase } from '../lib/supabase'

// ─── Auth Context ─────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)   // Supabase user row
  const [piAuth,      setPiAuth]      = useState(null)   // Pi SDK auth data
  const [loading,     setLoading]     = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [inPiBrowser, setInPiBrowser] = useState(false)

  useEffect(() => {
    // Init Pi SDK on mount
    const inPi = isPiBrowser()
    setInPiBrowser(inPi)
    if (inPi) initPiSDK()
    setInitialized(true)
  }, [])

  // ─── Connect Pi Wallet ──────────────────────────────────
  async function connectWallet() {
    if (!isPiBrowser()) {
      throw new Error('PI_BROWSER_REQUIRED')
    }

    setLoading(true)
    try {
      // 1. Authenticate with Pi SDK
      const auth = await authenticatePi()
      setPiAuth(auth)

      // 2. Upsert user in Supabase
      const { data: existingUser, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('pi_uid', auth.uid)
        .maybeSingle()

      if (fetchErr) throw fetchErr

      let dbUser = existingUser

      if (!existingUser) {
        // New user — create profile
        const { data: newUser, error: insertErr } = await supabase
          .from('users')
          .insert({
            pi_uid:   auth.uid,
            username: auth.username,
          })
          .select()
          .single()

        if (insertErr) throw insertErr
        dbUser = newUser
      } else {
        // Update username if changed
        if (existingUser.username !== auth.username) {
          await supabase
            .from('users')
            .update({ username: auth.username })
            .eq('pi_uid', auth.uid)
          dbUser = { ...existingUser, username: auth.username }
        }
      }

      // 3. Check if banned
      if (dbUser.is_banned) {
        setPiAuth(null)
        setUser(null)
        throw new Error('USER_BANNED')
      }

      setUser(dbUser)
      // Store in session for quick access
      sessionStorage.setItem('pipump_uid', auth.uid)
      sessionStorage.setItem('pipump_username', auth.username)

      return dbUser
    } finally {
      setLoading(false)
    }
  }

  // ─── Disconnect ─────────────────────────────────────────
  function disconnect() {
    setUser(null)
    setPiAuth(null)
    sessionStorage.removeItem('pipump_uid')
    sessionStorage.removeItem('pipump_username')
  }

  // ─── Is Admin ────────────────────────────────────────────
  const isAdmin = user?.is_admin === true ||
    (import.meta.env.VITE_ADMIN_UIDS || '').split(',').includes(user?.pi_uid)

  const value = {
    user,
    piAuth,
    loading,
    initialized,
    inPiBrowser,
    isAdmin,
    isConnected: !!user,
    connectWallet,
    disconnect,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
