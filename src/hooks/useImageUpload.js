import { useState } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'pipump'
const MAX_MB  = 5

export function useImageUpload() {
  const [uploading,   setUploading]   = useState(false)
  const [preview,     setPreview]     = useState(null)
  const [uploadedUrl, setUploadedUrl] = useState(null)
  const [error,       setError]       = useState(null)

  function selectFile(file) {
    setError(null)
    if (!file) return false

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, GIF, WEBP allowed.')
      return false
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Max size is ${MAX_MB}MB.`)
      return false
    }
    setPreview(URL.createObjectURL(file))
    return true
  }

  async function upload(file, userUid) {
    if (!file) return null
    setUploading(true)
    setError(null)

    // ── Try Supabase Storage first ────────────────────
    try {
      const ext  = file.name.split('.').pop().toLowerCase() || 'jpg'
      const path = `token-images/${userUid}_${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert:       true,
          contentType:  file.type,
        })

      if (!upErr) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        setUploadedUrl(data.publicUrl)
        setUploading(false)
        return data.publicUrl
      }

      // Log actual error for debugging
      console.warn('[Upload] Storage failed:', upErr.message, '| Status:', upErr.statusCode)
      console.warn('[Upload] Falling back to base64...')

      // ── Fallback: convert to base64 dataURL ──────────
      // This stores image inline in the DB — works without Storage bucket
      const base64 = await fileToBase64(file)
      setUploadedUrl(base64)
      setUploading(false)
      return base64

    } catch (err) {
      console.error('[Upload] Error:', err.message)

      // Last resort: try base64 fallback
      try {
        const base64 = await fileToBase64(file)
        setUploadedUrl(base64)
        setUploading(false)
        return base64
      } catch {
        setError('Image upload failed. Try a smaller image.')
        setUploading(false)
        return null
      }
    }
  }

  // ── Convert file to base64 dataURL ──────────────────
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      // Resize image first to keep DB size small
      const canvas = document.createElement('canvas')
      const ctx    = canvas.getContext('2d')
      const img    = new Image()
      const url    = URL.createObjectURL(file)

      img.onload = () => {
        // Max 200x200 for base64 storage
        const MAX = 200
        let w = img.width
        let h = img.height

        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX } }
        else        { if (h > MAX) { w = w * MAX / h; h = MAX } }

        canvas.width  = Math.round(w)
        canvas.height = Math.round(h)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        URL.revokeObjectURL(url)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read image'))
      }

      img.src = url
    })
  }

  function reset() {
    setPreview(null)
    setUploadedUrl(null)
    setError(null)
  }

  return { selectFile, upload, preview, uploadedUrl, uploading, error, reset }
}
