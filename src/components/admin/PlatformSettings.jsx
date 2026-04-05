import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { adminActions } from '../../hooks/useAdmin'

function SettingRow({ label, hint, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3
                    py-4 border-b border-pi-border/40 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-mono font-bold text-pi-white">{label}</p>
        {hint && <p className="text-xs text-pi-muted mt-0.5">{hint}</p>}
      </div>
      <div className="md:w-48">{children}</div>
    </div>
  )
}

export default function PlatformSettings() {
  const [config,  setConfig]  = useState(null)
  const [cms,     setCms]     = useState({ announcement: '', hero_title: '', hero_subtitle: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState({})

  useEffect(() => {
    Promise.all([
      supabase.from('platform_config').select('*').single(),
      supabase.from('site_content').select('key, value'),
    ]).then(([cfg, content]) => {
      if (cfg.data)     setConfig(cfg.data)
      if (content.data) {
        const map = {}
        content.data.forEach(r => { map[r.key] = r.value })
        setCms(prev => ({ ...prev, ...map }))
      }
      setLoading(false)
    })
  }, [])

  async function saveConfig(field, value) {
    setSaving(s => ({ ...s, [field]: true }))
    try {
      await adminActions.updateConfig({ [field]: value })
      setConfig(c => ({ ...c, [field]: value }))
      toast.success('Setting updated!')
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(s => ({ ...s, [field]: false }))
    }
  }

  async function saveCms(key, value) {
    setSaving(s => ({ ...s, [key]: true }))
    try {
      await adminActions.updateContent(key, value)
      toast.success('Content updated!')
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(s => ({ ...s, [key]: false }))
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="h-16 shimmer rounded-xl animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ─── Fee Settings ─── */}
      <div className="pi-card p-5">
        <h3 className="font-display font-bold text-pi-white mb-1">💰 Fee Settings</h3>
        <p className="text-xs text-pi-muted mb-4">Changes apply to new transactions immediately.</p>

        <SettingRow
          label="Token Creation Fee (π)"
          hint="Pi charged when a new token is launched"
        >
          <div className="flex gap-2">
            <input
              type="number" min="0" step="0.1"
              defaultValue={config?.creation_fee_pi || 1}
              className="pi-input font-mono text-sm"
              id="creation-fee"
            />
            <button
              disabled={saving['creation_fee_pi']}
              onClick={() => {
                const val = parseFloat(document.getElementById('creation-fee').value)
                if (!isNaN(val) && val >= 0) saveConfig('creation_fee_pi', val)
              }}
              className="btn-primary px-3 py-2 text-xs flex-shrink-0"
            >
              {saving['creation_fee_pi'] ? '...' : 'Save'}
            </button>
          </div>
        </SettingRow>

        <SettingRow
          label="Trade Fee (%)"
          hint="% of Pi amount taken per buy/sell"
        >
          <div className="flex gap-2">
            <input
              type="number" min="0" max="10" step="0.1"
              defaultValue={config?.trade_fee_percent || 1}
              className="pi-input font-mono text-sm"
              id="trade-fee"
            />
            <button
              disabled={saving['trade_fee_percent']}
              onClick={() => {
                const val = parseFloat(document.getElementById('trade-fee').value)
                if (!isNaN(val) && val >= 0 && val <= 10) saveConfig('trade_fee_percent', val)
              }}
              className="btn-primary px-3 py-2 text-xs flex-shrink-0"
            >
              {saving['trade_fee_percent'] ? '...' : 'Save'}
            </button>
          </div>
        </SettingRow>

        <SettingRow
          label="Graduation Threshold (π)"
          hint="Pi collected to graduate a token"
        >
          <div className="flex gap-2">
            <input
              type="number" min="1" step="10"
              defaultValue={config?.graduation_threshold || 800}
              className="pi-input font-mono text-sm"
              id="grad-threshold"
            />
            <button
              disabled={saving['graduation_threshold']}
              onClick={() => {
                const val = parseFloat(document.getElementById('grad-threshold').value)
                if (!isNaN(val) && val > 0) saveConfig('graduation_threshold', val)
              }}
              className="btn-primary px-3 py-2 text-xs flex-shrink-0"
            >
              {saving['graduation_threshold'] ? '...' : 'Save'}
            </button>
          </div>
        </SettingRow>
      </div>

      {/* ─── Maintenance Mode ─── */}
      <div className="pi-card p-5">
        <h3 className="font-display font-bold text-pi-white mb-1">🔧 Maintenance Mode</h3>
        <p className="text-xs text-pi-muted mb-4">Temporarily disable trading for all users.</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-mono text-pi-white">
              {config?.maintenance_mode ? '⚠️ Maintenance ON' : '✅ Site is Live'}
            </p>
            <p className="text-xs text-pi-muted mt-0.5">
              {config?.maintenance_mode
                ? 'Users see maintenance page'
                : 'Everything running normally'}
            </p>
          </div>
          <button
            onClick={() => saveConfig('maintenance_mode', !config?.maintenance_mode)}
            disabled={saving['maintenance_mode']}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold
                        border transition-all active:scale-95
                        ${config?.maintenance_mode
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-pi-red/10 text-pi-red border-red-500/20'
                        }`}
          >
            {saving['maintenance_mode'] ? '...' :
             config?.maintenance_mode ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
      </div>

      {/* ─── CMS / Content ─── */}
      <div className="pi-card p-5">
        <h3 className="font-display font-bold text-pi-white mb-1">📢 Site Content (CMS)</h3>
        <p className="text-xs text-pi-muted mb-5">Update homepage text and announcements.</p>

        <div className="space-y-4">

          {/* Announcement banner */}
          <div>
            <label className="text-xs font-mono text-pi-muted block mb-1.5">
              Announcement Banner
              <span className="ml-2 text-pi-border">(leave empty to hide)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cms.announcement}
                onChange={e => setCms(c => ({ ...c, announcement: e.target.value }))}
                placeholder="e.g. 🚀 PiPump v2 launching soon!"
                className="pi-input text-sm"
              />
              <button
                disabled={saving['announcement']}
                onClick={() => saveCms('announcement', cms.announcement)}
                className="btn-primary px-3 py-2 text-xs flex-shrink-0"
              >
                {saving['announcement'] ? '...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Hero title */}
          <div>
            <label className="text-xs font-mono text-pi-muted block mb-1.5">
              Hero Title
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cms.hero_title}
                onChange={e => setCms(c => ({ ...c, hero_title: e.target.value }))}
                placeholder="Launch your memecoin on Pi Network"
                className="pi-input text-sm"
              />
              <button
                disabled={saving['hero_title']}
                onClick={() => saveCms('hero_title', cms.hero_title)}
                className="btn-primary px-3 py-2 text-xs flex-shrink-0"
              >
                {saving['hero_title'] ? '...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Hero subtitle */}
          <div>
            <label className="text-xs font-mono text-pi-muted block mb-1.5">
              Hero Subtitle
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cms.hero_subtitle}
                onChange={e => setCms(c => ({ ...c, hero_subtitle: e.target.value }))}
                placeholder="Create, buy & sell tokens with real Pi."
                className="pi-input text-sm"
              />
              <button
                disabled={saving['hero_subtitle']}
                onClick={() => saveCms('hero_subtitle', cms.hero_subtitle)}
                className="btn-primary px-3 py-2 text-xs flex-shrink-0"
              >
                {saving['hero_subtitle'] ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Platform wallet ─── */}
      <div className="pi-card p-5">
        <h3 className="font-display font-bold text-pi-white mb-1">💸 Platform Wallet</h3>
        <p className="text-xs text-pi-muted mb-4">Wallet that receives creation fees and trade fees.</p>
        <div className="flex gap-2">
          <input
            type="text"
            defaultValue={config?.platform_wallet || ''}
            placeholder="Your Pi wallet address"
            className="pi-input font-mono text-sm"
            id="platform-wallet"
          />
          <button
            disabled={saving['platform_wallet']}
            onClick={() => {
              const val = document.getElementById('platform-wallet').value
              saveConfig('platform_wallet', val)
            }}
            className="btn-primary px-3 py-2 text-xs flex-shrink-0"
          >
            {saving['platform_wallet'] ? '...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
