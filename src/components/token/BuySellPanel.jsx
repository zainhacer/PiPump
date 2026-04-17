import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import {
  getBuyQuote, getSellQuote,
  formatPrice, formatTokenAmount, formatPi, INITIAL_STATE
} from '../../lib/bondingCurve'
import { payToBuyTokens } from '../../lib/piSDK'
import { supabase } from '../../lib/supabase'

const BUY_PRESETS  = [0.1, 0.5, 1, 5]
const SELL_PRESETS = [10, 25, 50, 100]

function QuoteRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-pi-muted font-mono">{label}</span>
      <span className={`text-xs font-mono font-bold ${highlight ? 'text-pi-lime' : 'text-pi-white'}`}>
        {value}
      </span>
    </div>
  )
}

// Calls execute_trade RPC
async function runTrade({ tokenId, traderUid, type, piAmount, tokenAmount, fee, paymentId, txId }) {
  console.log('[Trade] RPC execute_trade:', { type, piAmount, tokenAmount: Math.floor(tokenAmount), fee })

  const { data, error } = await supabase.rpc('execute_trade', {
    p_token_id:      tokenId,
    p_trader_uid:    traderUid,
    p_type:          type,
    p_pi_amount:     parseFloat(piAmount),
    p_token_amount:  Math.floor(parseFloat(tokenAmount)),
    p_fee_amount:    parseFloat(fee),
    p_pi_payment_id: String(paymentId),
    p_pi_tx_id:      String(txId),
  })

  if (error) {
    console.error('[Trade] execute_trade failed:', error)
    throw new Error(error.message || 'Trade execution failed')
  }

  console.log('[Trade] execute_trade success, id:', data)
  return data
}

