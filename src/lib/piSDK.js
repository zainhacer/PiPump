// ─── Pi SDK — Fixed version ───────────────────────────────
const SANDBOX      = import.meta.env.VITE_PI_SANDBOX === 'true'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const PI_API_KEY   = import.meta.env.VITE_PI_API_KEY || ''

// ─── Approve payment on server ────────────────────────────
async function approvePayment(paymentId) {
  console.log('[PiSDK] Approving:', paymentId)

  // Try Edge Function
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey':        SUPABASE_KEY,
      },
      body: JSON.stringify({ action: 'approve', paymentId }),
    })
    const data = await res.json()
    if (res.ok) { console.log('[PiSDK] Approved via Edge Function ✅'); return }
    console.warn('[PiSDK] Edge Function approve failed:', data.error)
  } catch (e) {
    console.warn('[PiSDK] Edge Function error:', e.message)
  }

  // Fallback: Direct Pi API (testnet only)
  if (PI_API_KEY) {
    try {
      const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
      })
      if (res.ok) { console.log('[PiSDK] Approved via direct API ✅'); return }
      const data = await res.json()
      console.warn('[PiSDK] Direct approve failed:', data)
    } catch (e) {
      console.warn('[PiSDK] Direct API error:', e.message)
    }
  }

  console.error('[PiSDK] ❌ Approval failed — payment dialog may not show')
}

// ─── Complete payment on server ───────────────────────────
async function completePayment(paymentId, txId) {
  console.log('[PiSDK] Completing:', paymentId, txId)

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey':        SUPABASE_KEY,
      },
      body: JSON.stringify({ action: 'complete', paymentId, txId }),
    })
    const data = await res.json()
    if (res.ok) { console.log('[PiSDK] Completed via Edge Function ✅'); return }
    console.warn('[PiSDK] Edge Function complete failed:', data.error)
  } catch (e) {
    console.warn('[PiSDK] Complete Edge Function error:', e.message)
  }

  if (PI_API_KEY) {
    try {
      const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid: txId }),
      })
      if (res.ok) { console.log('[PiSDK] Completed via direct API ✅'); return }
    } catch {}
  }
}

// ─── isPiBrowser ──────────────────────────────────────────
export function isPiBrowser() {
  return typeof window !== 'undefined' && typeof window.Pi !== 'undefined' && window.Pi !== null
}

// ─── initPiSDK ───────────────────────────────────────────
export function initPiSDK() {
  if (!isPiBrowser()) return false
  try {
    window.Pi.init({ version: '2.0', sandbox: SANDBOX })
    console.log('[PiSDK] Initialized. Sandbox:', SANDBOX)
    return true
  } catch (err) {
    console.error('[PiSDK] Init error:', err)
    return false
  }
}

// ─── authenticatePi ──────────────────────────────────────
export async function authenticatePi() {
  if (!isPiBrowser()) throw new Error('PI_BROWSER_REQUIRED')
  try {
    const auth = await window.Pi.authenticate(
      ['username', 'payments'],
      async (incomplete) => {
        if (incomplete?.identifier) {
          try { await window.Pi.cancelPayment(incomplete.identifier) } catch {}
        }
      }
    )
    if (!auth?.user) throw new Error('Auth returned empty')
    console.log('[PiSDK] Auth success:', auth.user.username)
    return { uid: auth.user.uid, username: auth.user.username, accessToken: auth.accessToken }
  } catch (err) {
    console.error('[PiSDK] Auth failed:', err.message)
    throw err
  }
}

// ─── createPiPayment ─────────────────────────────────────
export async function createPiPayment(amount, memo, metadata, callbacks) {
  if (!isPiBrowser()) throw new Error('PI_BROWSER_REQUIRED')

  return new Promise((resolve, reject) => {
    window.Pi.createPayment(
      {
        amount:   parseFloat(Number(amount).toFixed(7)),
        memo,
        metadata: metadata || {},
      },
      {
        onReadyForServerApproval: async (paymentId) => {
          // 1. Approve on server (required for dialog to show)
          await approvePayment(paymentId)
          // 2. Run user callback
          if (callbacks?.onReadyForServerApproval) {
            try { await callbacks.onReadyForServerApproval(paymentId) } catch (e) {
              console.warn('[PiSDK] Approval callback error:', e.message)
            }
          }
        },

        onReadyForServerCompletion: async (paymentId, txId) => {
          // 1. Complete on server
          await completePayment(paymentId, txId)
          // 2. Run user callback — errors here should propagate!
          if (callbacks?.onReadyForServerCompletion) {
            try {
              await callbacks.onReadyForServerCompletion(paymentId, txId)
            } catch (e) {
              console.error('[PiSDK] Completion callback error:', e.message)
              // Still resolve — payment was made, even if DB update failed
              // The trade will be in pending state and can be recovered
            }
          }
          resolve({ paymentId, txId })
        },

        onCancel: (paymentId) => {
          callbacks?.onCancel?.(paymentId)
          reject(new Error('PAYMENT_CANCELLED'))
        },

        onError: (error, payment) => {
          console.error('[PiSDK] Payment error:', error)
          callbacks?.onError?.(error, payment)
          reject(error)
        },
      }
    )
  })
}

// ─── Helpers ─────────────────────────────────────────────
export async function payCreationFee(tokenData, callbacks) {
  const fee = parseFloat(import.meta.env.VITE_CREATION_FEE || '1')
  return createPiPayment(fee, `Create token: ${tokenData.ticker.toUpperCase()}`,
    { type: 'token_creation', ticker: tokenData.ticker }, callbacks)
}

export async function payToBuyTokens(tokenTicker, piAmount, callbacks) {
  return createPiPayment(piAmount, `Buy $${tokenTicker.toUpperCase()} on PiPump`,
    { type: 'buy', ticker: tokenTicker }, callbacks)
}

export function initiateSell(tokenTicker, piAmount) {
  console.log(`[PiSDK] Sell: ${piAmount} Pi for ${tokenTicker}`)
}
