const CREATION_FEE   = parseFloat(import.meta.env.VITE_CREATION_FEE || '1')
const TRADE_FEE_PCT  = parseFloat(import.meta.env.VITE_TRADE_FEE_PERCENT || '1')

export default function CreationFeeBox() {
  return (
    <div className="pi-card p-4 border-pi-lime/20 bg-pi-lime/[0.02]">

      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">💰</span>
        <p className="text-sm font-display font-bold text-pi-white">
          Launch Fees
        </p>
      </div>

      <div className="space-y-2">
        {/* Creation fee */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-pi-text font-mono">Token Creation Fee</p>
            <p className="text-[11px] text-pi-muted">One-time launch fee</p>
          </div>
          <span className="font-mono text-sm font-bold text-pi-lime">
            {CREATION_FEE} π
          </span>
        </div>

        <div className="glow-line" />

        {/* Trade fee */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-pi-text font-mono">Trade Fee</p>
            <p className="text-[11px] text-pi-muted">Per buy/sell transaction</p>
          </div>
          <span className="font-mono text-sm font-bold text-pi-muted">
            {TRADE_FEE_PCT}%
          </span>
        </div>

        <div className="glow-line" />

        {/* Graduation */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-pi-text font-mono">Graduation Target</p>
            <p className="text-[11px] text-pi-muted">Liquidity locks at graduation</p>
          </div>
          <span className="font-mono text-sm font-bold text-pi-muted">
            800 π
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-pi-border/40">
        <p className="text-[11px] text-pi-muted leading-relaxed">
          🔒 Your token launches instantly. No rug pulls — when 800π is collected,
          liquidity is permanently locked.
        </p>
      </div>
    </div>
  )
}
