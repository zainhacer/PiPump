import { Link } from 'react-router-dom'
import { useState } from 'react'
import { formatPrice, formatTokenAmount, formatPi, getGraduationProgress } from '../../lib/bondingCurve'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

// ─── Stat box ─────────────────────────────────────────────
function StatBox({ label, value, sub }) {
  return (
    <div className="pi-card px-3 py-2.5">
      <p className="text-[11px] text-pi-muted font-mono mb-0.5">{label}</p>
      <p className="text-sm font-mono font-bold text-pi-white">{value}</p>
      {sub && <p className="text-[10px] text-pi-muted font-mono mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Social link ──────────────────────────────────────────
function SocialLink({ href, icon, label }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-pi-card border border-pi-border text-xs text-pi-muted
                  hover:border-pi-purple/40 hover:text-pi-text transition-all">
      <span>{icon}</span>
      <span className="font-mono">{label}</span>
    </a>
  )
}

export default function TokenInfo({ token }) {
  const { user } = useAuth()
  const [reported,    setReported]    = useState(false)
  const [showReport,  setShowReport]  = useState(false)
  const [reportReason, setReportReason] = useState('')

  const {
    id, name, ticker, image_url, description,
    current_price, price_change_24h,
    volume_24h, volume_total,
    total_supply, circulating_supply,
    holder_count, trade_count,
    real_pi_collected, graduation_threshold,
    is_verified, is_featured, status,
    website_url, twitter_url, telegram_url,
    created_at,
    users: creator,
  } = token

  const gradPct = getGraduationProgress(real_pi_collected || 0)
  const mcap    = parseFloat(current_price || 0) * parseFloat(total_supply || 0)
  const change  = parseFloat(price_change_24h || 0)

  async function submitReport() {
    if (!reportReason.trim()) return
    if (!user) return toast.error('Connect wallet to report')
    try {
      await supabase.from('reports').insert({
        token_id:     id,
        reporter_uid: user.pi_uid,
        reason:       reportReason,
      })
      setReported(true)
      setShowReport(false)
      toast.success('Report submitted. Our team will review it.')
    } catch {
      toast.error('Failed to submit report.')
    }
  }

  return (
    <div className="space-y-4">

      {/* ─── Token header ─── */}
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-pi-border flex-shrink-0
                        border border-pi-border/50">
          {image_url ? (
            <img src={image_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center
                            bg-gradient-to-br from-pi-purple/40 to-pi-lime/10">
              <span className="font-display font-black text-2xl text-pi-white">
                {ticker?.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-display font-black text-xl text-pi-white">{name}</h1>
            {is_verified && (
              <span className="badge-lime text-[10px]">✓ Verified</span>
            )}
            {is_featured && (
              <span className="badge-red text-[10px]">🔥 Featured</span>
            )}
            {status === 'graduated' && (
              <span className="badge-purple text-[10px]">🎓 Graduated</span>
            )}
          </div>
          <p className="font-mono text-sm text-pi-muted">${ticker}</p>

          {/* Creator */}
          {creator && (
            <Link
              to={`/profile/${creator.pi_uid}`}
              className="inline-flex items-center gap-1.5 mt-1.5
                         text-[11px] text-pi-muted hover:text-pi-purpleLt transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-pi-purple/20 flex items-center justify-center">
                <span className="text-[8px] text-pi-purpleLt font-bold">
                  {creator.username?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              by {creator.username}
            </Link>
          )}
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-lg font-bold text-pi-lime">
            {formatPrice(parseFloat(current_price || 0))} π
          </p>
          <p className={`text-sm font-mono font-bold ${change >= 0 ? 'num-positive' : 'num-negative'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* ─── Description ─── */}
      {description && (
        <p className="text-sm text-pi-muted leading-relaxed border-l-2 border-pi-border pl-3">
          {description}
        </p>
      )}

      {/* ─── Stats grid ─── */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatBox
          label="Market Cap"
          value={formatPi(mcap)}
        />
        <StatBox
          label="Volume 24h"
          value={formatPi(volume_24h || 0)}
          sub={`Total: ${formatPi(volume_total || 0)}`}
        />
        <StatBox
          label="Holders"
          value={(holder_count || 0).toLocaleString()}
          sub={`${trade_count || 0} trades`}
        />
        <StatBox
          label="Circulating"
          value={formatTokenAmount(circulating_supply || 0)}
          sub={`of ${formatTokenAmount(total_supply || 0)}`}
        />
      </div>

      {/* ─── Socials ─── */}
      {(website_url || twitter_url || telegram_url) && (
        <div className="flex flex-wrap gap-2">
          <SocialLink href={website_url}  icon="🌐" label="Website" />
          <SocialLink href={twitter_url}  icon="𝕏" label="Twitter" />
          <SocialLink href={telegram_url} icon="✈️" label="Telegram" />
        </div>
      )}

      {/* ─── Report button ─── */}
      {user && !reported && (
        <div>
          {!showReport ? (
            <button
              onClick={() => setShowReport(true)}
              className="text-[11px] text-pi-muted hover:text-pi-red transition-colors font-mono"
            >
              🚨 Report this token
            </button>
          ) : (
            <div className="pi-card p-3 space-y-2">
              <p className="text-xs font-mono text-pi-muted">Reason for report:</p>
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                className="pi-input resize-none text-xs"
              />
              <div className="flex gap-2">
                <button onClick={submitReport}
                        className="btn-primary text-xs px-3 py-1.5 flex-1">
                  Submit
                </button>
                <button onClick={() => setShowReport(false)}
                        className="btn-ghost text-xs px-3 py-1.5">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {reported && (
        <p className="text-[11px] text-pi-muted font-mono">✓ Report submitted</p>
      )}
    </div>
  )
}
