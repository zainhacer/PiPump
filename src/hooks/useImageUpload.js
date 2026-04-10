import { useState } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'pipump'

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
    if (file.size > 5 * 1024 * 1024) {
      setError('Max size is 5MB.')
      return false
    }

    setPreview(URL.createObjectURL(file))
    return true
  }

  async function upload(file, userUid) {
    if (!file) return null
    setUploading(true)
    setError(null)

    try {
      // ── Step 1: Check bucket exists ──────────────────
      const { data: buckets, error: bucketErr } = await supabase
        .storage
        .listBuckets()

      console.log('[Upload] All buckets:', buckets?.map(b => b.name))
      console.log('[Upload] Bucket error:', bucketErr)

      const bucketExists = buckets?.some(b => b.name === BUCKET)
      if (!bucketExists) {
        throw new Error(`Bucket "${BUCKET}" not found. Create it in Supabase Dashboard → Storage`)
      }

      // ── Step 2: Upload file ───────────────────────────
      const ext  = file.name.split('.').pop().toLowerCase() || 'jpg'
      const path = `token-images/${userUid}_${Date.now()}.${ext}`

      console.log('[Upload] Uploading to:', BUCKET, '/', path)
      console.log('[Upload] File:', file.name, file.type, file.size, 'bytes')

      const { data, error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert:       true,       // upsert=true avoids "already exists" error
          contentType:  file.type,
        })

      if (upErr) {
        console.error('[Upload] Upload error object:', JSON.stringify(upErr, null, 2))
        console.error('[Upload] Status:', upErr.statusCode)
        console.error('[Upload] Message:', upErr.message)
        console.error('[Upload] Error:', upErr.error)

        // Show user-friendly message based on error type
        if (upErr.statusCode === '404' || upErr.message?.includes('Bucket not found')) {
          throw new Error('Storage bucket not found. Run storage_nuclear.sql in Supabase.')
        }
        if (upErr.statusCode === '403' || upErr.message?.includes('not allowed')) {
          throw new Error('Storage permission denied. Run storage_nuclear.sql in Supabase.')
        }
        if (upErr.statusCode === '413' || upErr.message?.includes('too large')) {
          throw new Error('File too large. Max 5MB.')
        }
        throw new Error(upErr.message || 'Upload failed')
      }

      console.log('[Upload] Success:', data)

      // ── Step 3: Get public URL ────────────────────────
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      console.log('[Upload] Public URL:', urlData.publicUrl)
      setUploadedUrl(urlData.publicUrl)
      return urlData.publicUrl

    } catch (err) {
      console.error('[Upload] Final catch:', err.message)
      setError(err.message || 'Image upload failed. Try again.')
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
