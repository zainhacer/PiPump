import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import {
  getBuyQuote, getSellQuote,
  formatPrice, formatTokenAmount, formatPi,
  INITIAL_STATE
} from '../../lib/bondingCurve'
import { payToBuyTokens } from '../../lib/piSDK'
import { supabase } from '../../lib/supabase'

// ─── Quick amount buttons ─────────────────────────────────
const BUY_PRESETS  = [0.1, 0.5, 1, 5]
const SELL_PRESETS = [10, 25, 50, 100] // percent of holdings

// ─── Quote display row ────────────────────────────────────
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

// ─── Pi Browser wall ─────────────────────────────────────
function PiBrowserWall() {
  return (
    <div className="text-center py-6 px-4">
      <div className="text-4xl mb-3">📱</div>
      <p className="font-display font-bold text-pi-white mb-2">Pi Browser Required</p>
      <p className="text-sm text-pi-muted leading-relaxed">
        Open PiPump in your Pi Browser app to buy and sell tokens with real Pi.
      </p>
    </div>
  )
}

// ─── Connect wallet wall ──────────────────────────────────
function ConnectWall({ onConnect, loading }) {
  return (
    <div className="text-center py-6 px-4">
      <div className="text-4xl mb-3">👛</div>
      <p className="font-display font-bold text-pi-white mb-2">Connect Your Wallet</p>
      <p className="text-sm text-pi-muted mb-4">Connect your Pi wallet to start trading.</p>
      <button onClick={onConnect} disabled={loading} className="btn-primary w-full">
        {loading ? 'Connecting...' : 'Connect Pi Wallet'}
      </button>
    </div>
  )
}

