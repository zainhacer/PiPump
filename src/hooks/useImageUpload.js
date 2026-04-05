import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MAX_SIZE_MB  = 2
const MAX_SIZE_B   = MAX_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function useImageUpload() {
  const [uploading,  setUploading]  = useState(false)
  const [preview,    setPreview]    = useState(null)   // local blob URL
  const [uploadedUrl, setUploadedUrl] = useState(null) // Supabase public URL
  const [error,      setError]      = useState(null)

  // ─── Validate & preview ───────────────────────────────
  function selectFile(file) {
    setError(null)

    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, GIF, WEBP allowed.')
      return false
    }
    if (file.size > MAX_SIZE_B) {
      setError(`Max size is ${MAX_SIZE_MB}MB.`)
      return false
    }

    // Show local preview immediately
    const url = URL.createObjectURL(file)
    setPreview(url)
    return true
  }

  // ─── Upload to Supabase Storage ───────────────────────
  async function upload(file, userUid) {
    if (!file) return null
    setUploading(true)
    setError(null)

    try {
      const ext      = file.name.split('.').pop()
      const filename = `${userUid}_${Date.now()}.${ext}`
      const path     = `token-images/${filename}`

      const { error: uploadErr } = await supabase.storage
        .from('pipump')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadErr) throw uploadErr

      const { data } = supabase.storage
        .from('pipump')
        .getPublicUrl(path)

      setUploadedUrl(data.publicUrl)
      return data.publicUrl
    } catch (err) {
      setError('Upload failed. Try again.')
      console.error('[ImageUpload]', err)
      return null
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setPreview(null)
    setUploadedUrl(null)
    setError(null)
  }

  return { selectFile, upload, preview, uploadedUrl, uploading, error, reset }
}
