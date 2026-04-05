// ─── Pi SDK Real Wallet Integration ────────────────────────
// This connects to the REAL Pi wallet via Pi Browser.
// No mock/demo — will only work inside Pi Browser app.

const APP_NAME = import.meta.env.VITE_PI_APP_NAME || 'pipump'
const SANDBOX  = import.meta.env.VITE_PI_SANDBOX === 'true'

// ─── Check if running inside Pi Browser ──────────────────
export function isPiBrowser() {
  return typeof window !== 'undefined' && typeof window.Pi !== 'undefined'
}

// ─── Initialize Pi SDK ────────────────────────────────────
export function initPiSDK() {
  if (!isPiBrowser()) {
    console.warn('[PiSDK] Not running in Pi Browser.')
    return false
  }
  try {
    window.Pi.init({ version: '2.0', sandbox: SANDBOX })
    console.log(`[PiSDK] Initialized. Sandbox: ${SANDBOX}`)
    return true
  } catch (err) {
    console.error('[PiSDK] Init error:', err)
    return false
  }
}

// ─── Authenticate with Pi Wallet ─────────────────────────
// Returns: { uid, username, accessToken } or null
export async function authenticatePi() {
  if (!isPiBrowser()) {
    throw new Error('PI_BROWSER_REQUIRED')
  }

  return new Promise((resolve, reject) => {
    const scopes = ['username', 'payments', 'wallet_address']

    window.Pi.authenticate(scopes, (incompletePayment) => {
      // Handle any incomplete payment from previous session
      if (incompletePayment) {
        console.warn('[PiSDK] Incomplete payment found:', incompletePayment.identifier)
        // We'll handle this in the payment flow
        handleIncompletePayment(incompletePayment)
      }
    })
    .then((auth) => {
      console.log('[PiSDK] Authenticated:', auth.user.username)
      resolve({
        uid:         auth.user.uid,
        username:    auth.user.username,
        accessToken: auth.accessToken,
      })
    })
    .catch((err) => {
      console.error('[PiSDK] Auth error:', err)
      reject(err)
    })
  })
}

// ─── Handle Incomplete Payments ───────────────────────────
async function handleIncompletePayment(payment) {
  // If user had a pending payment, we cancel it to start fresh
  // In production, you might want to complete it instead
  try {
    await window.Pi.cancelPayment(payment.identifier)
    console.log('[PiSDK] Incomplete payment cancelled:', payment.identifier)
  } catch (err) {
    console.warn('[PiSDK] Could not cancel payment:', err)
  }
}

// ─── Create Pi Payment ────────────────────────────────────
// amount    : Pi amount (number)
// memo      : short description shown to user
// metadata  : your custom data { type, tokenId, etc. }
// callbacks : { onReadyForServerApproval, onReadyForServerCompletion, onCancel, onError }
export async function createPiPayment(amount, memo, metadata, callbacks) {
  if (!isPiBrowser()) {
    throw new Error('PI_BROWSER_REQUIRED')
  }

  return new Promise((resolve, reject) => {
    window.Pi.createPayment(
      {
        amount:   parseFloat(amount.toFixed(7)),
        memo:     memo,
        metadata: metadata,
      },
      {
        // Step 1: Payment created, send to your backend for approval
        onReadyForServerApproval: async (paymentId) => {
          console.log('[PiSDK] Ready for approval. PaymentID:', paymentId)
          if (callbacks?.onReadyForServerApproval) {
            await callbacks.onReadyForServerApproval(paymentId)
          }
        },

        // Step 2: Payment completed on blockchain, verify & complete
        onReadyForServerCompletion: async (paymentId, txId) => {
          console.log('[PiSDK] Completed. PaymentID:', paymentId, 'TxID:', txId)
          if (callbacks?.onReadyForServerCompletion) {
            await callbacks.onReadyForServerCompletion(paymentId, txId)
          }
          resolve({ paymentId, txId })
        },

        // User cancelled
        onCancel: (paymentId) => {
          console.log('[PiSDK] Payment cancelled:', paymentId)
          if (callbacks?.onCancel) callbacks.onCancel(paymentId)
          reject(new Error('PAYMENT_CANCELLED'))
        },

        // Error
        onError: (error, payment) => {
          console.error('[PiSDK] Payment error:', error, payment)
          if (callbacks?.onError) callbacks.onError(error, payment)
          reject(error)
        },
      }
    )
  })
}

// ─── Token Creation Payment ───────────────────────────────
export async function payCreationFee(tokenData, callbacks) {
  const fee    = parseFloat(import.meta.env.VITE_CREATION_FEE || '1')
  const memo   = `Create token: ${tokenData.ticker.toUpperCase()}`
  const meta   = { type: 'token_creation', ticker: tokenData.ticker }
  return createPiPayment(fee, memo, meta, callbacks)
}

// ─── Buy Token Payment ────────────────────────────────────
export async function payToBuyTokens(tokenTicker, piAmount, callbacks) {
  const memo = `Buy $${tokenTicker.toUpperCase()} on PiPump`
  const meta = { type: 'buy', ticker: tokenTicker }
  return createPiPayment(piAmount, memo, meta, callbacks)
}

// ─── Sell Token Payment (receive Pi) ─────────────────────
// For sells, user receives Pi from platform wallet
// This is handled off-chain: user initiates, platform transfers Pi back
// (Pi SDK doesn't natively support user-to-user push payments in sandbox)
export function initiateSell(tokenTicker, piAmount) {
  // In real Pi mainnet: platform wallet sends Pi to user
  // For testnet: we track it in Supabase and simulate
  console.log(`[PiSDK] Sell initiated: ${piAmount} Pi for ${tokenTicker}`)
}

// ─── Get Pi wallet address ────────────────────────────────
export async function getPiWalletAddress() {
  if (!isPiBrowser()) return null
  try {
    // Pi SDK v2 exposes wallet address after auth
    const auth = await authenticatePi()
    return auth?.uid || null // uid is used as identifier on testnet
  } catch {
    return null
  }
}
