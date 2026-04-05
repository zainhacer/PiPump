import { formatPrice, getGraduationProgress, INITIAL_STATE } from '../../lib/bondingCurve'

export default function TokenPreviewCard({ values, imagePreview }) {
  const { name, ticker, description } = values
  const startPrice = INITIAL_STATE.virtualPiReserve / INITIAL_STATE.virtualTokenReserve

  return (
    <div className="pi-card p-4 border-pi-purple/20">

      {/* Label */}
      <p className="text-[11px] font-mono text-pi-muted mb-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-pi-lime animate-pulse" />
        Live Preview
      </p>

      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-pi-border
                        border border-pi-border/50">
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center
                            bg-gradient-to-br from-pi-purple/30 to-pi-lime/10">
              <span className="font-display font-black text-xl text-pi-white/50">
                {ticker ? ticker.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-pi-white text-sm">
            {name || 'Your Token Name'}
          </p>
          <p className="font-mono text-xs text-pi-muted mt-0.5">
            ${ticker ? ticker.toUpperCase() : 'TICK'}
          </p>
          {description && (
            <p className="text-[11px] text-pi-muted mt-1.5 line-clamp-2 leading-tight">
              {description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-xs text-pi-lime font-bold">
            {formatPrice(startPrice)} π
          </p>
          <p className="text-[10px] text-pi-muted mt-0.5">Start price</p>
        </div>
      </div>

      {/* Graduation bar */}
      <div className="mt-3">
        <div className="curve-bar">
          <div className="curve-bar-fill" style={{ width: '0%' }} />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-[10px] text-pi-muted font-mono">0% to 🎓</p>
          <p className="text-[10px] text-pi-muted font-mono">800 π goal</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-pi-border/40">
        <div>
          <p className="text-[10px] text-pi-muted font-mono">Supply</p>
          <p className="text-xs font-mono font-bold text-pi-white">1,000,000,000</p>
        </div>
        <div>
          <p className="text-[10px] text-pi-muted font-mono">Holders</p>
          <p className="text-xs font-mono font-bold text-pi-white">0</p>
        </div>
        <div>
          <p className="text-[10px] text-pi-muted font-mono">Volume</p>
          <p className="text-xs font-mono font-bold text-pi-white">0 π</p>
        </div>
      </div>
    </div>
  )
}
