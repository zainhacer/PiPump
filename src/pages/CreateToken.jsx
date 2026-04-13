import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth }        from '../hooks/useAuth'
import { useImageUpload } from '../hooks/useImageUpload'
import { supabase }       from '../lib/supabase'
import { payCreationFee, isPiBrowser } from '../lib/piSDK'
import { INITIAL_STATE }  from '../lib/bondingCurve'

import ImageUploader      from '../components/create/ImageUploader'
import TokenPreviewCard   from '../components/create/TokenPreviewCard'
import CreationFeeBox     from '../components/create/CreationFeeBox'

const RESERVED_TICKERS = ['PI', 'BTC', 'ETH', 'USDT', 'BNB']

function validate(form, imageFile) {
  const errs = {}
  if (!form.name.trim())          errs.name = 'Token name is required'
  else if (form.name.length > 32) errs.name = 'Max 32 characters'
  if (!form.ticker.trim())        errs.ticker = 'Ticker is required'
  else if (!/^[A-Z0-9]{2,8}$/.test(form.ticker.toUpperCase()))
                                  errs.ticker = '2–8 uppercase letters/numbers only'
  else if (RESERVED_TICKERS.includes(form.ticker.toUpperCase()))
                                  errs.ticker = 'This ticker is reserved'
  if (form.description.length > 280) errs.description = 'Max 280 characters'
  if (form.website_url  && !/^https?:\/\/.+/.test(form.website_url))  errs.website_url  = 'Must start with http(s)://'
  if (form.twitter_url  && !/^https?:\/\/.+/.test(form.twitter_url))  errs.twitter_url  = 'Must start with http(s)://'
  if (form.telegram_url && !/^https?:\/\/.+/.test(form.telegram_url)) errs.telegram_url = 'Must start with http(s)://'
  if (!imageFile) errs.image = 'Token image is required'
  return errs
}

function StepDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className={`transition-all duration-300
          ${s === step ? 'w-6 h-2 rounded-full bg-pi-lime'
            : s < step ? 'w-2 h-2 rounded-full bg-pi-purple'
            : 'w-2 h-2 rounded-full bg-pi-border'}`} />
      ))}
    </div>
  )
}

function Field({ label, hint, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-pi-muted">
          {label} {required && <span className="text-pi-red">*</span>}
        </label>
        {hint && <span className="text-[11px] text-pi-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-pi-red font-mono">{error}</p>}
    </div>
  )
}

