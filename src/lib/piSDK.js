// ─── Pi SDK — with Server-Side Approval ──────────────────
const SANDBOX       = import.meta.env.VITE_PI_SANDBOX === 'true'
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

// ─── Call Supabase Edge Function for payment approval ────
async function callPaymentServer(action, paymentId, txId = null) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/pi-payment`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey':        SUPABASE_KEY,
      },
      body: JSON.stringify({ action, paymentId, txId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Server error')
    console.log(`[PiSDK] Server ${action} success:`, data)
    return data
  } catch (err) {
    console.error(`[PiSDK] Server ${action} failed:`, err.message)
    // Don't throw — let payment continue even if server call fails on testnet
  }
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

  const scopes = ['username', 'payments']

  try {
    const auth = await window.Pi.authenticate(scopes, async (incompletePayment) => {
      if (incompletePayment?.identifier) {
        console.warn('[PiSDK] Incomplete payment, cancelling:', incompletePayment.identifier)
        try { await window.Pi.cancelPayment(incompletePayment.identifier) } catch {}
      }
    })

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
        // Step 1: Approve payment on server
        onReadyForServerApproval: async (paymentId) => {
          console.log('[PiSDK] Approving payment:', paymentId)
          // Call our Edge Function to approve
          await callPaymentServer('approve', paymentId)
          // Also call user callback if provided
          try { await callbacks?.onReadyForServerApproval?.(paymentId) } catch {}
        },

        // Step 2: Complete payment on server
        onReadyForServerCompletion: async (paymentId, txId) => {
          console.log('[PiSDK] Completing payment:', paymentId, txId)
          // Call our Edge Function to complete
          await callPaymentServer('complete', paymentId, txId)
          // Also call user callback
          try { await callbacks?.onReadyForServerCompletion?.(paymentId, txId) } catch {}
          resolve({ paymentId, txId })
        },

        onCancel: (paymentId) => {
          console.log('[PiSDK] Cancelled:', paymentId)
          callbacks?.onCancel?.(paymentId)
          reject(new Error('PAYMENT_CANCELLED'))
        },

        onError: (error, payment) => {
          console.error('[PiSDK] Error:', error)
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
  const memo = `Create token: ${tokenData.ticker.toUpperCase()}`
  return createPiPayment(fee, memo, { type: 'token_creation', ticker: tokenData.ticker }, callbacks)
}

export async function payToBuyTokens(tokenTicker, piAmount, callbacks) {
  const memo = `Buy $${tokenTicker.toUpperCase()} on PiPump`
  return createPiPayment(piAmount, memo, { type: 'buy', ticker: tokenTicker }, callbacks)
}

export function initiateSell(tokenTicker, piAmount) {
  console.log(`[PiSDK] Sell: ${piAmount} Pi for ${tokenTicker}`)
}