export default function BuySellPanel({ token, userHolding = 0, onTradeComplete }) {
  const { user, isConnected, connectWallet, inPiBrowser, loading: authLoading } = useAuth()
  const [tab,       setTab]       = useState('buy')    // 'buy' | 'sell'
  const [amount,    setAmount]    = useState('')        // Pi for buy, tokens for sell
  const [quote,     setQuote]     = useState(null)
  const [trading,   setTrading]   = useState(false)
  const [slippage,  setSlippage]  = useState(1)        // 1% default

  const state = {
    virtualPiReserve:    parseFloat(token.virtual_pi_reserve    || INITIAL_STATE.virtualPiReserve),
    virtualTokenReserve: parseFloat(token.virtual_token_reserve || INITIAL_STATE.virtualTokenReserve),
    k:                   parseFloat(token.k_constant            || INITIAL_STATE.k),
  }

  const isGraduated = token.status === 'graduated'

  // ─── Recalculate quote on amount change ───────────────
  useEffect(() => {
    const val = parseFloat(amount)
    if (!val || val <= 0) { setQuote(null); return }

    try {
      if (tab === 'buy') {
        setQuote(getBuyQuote(state, val))
      } else {
        setQuote(getSellQuote(state, val))
      }
    } catch {
      setQuote(null)
    }
  }, [amount, tab, token.virtual_pi_reserve, token.virtual_token_reserve])

  // ─── Clear amount on tab switch ───────────────────────
  useEffect(() => {
    setAmount('')
    setQuote(null)
  }, [tab])

  // ─── Set preset amount ────────────────────────────────
  function setPreset(val) {
    if (tab === 'sell') {
      // val is a percent — calculate token amount from holding
      const tokens = Math.floor((userHolding * val) / 100)
      setAmount(tokens.toString())
    } else {
      setAmount(val.toString())
    }
  }

  // ─── Handle Buy ───────────────────────────────────────
  async function handleBuy() {
    const piAmount = parseFloat(amount)
    if (!piAmount || piAmount <= 0) return toast.error('Enter a valid Pi amount')
    if (!quote || quote.tokensOut <= 0) return toast.error('Invalid amount')

    const minTokens = Math.floor(quote.tokensOut * (1 - slippage / 100))
    setTrading(true)

    const loadingToast = toast.loading('Waiting for Pi payment...')

    try {
      const { paymentId, txId } = await payToBuyTokens(
        token.ticker,
        piAmount,
        {
          // Server approval callback
          onReadyForServerApproval: async (pid) => {
            // Record pending trade in Supabase
            await supabase.from('trades').insert({
              token_id:       token.id,
              trader_uid:     user.pi_uid,
              type:           'buy',
              pi_amount:      piAmount,
              token_amount:   quote.tokensOut,
              price_per_token: quote.priceBefore,
              fee_amount:      quote.fee,
              pi_payment_id:   pid,
              status:          'pending',
            })
          },
          // Blockchain confirmed
          onReadyForServerCompletion: async (pid, txid) => {
            toast.dismiss(loadingToast)
            toast.loading('Confirming trade...', { id: 'confirm' })
            // Execute trade — updates reserves + holder balance
            const { error } = await supabase.rpc('execute_trade', {
              p_token_id:      token.id,
              p_trader_uid:    user.pi_uid,
              p_type:          'buy',
              p_pi_amount:     piAmount,
              p_token_amount:  quote.tokensOut,
              p_fee_amount:    quote.fee,
              p_pi_payment_id: pid,
              p_pi_tx_id:      txid,
            })
            toast.dismiss('confirm')
            if (error) throw error
          },
        }
      )

      toast.dismiss(loadingToast)
      toast.success(
        `🎉 Bought ${formatTokenAmount(quote.tokensOut)} $${token.ticker}!`,
        { duration: 5000 }
      )
      setAmount('')
      setQuote(null)
      onTradeComplete?.()

    } catch (err) {
      toast.dismiss(loadingToast)
      toast.dismiss('confirm')
      if (err.message === 'PAYMENT_CANCELLED') {
        toast('Payment cancelled.', { icon: '❌' })
      } else if (err.message === 'PI_BROWSER_REQUIRED') {
        toast.error('Open in Pi Browser to trade.')
      } else {
        toast.error('Trade failed. Please try again.')
        console.error('[BuySell] Buy error:', err)
      }
    } finally {
      setTrading(false)
    }
  }

  // ─── Handle Sell ──────────────────────────────────────
  async function handleSell() {
    const tokenAmount = parseFloat(amount)
    if (!tokenAmount || tokenAmount <= 0) return toast.error('Enter a valid token amount')
    if (tokenAmount > userHolding) return toast.error('Insufficient token balance')
    if (!quote || quote.piOut <= 0) return toast.error('Invalid amount')

    setTrading(true)
    const loadingToast = toast.loading('Processing sell...')

    try {
      // For sell: platform sends Pi to user
      // Testnet: record in Supabase, update reserves
      const { error } = await supabase.rpc('execute_trade', {
        p_token_id:      token.id,
        p_trader_uid:    user.pi_uid,
        p_type:          'sell',
        p_pi_amount:     quote.piOut,
        p_token_amount:  tokenAmount,
        p_fee_amount:    quote.fee,
        p_pi_payment_id: `sell-${Date.now()}`,
        p_pi_tx_id:      `testnet-sell-${Date.now()}`,
      })

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success(
        `💰 Sold ${formatTokenAmount(tokenAmount)} $${token.ticker} for ${formatPi(quote.piOut)}`,
        { duration: 5000 }
      )
      setAmount('')
      setQuote(null)
      onTradeComplete?.()

    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Sell failed. Please try again.')
      console.error('[BuySell] Sell error:', err)
    } finally {
      setTrading(false)
    }
  }

  // ─── Render walls ────────────────────────────────────
  if (!inPiBrowser) return <PiBrowserWall />
  if (!isConnected)  return <ConnectWall onConnect={connectWallet} loading={authLoading} />

  // ─── Graduated token ─────────────────────────────────
  if (isGraduated) {
    return (
      <div className="text-center py-6 px-4">
        <div className="text-4xl mb-3">🎓</div>
        <p className="font-display font-bold text-pi-white mb-2">Token Graduated!</p>
        <p className="text-sm text-pi-muted leading-relaxed">
          This token has graduated. Liquidity is locked. Trading happens on external DEX.
        </p>
      </div>
    )
  }

  return (
    <div className="pi-card overflow-hidden">

      {/* Buy / Sell tabs */}
      <div className="flex">
        <button
          onClick={() => setTab('buy')}
          className={`flex-1 py-3.5 text-sm font-display font-bold transition-all
                      ${tab === 'buy'
                        ? 'bg-pi-green/15 text-green-400 border-b-2 border-green-400'
                        : 'text-pi-muted hover:text-pi-text border-b border-pi-border'
                      }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTab('sell')}
          className={`flex-1 py-3.5 text-sm font-display font-bold transition-all
                      ${tab === 'sell'
                        ? 'bg-pi-red/10 text-pi-red border-b-2 border-pi-red'
                        : 'text-pi-muted hover:text-pi-text border-b border-pi-border'
                      }`}
        >
          Sell
        </button>
      </div>

      <div className="p-4 space-y-4">

        {/* Balance row */}
        <div className="flex justify-between items-center">
          {tab === 'buy' ? (
            <p className="text-xs text-pi-muted font-mono">
              Pay with <span className="text-pi-white font-bold">Pi (π)</span>
            </p>
          ) : (
            <p className="text-xs text-pi-muted font-mono">
              Your balance:{' '}
              <span className="text-pi-white font-bold">
                {formatTokenAmount(userHolding)} ${token.ticker}
              </span>
            </p>
          )}
          <p className="text-xs text-pi-muted font-mono">
            1% fee
          </p>
        </div>

        {/* Amount input */}
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={tab === 'buy' ? '0.0 Pi' : `0 ${token.ticker}`}
            min="0"
            step={tab === 'buy' ? '0.1' : '1'}
            className="pi-input pr-16 font-mono text-base"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2
                           text-xs font-mono text-pi-muted font-bold">
            {tab === 'buy' ? 'π' : `$${token.ticker}`}
          </span>
        </div>

        {/* Preset buttons */}
        <div className="flex gap-2">
          {tab === 'buy'
            ? BUY_PRESETS.map(v => (
                <button key={v} onClick={() => setPreset(v)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold
                                   bg-pi-card border border-pi-border text-pi-muted
                                   hover:border-pi-green/40 hover:text-green-400
                                   active:scale-95 transition-all">
                  {v}π
                </button>
              ))
            : SELL_PRESETS.map(v => (
                <button key={v} onClick={() => setPreset(v)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold
                                   bg-pi-card border border-pi-border text-pi-muted
                                   hover:border-pi-red/40 hover:text-pi-red
                                   active:scale-95 transition-all">
                  {v}%
                </button>
              ))
          }
        </div>

        {/* Quote breakdown */}
        {quote && (
          <div className="bg-pi-bg rounded-xl p-3 border border-pi-border/50 space-y-0.5">
            {tab === 'buy' ? (
              <>
                <QuoteRow
                  label="You receive"
                  value={`${formatTokenAmount(quote.tokensOut)} $${token.ticker}`}
                  highlight
                />
                <QuoteRow
                  label="Price per token"
                  value={`${formatPrice(quote.priceAfter)} π`}
                />
                <QuoteRow
                  label="Price impact"
                  value={`${quote.priceImpact}%`}
                />
                <QuoteRow
                  label="Platform fee"
                  value={`${formatPi(quote.fee)}`}
                />
              </>
            ) : (
              <>
                <QuoteRow
                  label="You receive"
                  value={formatPi(quote.piOut)}
                  highlight
                />
                <QuoteRow
                  label="Price per token"
                  value={`${formatPrice(quote.priceAfter)} π`}
                />
                <QuoteRow
                  label="Price impact"
                  value={`-${quote.priceImpact}%`}
                />
                <QuoteRow
                  label="Platform fee"
                  value={formatPi(quote.fee)}
                />
              </>
            )}
          </div>
        )}

        {/* High price impact warning */}
        {quote && parseFloat(quote.priceImpact) > 5 && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl
                          bg-amber-500/8 border border-amber-500/20">
            <span className="text-amber-400 text-sm flex-shrink-0">⚠️</span>
            <p className="text-xs text-amber-300">
              High price impact ({quote.priceImpact}%). Consider a smaller amount.
            </p>
          </div>
        )}

        {/* Action button */}
        {tab === 'buy' ? (
          <button
            onClick={handleBuy}
            disabled={trading || !amount || !quote}
            className="btn-buy flex items-center justify-center gap-2"
          >
            {trading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span>Buy ${token.ticker}</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSell}
            disabled={trading || !amount || !quote || parseFloat(amount) > userHolding}
            className="btn-sell flex items-center justify-center gap-2"
          >
            {trading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span>Sell ${token.ticker}</span>
              </>
            )}
          </button>
        )}

        {/* Slippage setting */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-pi-muted font-mono">Slippage tolerance</span>
          <div className="flex gap-1.5">
            {[0.5, 1, 2].map(s => (
              <button key={s} onClick={() => setSlippage(s)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all
                                  ${slippage === s
                                    ? 'bg-pi-purple/20 text-pi-purpleLt border border-pi-purple/30'
                                    : 'text-pi-muted hover:text-pi-text'
                                  }`}>
                {s}%
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
