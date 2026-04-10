// ─── Pi SDK — Based on official pi-apps/pi-platform-docs ─────
// Reference: https://github.com/pi-apps/pi-platform-docs

const SANDBOX = import.meta.env.VITE_PI_SANDBOX === 'true'

// ─── Check Pi Browser ────────────────────────────────────
export function isPiBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof window.Pi !== 'undefined' &&
    window.Pi !== null
  )
}

// ─── Init SDK ─────────────────────────────────────────────
// Per official docs: Pi.init({ version: "2.0", sandbox: bool })
export function initPiSDK() {
  if (!isPiBrowser()) {
    console.warn('[PiSDK] Not in Pi Browser — window.Pi not found')
    return false
  }
  try {
    window.Pi.init({ version: '2.0', sandbox: SANDBOX })
    console.log('[PiSDK] Initialized. Sandbox:', SANDBOX)
    return true
  } catch (err) {
    console.error('[PiSDK] Init error:', err)
    return false
  }
}

// ─── Authenticate ─────────────────────────────────────────
// Official docs scopes: ["username", "payments"]
// wallet_address is NOT a valid scope per official docs
// Ref: https://github.com/pi-apps/demo/blob/main/FLOWS.md
export async function authenticatePi() {
  if (!isPiBrowser()) {
    throw new Error('PI_BROWSER_REQUIRED')
  }

  // Per official demo app: only these 2 scopes
  const scopes = ['username', 'payments']

  // onIncompletePaymentFound — required second argument
  const onIncompletePaymentFound = async (payment) => {
    console.warn('[PiSDK] Incomplete payment found:', payment?.identifier)
    // Per docs: must handle incomplete payments before new payment
    // For now just log — in production send to backend
  }

  try {
    // Per docs: Pi.authenticate() returns Promise<AuthResult>
    // Do NOT wrap in extra Promise — it already is one
    const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound)

    if (!authResult || !authResult.user) {
      throw new Error('Auth returned empty result')
    }

    console.log('[PiSDK] Auth success. User:', authResult.user.username)

    return {
      uid:         authResult.user.uid,
      username:    authResult.user.username,
      accessToken: authResult.accessToken,
    }
  } catch (err) {
    console.error('[PiSDK] Auth failed:', err?.message || err)
    throw err
  }
}

// ─── Create Payment ───────────────────────────────────────
// Per official docs payment flow
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
          console.log('[PiSDK] Ready for approval:', paymentId)
          try { await callbacks?.onReadyForServerApproval?.(paymentId) } catch (e) {
            console.warn('[PiSDK] Approval callback error:', e)
          }
        },
        onReadyForServerCompletion: async (paymentId, txId) => {
          console.log('[PiSDK] Ready for completion:', paymentId, txId)
          try { await callbacks?.onReadyForServerCompletion?.(paymentId, txId) } catch (e) {
            console.warn('[PiSDK] Completion callback error:', e)
          }
          resolve({ paymentId, txId })
        },
        onCancel: (paymentId) => {
          console.log('[PiSDK] Payment cancelled:', paymentId)
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
  const memo = `Create token: ${tokenData.ticker.toUpperCase()}`
  return createPiPayment(fee, memo, { type: 'token_creation', ticker: tokenData.ticker }, callbacks)
}

export async function payToBuyTokens(tokenTicker, piAmount, callbacks) {
  const memo = `Buy $${tokenTicker.toUpperCase()} on PiPump`
  return createPiPayment(piAmount, memo, { type: 'buy', ticker: tokenTicker }, callbacks)
}

export function initiateSell(tokenTicker, piAmount) {
  console.log(`[PiSDK] Sell initiated: ${piAmount} Pi for ${tokenTicker}`)
}