export default function BuySellPanel({ token, userHolding = 0, onTradeComplete }) {
  const { user, isConnected, connectWallet, inPiBrowser, loading: authLoading } = useAuth()
  const [tab,      setTab]      = useState('buy')
  const [amount,   setAmount]   = useState('')
  const [quote,    setQuote]    = useState(null)
  const [trading,  setTrading]  = useState(false)
  const [slippage, setSlippage] = useState(1)

  const state = {
    virtualPiReserve:    parseFloat(token.virtual_pi_reserve    || INITIAL_STATE.virtualPiReserve),
    virtualTokenReserve: parseFloat(token.virtual_token_reserve || INITIAL_STATE.virtualTokenReserve),
    k:                   parseFloat(token.k_constant            || INITIAL_STATE.k),
  }

  useEffect(() => {
    const val = parseFloat(amount)
    if (!val || val <= 0) { setQuote(null); return }
    try {
      setQuote(tab === 'buy' ? getBuyQuote(state, val) : getSellQuote(state, val))
    } catch { setQuote(null) }
  }, [amount, tab, token.virtual_pi_reserve, token.virtual_token_reserve])

  useEffect(() => { setAmount(''); setQuote(null) }, [tab])

  function setPreset(val) {
    setAmount(
      tab === 'sell'
        ? Math.floor((userHolding * val) / 100).toString()
        : val.toString()
    )
  }

  // ─── BUY ───────────────────────────────────────────────
  async function handleBuy() {
    const piAmount = parseFloat(amount)
    if (!piAmount || piAmount <= 0) return toast.error('Enter a Pi amount')
    if (!quote || quote.tokensOut <= 0) return toast.error('Invalid amount')

    setTrading(true)
    const loadingToast = toast.loading('Waiting for Pi payment...')

    try {
      await payToBuyTokens(token.ticker, piAmount, {
        onReadyForServerApproval: async (pid) => {
          console.log('[Buy] Payment approved, id:', pid)
          // No pending insert — execute_trade handles everything
        },
        onReadyForServerCompletion: async (pid, txid) => {
          toast.loading('Recording trade...', { id: loadingToast })
          // This throws if fails — piSDK will reject the promise
          await runTrade({
            tokenId:     token.id,
            traderUid:   user.pi_uid,
            type:        'buy',
            piAmount,
            tokenAmount: quote.tokensOut,
            fee:         quote.fee,
            paymentId:   pid,
            txId:        txid,
          })
        },
      })

      toast.dismiss(loadingToast)
      toast.success(`🎉 Bought ${formatTokenAmount(quote.tokensOut)} $${token.ticker}!`, { duration: 5000 })
      setAmount(''); setQuote(null)
      onTradeComplete?.()

    } catch (err) {
      toast.dismiss(loadingToast)
      const msg = err?.message || ''
      if (msg === 'PAYMENT_CANCELLED') toast('Payment cancelled.', { icon: '❌' })
      else if (msg === 'PI_BROWSER_REQUIRED') toast.error('Open in Pi Browser to trade.')
      else { toast.error(`Trade failed: ${msg || 'Unknown error'}`); console.error('[Buy]', err) }
    } finally { setTrading(false) }
  }

  // ─── SELL ──────────────────────────────────────────────
  async function handleSell() {
    const tokenAmount = parseFloat(amount)
    if (!tokenAmount || tokenAmount <= 0) return toast.error('Enter token amount')
    if (tokenAmount > userHolding)        return toast.error('Insufficient balance')
    if (!quote || quote.piOut <= 0)       return toast.error('Invalid amount')

    setTrading(true)
    const sellToast = toast.loading('Processing sell...')

    try {
      await runTrade({
        tokenId:     token.id,
        traderUid:   user.pi_uid,
        type:        'sell',
        piAmount:    quote.piOut,
        tokenAmount,
        fee:         quote.fee,
        paymentId:   `sell-${Date.now()}`,
        txId:        `testnet-sell-${Date.now()}`,
      })

      toast.dismiss(sellToast)
      toast.success(`💰 Sold ${formatTokenAmount(tokenAmount)} $${token.ticker} for ${formatPi(quote.piOut)}`, { duration: 5000 })
      setAmount(''); setQuote(null)
      onTradeComplete?.()

    } catch (err) {
      toast.dismiss(sellToast)
      toast.error(`Sell failed: ${err?.message || 'Try again'}`)
      console.error('[Sell]', err)
    } finally { setTrading(false) }
  }

  if (!inPiBrowser) {
    return (
      <div className="text-center py-6 px-4">
        <div className="text-4xl mb-3">📱</div>
        <p className="font-display font-bold text-pi-white mb-2">Pi Browser Required</p>
        <p className="text-sm text-pi-muted">Open PiPump in Pi Browser to trade.</p>
      </div>
    )
  }
  if (!isConnected) {
    return (
      <div className="text-center py-6 px-4">
        <div className="text-4xl mb-3">👛</div>
        <p className="font-display font-bold text-pi-white mb-2">Connect Your Wallet</p>
        <p className="text-sm text-pi-muted mb-4">Connect Pi wallet to start trading.</p>
        <button onClick={connectWallet} disabled={authLoading} className="btn-primary w-full">
          {authLoading ? 'Connecting...' : 'Connect Pi Wallet'}
        </button>
      </div>
    )
  }
  if (token.status === 'graduated') {
    return (
      <div className="text-center py-6 px-4">
        <div className="text-4xl mb-3">🎓</div>
        <p className="font-display font-bold text-pi-white mb-2">Token Graduated!</p>
        <p className="text-sm text-pi-muted">Liquidity is locked.</p>
      </div>
    )
  }

  return (
    <div className="pi-card overflow-hidden">
      {/* Tabs */}
      <div className="flex">
        {['buy','sell'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-sm font-display font-bold transition-all
              ${tab === t
                ? t === 'buy'
                  ? 'bg-pi-green/15 text-green-400 border-b-2 border-green-400'
                  : 'bg-pi-red/10 text-pi-red border-b-2 border-pi-red'
                : 'text-pi-muted hover:text-pi-text border-b border-pi-border'
              }`}>
            {t === 'buy' ? 'Buy' : 'Sell'}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* Balance */}
        <div className="flex justify-between items-center">
          {tab === 'buy' ? (
            <p className="text-xs text-pi-muted font-mono">
              Pay with <span className="text-pi-white font-bold">Pi (π)</span>
            </p>
          ) : (
            <div>
              <p className="text-xs text-pi-muted font-mono">Your balance:</p>
              <p className="text-sm font-mono font-bold text-pi-lime">
                {formatTokenAmount(userHolding)} ${token.ticker}
              </p>
            </div>
          )}
          <p className="text-xs text-pi-muted font-mono">1% fee</p>
        </div>

        {/* Input */}
        <div className="relative">
          <input type="number" value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={tab === 'buy' ? '0.0 Pi' : `0 ${token.ticker}`}
            min="0" step={tab === 'buy' ? '0.1' : '1'}
            className="pi-input pr-16 font-mono text-base" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-pi-muted font-bold">
            {tab === 'buy' ? 'π' : `$${token.ticker}`}
          </span>
        </div>

        {/* Presets */}
        <div className="flex gap-2">
          {(tab === 'buy' ? BUY_PRESETS : SELL_PRESETS).map(v => (
            <button key={v} onClick={() => setPreset(v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold active:scale-95 transition-all
                bg-pi-card border border-pi-border text-pi-muted
                ${tab === 'buy' ? 'hover:border-pi-green/40 hover:text-green-400' : 'hover:border-pi-red/40 hover:text-pi-red'}`}>
              {tab === 'buy' ? `${v}π` : `${v}%`}
            </button>
          ))}
        </div>

        {/* Quote */}
        {quote && (
          <div className="bg-pi-bg rounded-xl p-3 border border-pi-border/50 space-y-0.5">
            {tab === 'buy' ? (
              <>
                <QuoteRow label="You receive"  value={`${formatTokenAmount(quote.tokensOut)} $${token.ticker}`} highlight />
                <QuoteRow label="Avg price"    value={`${formatPrice(quote.priceAfter)} π`} />
                <QuoteRow label="Price impact" value={`${quote.priceImpact}%`} />
                <QuoteRow label="Fee"          value={formatPi(quote.fee)} />
              </>
            ) : (
              <>
                <QuoteRow label="You receive"  value={formatPi(quote.piOut)} highlight />
                <QuoteRow label="Avg price"    value={`${formatPrice(quote.priceAfter)} π`} />
                <QuoteRow label="Price impact" value={`-${quote.priceImpact}%`} />
                <QuoteRow label="Fee"          value={formatPi(quote.fee)} />
              </>
            )}
          </div>
        )}

        {quote && parseFloat(quote.priceImpact) > 5 && (
          <div className="flex gap-2 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <span className="text-amber-400 flex-shrink-0">⚠️</span>
            <p className="text-xs text-amber-300">High price impact ({quote.priceImpact}%). Try a smaller amount.</p>
          </div>
        )}

        {/* Action button */}
        {tab === 'buy' ? (
          <button onClick={handleBuy}
            disabled={trading || !amount || !quote || parseFloat(amount) <= 0}
            className="btn-buy flex items-center justify-center gap-2">
            {trading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              : `Buy $${token.ticker}`}
          </button>
        ) : (
          <button onClick={handleSell}
            disabled={trading || !amount || !quote || parseFloat(amount) > userHolding || userHolding <= 0}
            className="btn-sell flex items-center justify-center gap-2">
            {trading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              : userHolding <= 0 ? 'No tokens to sell' : `Sell $${token.ticker}`}
          </button>
        )}

        {/* Slippage */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-pi-muted font-mono">Slippage</span>
          <div className="flex gap-1.5">
            {[0.5, 1, 2].map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all
                  ${slippage === s ? 'bg-pi-purple/20 text-pi-purpleLt border border-pi-purple/30' : 'text-pi-muted hover:text-pi-text'}`}>
                {s}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
