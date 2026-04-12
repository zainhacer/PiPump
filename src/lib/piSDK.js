// ─── Pi SDK — Direct API Approval (Testnet) ──────────────
// For testnet only — calls Pi API directly from browser
// Production mein server se call karna chahiye

const SANDBOX      = import.meta.env.VITE_PI_SANDBOX === 'true'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const PI_API_KEY   = import.meta.env.VITE_PI_API_KEY || ''

// ─── Approve payment via Supabase Edge Function ───────────
async function approvePayment(paymentId) {
  console.log('[PiSDK] Approving payment:', paymentId)

  // Try Edge Function first
  if (SUPABASE_URL && SUPABASE_KEY) {
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
      if (res.ok && data.success) {
        console.log('[PiSDK] Approved via Edge Function ✅')
        return true
      }
      console.warn('[PiSDK] Edge Function failed:', data.error)
    } catch (err) {
      console.warn('[PiSDK] Edge Function error:', err.message)
    }
  }

  // Fallback: Direct Pi API call (testnet only)
  // NOTE: Exposes API key in browser — OK for testnet, NOT for mainnet
  if (PI_API_KEY) {
    try {
      console.log('[PiSDK] Trying direct Pi API approval...')
      const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type':  'application/json',
        },
      })
      const data = await res.json()
      if (res.ok) {
        console.log('[PiSDK] Approved via direct API ✅')
        return true
      }
      console.warn('[PiSDK] Direct API failed:', data)
    } catch (err) {
      console.warn('[PiSDK] Direct API error:', err.message)
    }
  }

  console.error('[PiSDK] ❌ Approval failed — add VITE_PI_API_KEY to .env')
  return false
}

// ─── Complete payment ─────────────────────────────────────
async function completePayment(paymentId, txId) {
  console.log('[PiSDK] Completing payment:', paymentId, txId)

  // Try Edge Function first
  if (SUPABASE_URL && SUPABASE_KEY) {
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
      if (res.ok && data.success) {
        console.log('[PiSDK] Completed via Edge Function ✅')
        return true
      }
    } catch {}
  }

  // Fallback: Direct call
  if (PI_API_KEY) {
    try {
      const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ txid: txId }),
      })
      if (res.ok) {
        console.log('[PiSDK] Completed via direct API ✅')
        return true
      }
    } catch {}
  }

  return false
}

// ─── isPiBrowser ─────────────────────────────────────────
export function isPiBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof window.Pi !== 'undefined' &&
    window.Pi !== null
  )
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
      async (incompletePayment) => {
        if (incompletePayment?.identifier) {
          console.warn('[PiSDK] Cancelling incomplete payment...')
          try { await window.Pi.cancelPayment(incompletePayment.identifier) } catch {}
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
          // CRITICAL: Must approve before dialog shows to user
          await approvePayment(paymentId)
          try { await callbacks?.onReadyForServerApproval?.(paymentId) } catch {}
        },

        onReadyForServerCompletion: async (paymentId, txId) => {
          await completePayment(paymentId, txId)
          try { await callbacks?.onReadyForServerCompletion?.(paymentId, txId) } catch {}
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
  const fee  = parseFloat(import.meta.env.VITE_CREATION_FEE || '1')
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
