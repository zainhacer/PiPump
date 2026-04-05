// ─── PiPump Bonding Curve Engine ────────────────────────────
// Constant Product AMM — same mechanism as pump.fun
//
// Formula: k = virtualPiReserve * virtualTokenReserve
//
// Starting state per token:
//   virtualPiReserve    = 1,000 Pi   (virtual — not real Pi)
//   virtualTokenReserve = 1,000,000,000 tokens
//   k                   = 1,000 * 1,000,000,000 = 1,000,000,000,000
//
// Price = virtualPiReserve / virtualTokenReserve
// Starting price = 1000 / 1,000,000,000 = 0.000001 Pi per token

const TRADE_FEE   = 0.01      // 1%
const GRADUATION  = parseFloat(import.meta.env.VITE_GRADUATION_THRESHOLD || '800')

// ─── Initial State ────────────────────────────────────────
export const INITIAL_STATE = {
  virtualPiReserve:    1_000,
  virtualTokenReserve: 1_000_000_000,
  k:                   1_000 * 1_000_000_000,
  totalSupply:         1_000_000_000,
  graduationThreshold: GRADUATION,
}

// ─── Current Price ────────────────────────────────────────
export function getCurrentPrice(virtualPiReserve, virtualTokenReserve) {
  return virtualPiReserve / virtualTokenReserve
}

// ─── Buy Quote ────────────────────────────────────────────
// How many tokens do you get for X Pi?
export function getBuyQuote(state, piIn) {
  const { virtualPiReserve: vpi, virtualTokenReserve: vtok, k } = state

  const fee      = piIn * TRADE_FEE
  const piNet    = piIn - fee

  const newVpi   = vpi + piNet
  const newVtok  = k / newVpi
  const tokensOut = vtok - newVtok

  const priceBefore = vpi / vtok
  const priceAfter  = newVpi / newVtok
  const priceImpact = ((priceAfter - priceBefore) / priceBefore) * 100

  return {
    tokensOut:   Math.floor(tokensOut),
    priceAfter,
    priceBefore,
    priceImpact: priceImpact.toFixed(2),
    fee,
    piNet,
    newVpi,
    newVtok,
  }
}

// ─── Sell Quote ───────────────────────────────────────────
// How much Pi do you get for X tokens?
export function getSellQuote(state, tokensIn) {
  const { virtualPiReserve: vpi, virtualTokenReserve: vtok, k } = state

  const newVtok  = vtok + tokensIn
  const newVpi   = k / newVtok
  const piGross  = vpi - newVpi
  const fee      = piGross * TRADE_FEE
  const piOut    = piGross - fee

  const priceBefore = vpi / vtok
  const priceAfter  = newVpi / newVtok
  const priceImpact = ((priceBefore - priceAfter) / priceBefore) * 100

  return {
    piOut: Math.max(0, piOut),
    priceAfter,
    priceBefore,
    priceImpact: priceImpact.toFixed(2),
    fee,
    newVpi,
    newVtok,
  }
}

// ─── Apply Buy to State ───────────────────────────────────
export function applyBuy(state, quote) {
  return {
    ...state,
    virtualPiReserve:    quote.newVpi,
    virtualTokenReserve: quote.newVtok,
  }
}

// ─── Apply Sell to State ──────────────────────────────────
export function applySell(state, quote) {
  return {
    ...state,
    virtualPiReserve:    quote.newVpi,
    virtualTokenReserve: quote.newVtok,
  }
}

// ─── Graduation Progress ──────────────────────────────────
// Returns 0–100 (percentage to graduation)
export function getGraduationProgress(realPiCollected) {
  return Math.min((realPiCollected / GRADUATION) * 100, 100)
}

// ─── Market Cap ───────────────────────────────────────────
// Estimated in Pi
export function getMarketCap(currentPrice, totalSupply) {
  return currentPrice * totalSupply
}

// ─── Format helpers ───────────────────────────────────────
export function formatPrice(price) {
  if (price < 0.000001) return price.toExponential(4)
  if (price < 0.001)    return price.toFixed(8)
  if (price < 1)        return price.toFixed(6)
  return price.toFixed(4)
}

export function formatTokenAmount(amount) {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000)         return `${(amount / 1_000).toFixed(2)}K`
  return amount.toLocaleString()
}

export function formatPi(amount) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M π`
  if (amount >= 1_000)     return `${(amount / 1_000).toFixed(2)}K π`
  return `${parseFloat(amount.toFixed(4))} π`
}

// ─── Generate curve data points (for chart) ───────────────
export function generateCurveData(state, points = 50) {
  const { virtualPiReserve: vpi, virtualTokenReserve: vtok, k } = state
  const data = []

  // Show price at different amounts of Pi sold into pool
  const maxPi = GRADUATION * 1.2

  for (let i = 0; i <= points; i++) {
    const piCollected = (maxPi / points) * i
    const currentVpi  = vpi + piCollected
    const price       = currentVpi / (k / currentVpi)
    data.push({
      pi:    parseFloat(piCollected.toFixed(2)),
      price: parseFloat(price.toFixed(8)),
    })
  }
  return data
}
