import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MAX_SIZE_MB    = 2
const MAX_SIZE_B     = MAX_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES  = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const BUCKET_NAME    = 'pipump'

export function useImageUpload() {
  const [uploading,   setUploading]   = useState(false)
  const [preview,     setPreview]     = useState(null)
  const [uploadedUrl, setUploadedUrl] = useState(null)
  const [error,       setError]       = useState(null)

  // ─── Validate & preview ───────────────────────────────
  function selectFile(file) {
    setError(null)
    if (!file) return false

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, GIF, WEBP allowed.')
      return false
    }
    if (file.size > MAX_SIZE_B) {
      setError(`Max size is ${MAX_SIZE_MB}MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return false
    }

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
      // Sanitize filename — remove special chars
      const ext      = file.name.split('.').pop().toLowerCase()
      const safeName = `${userUid}_${Date.now()}.${ext}`
      const path     = `token-images/${safeName}`

      console.log('[Upload] Starting upload to bucket:', BUCKET_NAME)
      console.log('[Upload] Path:', path)
      console.log('[Upload] File type:', file.type, '| Size:', (file.size / 1024).toFixed(1), 'KB')

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert:       false,
          contentType:  file.type,
        })

      if (uploadErr) {
        console.error('[Upload] Supabase error:', uploadErr)
        console.error('[Upload] Error message:', uploadErr.message)
        console.error('[Upload] Error details:', JSON.stringify(uploadErr))

        // Specific error messages
        if (uploadErr.message?.includes('Bucket not found')) {
          throw new Error('Storage bucket "pipump" not found. Please create it in Supabase Dashboard → Storage.')
        }
        if (uploadErr.message?.includes('not allowed') || uploadErr.statusCode === '403') {
          throw new Error('Storage permission denied. Run the storage_fix.sql in Supabase SQL Editor.')
        }
        if (uploadErr.message?.includes('already exists')) {
          // File exists — just get its URL
          const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
          setUploadedUrl(data.publicUrl)
          return data.publicUrl
        }

        throw uploadErr
      }

      console.log('[Upload] Upload success:', uploadData)

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path)

      console.log('[Upload] Public URL:', urlData.publicUrl)
      setUploadedUrl(urlData.publicUrl)
      return urlData.publicUrl

    } catch (err) {
      const msg = err.message || 'Upload failed'
      console.error('[Upload] Final error:', msg)
      setError(msg.length > 80 ? 'Upload failed. Check console for details.' : msg)
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