function Step1({ form, onChange, errors, imageFile, setImageFile, imageUpload, onNext }) {
  function handleImageSelect(file) {
    const ok = imageUpload.selectFile(file)
    if (ok) setImageFile(file)
  }
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-black text-xl text-pi-white mb-1">Token Details</h2>
        <p className="text-sm text-pi-muted">Set your token's identity.</p>
      </div>
      <ImageUploader preview={imageUpload.preview} onFileSelect={handleImageSelect}
        error={errors.image || imageUpload.error} uploading={imageUpload.uploading} />
      <Field label="Token Name" required error={errors.name} hint={`${form.name.length}/32`}>
        <input type="text" value={form.name} onChange={e => onChange('name', e.target.value)}
          placeholder="e.g. Moon Rocket" maxLength={32} className="pi-input" />
      </Field>
      <Field label="Ticker Symbol" required error={errors.ticker} hint="2–8 chars">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono text-pi-muted font-bold">$</span>
          <input type="text" value={form.ticker}
            onChange={e => onChange('ticker', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="MOON" maxLength={8} className="pi-input pl-8 font-mono font-bold uppercase tracking-widest" />
        </div>
      </Field>
      <Field label="Description" hint={`${form.description.length}/280`} error={errors.description}>
        <textarea value={form.description} onChange={e => onChange('description', e.target.value)}
          placeholder="Tell the world about your token..." rows={3} maxLength={280}
          className="pi-input resize-none leading-relaxed" />
      </Field>
      <button onClick={onNext} className="btn-primary w-full flex items-center justify-center gap-2">
        Next: Socials
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  )
}

function Step2({ form, onChange, errors, onBack, onNext }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-black text-xl text-pi-white mb-1">Social Links</h2>
        <p className="text-sm text-pi-muted">Optional — helps build trust.</p>
      </div>
      <Field label="Website" error={errors.website_url}>
        <input type="url" value={form.website_url} onChange={e => onChange('website_url', e.target.value)}
          placeholder="https://yourtoken.com" className="pi-input" />
      </Field>
      <Field label="Twitter / X" error={errors.twitter_url}>
        <input type="url" value={form.twitter_url} onChange={e => onChange('twitter_url', e.target.value)}
          placeholder="https://twitter.com/yourtoken" className="pi-input" />
      </Field>
      <Field label="Telegram" error={errors.telegram_url}>
        <input type="url" value={form.telegram_url} onChange={e => onChange('telegram_url', e.target.value)}
          placeholder="https://t.me/yourtoken" className="pi-input" />
      </Field>
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-ghost flex-1">← Back</button>
        <button onClick={onNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Next: Launch
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function Step3({ form, imagePreview, onBack, onLaunch, launching }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-black text-xl text-pi-white mb-1">Review & Launch 🚀</h2>
        <p className="text-sm text-pi-muted">Check everything before paying.</p>
      </div>
      <TokenPreviewCard values={form} imagePreview={imagePreview} />
      <CreationFeeBox />
      {!isPiBrowser() && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-300 leading-relaxed">
            <strong>Pi Browser required</strong> to pay and launch.
          </p>
        </div>
      )}
      <p className="text-[11px] text-pi-muted text-center leading-relaxed">
        By launching, you agree this token is for entertainment. No guarantees of value.
      </p>
      <div className="flex gap-3">
        <button onClick={onBack} disabled={launching} className="btn-ghost flex-1">← Back</button>
        <button onClick={onLaunch} disabled={launching || !isPiBrowser()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 animate-pulse-lime">
          {launching
            ? <><span className="w-4 h-4 border-2 border-pi-bg/30 border-t-pi-bg rounded-full animate-spin"/>Launching...</>
            : '🚀 Pay & Launch (1 π)'
          }
        </button>
      </div>
    </div>
  )
}

function SuccessScreen({ tokenId, ticker }) {
  const navigate = useNavigate()
  return (
    <div className="text-center py-8 space-y-5">
      <div className="text-6xl animate-bounce">🎉</div>
      <div>
        <h2 className="font-display font-black text-2xl text-pi-white mb-2">${ticker} is Live!</h2>
        <p className="text-sm text-pi-muted">Your token is on PiPump. Share it and let trading begin!</p>
      </div>
      <div className="space-y-3">
        <button onClick={() => navigate(`/token/${tokenId}`)} className="btn-primary w-full">
          View Token Page →
        </button>
        <button onClick={() => navigate('/')} className="btn-ghost w-full">Back to Home</button>
      </div>
      <div className="pi-card p-3">
        <p className="text-xs text-pi-muted font-mono mb-1">Share your token link</p>
        <p className="text-xs text-pi-purpleLt font-mono break-all">
          {window.location.origin}/PiPump/token/{tokenId}
        </p>
      </div>
    </div>
  )
}

export default function CreateToken() {
  const navigate    = useNavigate()
  const { user, isConnected, connectWallet, loading: authLoading, inPiBrowser } = useAuth()
  const imageUpload = useImageUpload()

  const [step,      setStep]      = useState(1)
  const [launching, setLaunching] = useState(false)
  const [success,   setSuccess]   = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [errors,    setErrors]    = useState({})

  const [form, setForm] = useState({
    name: '', ticker: '', description: '',
    website_url: '', twitter_url: '', telegram_url: '',
  })

  function onChange(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  async function goToStep2() {
    const errs = validate(form, imageFile)
    const step1Errs = {}
    if (errs.name)        step1Errs.name        = errs.name
    if (errs.ticker)      step1Errs.ticker      = errs.ticker
    if (errs.description) step1Errs.description = errs.description
    if (errs.image)       step1Errs.image       = errs.image

    if (!step1Errs.ticker) {
      const { data } = await supabase.from('tokens').select('id')
        .eq('ticker', form.ticker.toUpperCase()).maybeSingle()
      if (data) step1Errs.ticker = 'This ticker is already taken'
    }
    if (Object.keys(step1Errs).length > 0) { setErrors(step1Errs); return }
    setErrors({})
    setStep(2)
  }

  function goToStep3() {
    const errs = validate(form, imageFile)
    const step2Errs = {}
    if (errs.website_url)  step2Errs.website_url  = errs.website_url
    if (errs.twitter_url)  step2Errs.twitter_url  = errs.twitter_url
    if (errs.telegram_url) step2Errs.telegram_url = errs.telegram_url
    if (Object.keys(step2Errs).length > 0) { setErrors(step2Errs); return }
    setErrors({})
    setStep(3)
  }

  async function handleLaunch() {
    if (!isPiBrowser()) { toast.error('Open in Pi Browser to launch.'); return }
    if (!isConnected)   { toast.error('Connect your Pi wallet first.'); return }

    setLaunching(true)

    // Step 1: Upload image (optional)
    let imageUrl = null
    if (imageFile) {
      const uploadToast = toast.loading('Uploading image...')
      try {
        imageUrl = await imageUpload.upload(imageFile, user.pi_uid)
        toast.dismiss(uploadToast)
        if (!imageUrl) toast('Image upload failed — launching without image.', { icon: '⚠️', duration: 3000 })
      } catch {
        toast.dismiss(uploadToast)
        toast('Image upload failed — launching without image.', { icon: '⚠️', duration: 3000 })
      }
    }

    // Step 2: Pi payment
    const payToast = toast.loading('Waiting for Pi payment...')
    try {
      const { paymentId, txId } = await payCreationFee(form, {
        onReadyForServerApproval:   async (pid) => { console.log('[CT] Approved:', pid) },
        onReadyForServerCompletion: async (pid, txid) => {
          toast.loading('Creating token...', { id: payToast })
        },
      })

      // Step 3: Insert token
      const { data: newToken, error: insertErr } = await supabase
        .from('tokens')
        .insert({
          creator_uid:           user.pi_uid,
          name:                  form.name.trim(),
          ticker:                form.ticker.toUpperCase(),
          description:           form.description.trim(),
          image_url:             imageUrl,
          website_url:           form.website_url  || null,
          twitter_url:           form.twitter_url  || null,
          telegram_url:          form.telegram_url || null,
          virtual_pi_reserve:    INITIAL_STATE.virtualPiReserve,
          virtual_token_reserve: INITIAL_STATE.virtualTokenReserve,
          k_constant:            INITIAL_STATE.k,
          total_supply:          INITIAL_STATE.totalSupply,
          graduation_threshold:  INITIAL_STATE.graduationThreshold,
          current_price:         INITIAL_STATE.virtualPiReserve / INITIAL_STATE.virtualTokenReserve,
          creation_tx_id:        txId,
          status:                'active',
        })
        .select('id, ticker')
        .single()

      if (insertErr) throw insertErr

      // DB trigger automatically updates platform_config.total_tokens on INSERT
      // No manual update needed

      toast.dismiss(payToast)
      setSuccess({ tokenId: newToken.id, ticker: newToken.ticker })

    } catch (err) {
      toast.dismiss(payToast)
      if (err.message === 'PAYMENT_CANCELLED') {
        toast('Payment cancelled.', { icon: '❌' })
      } else {
        toast.error(`Launch failed: ${err.message || 'Try again'}`)
        console.error('[CT] Error:', err)
      }
    } finally {
      setLaunching(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="page-container py-16 text-center">
        <div className="text-5xl mb-4">👛</div>
        <h2 className="font-display font-black text-xl text-pi-white mb-2">Connect Wallet to Create</h2>
        <p className="text-sm text-pi-muted mb-6 max-w-xs mx-auto">
          You need a Pi wallet to create and launch tokens on PiPump.
        </p>
        <button onClick={connectWallet} disabled={authLoading} className="btn-primary mx-auto">
          {authLoading ? 'Connecting...' : 'Connect Pi Wallet'}
        </button>
        {!inPiBrowser && <p className="text-xs text-pi-muted mt-4">📱 Open in Pi Browser for wallet access.</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="page-container py-6">
        {!success && (
          <div className="mb-6">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
                    className="flex items-center gap-1.5 text-pi-muted hover:text-pi-text text-sm font-mono transition-colors mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              {step > 1 ? 'Back' : 'Cancel'}
            </button>
            <h1 className="font-display font-black text-2xl text-pi-white">Create Token 🚀</h1>
            <p className="text-sm text-pi-muted mt-1">
              Step {step} of 3 — {step === 1 ? 'Basic Info' : step === 2 ? 'Social Links' : 'Review & Launch'}
            </p>
            <StepDots step={step} />
          </div>
        )}

        {!success && (
          <div className="md:grid md:grid-cols-[1fr_320px] md:gap-8">
            <div>
              {step === 1 && <Step1 form={form} onChange={onChange} errors={errors}
                imageFile={imageFile} setImageFile={setImageFile}
                imageUpload={imageUpload} onNext={goToStep2} />}
              {step === 2 && <Step2 form={form} onChange={onChange} errors={errors}
                onBack={() => setStep(1)} onNext={goToStep3} />}
              {step === 3 && <Step3 form={form} imagePreview={imageUpload.preview}
                onBack={() => setStep(2)} onLaunch={handleLaunch} launching={launching} />}
            </div>
            <div className="hidden md:block space-y-4 mt-10">
              <TokenPreviewCard values={form} imagePreview={imageUpload.preview} />
              <CreationFeeBox />
            </div>
          </div>
        )}

        {success && <SuccessScreen tokenId={success.tokenId} ticker={success.ticker} />}
      </div>
    </div>
  )
}
