import { useRef, useState } from 'react'

export default function ImageUploader({ preview, onFileSelect, error, uploading }) {
  const inputRef  = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (file) onFileSelect(file)
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0])
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono text-pi-muted">
        Token Image <span className="text-pi-red">*</span>
      </label>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative flex flex-col items-center justify-center
                    w-full h-40 rounded-2xl border-2 border-dashed cursor-pointer
                    transition-all duration-200 overflow-hidden
                    ${dragging
                      ? 'border-pi-lime bg-pi-lime/5 scale-[1.01]'
                      : preview
                        ? 'border-pi-border bg-pi-bg'
                        : 'border-pi-border bg-pi-card hover:border-pi-purple/50 hover:bg-pi-purple/5'
                    }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Token preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-pi-bg/70 opacity-0 hover:opacity-100
                            transition-opacity flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl mb-1">🖼️</p>
                <p className="text-xs text-pi-white font-mono">Change image</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center px-4 select-none">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-pi-border border-t-pi-lime
                                rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-pi-muted font-mono">Uploading...</p>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">🖼️</p>
                <p className="text-sm font-mono text-pi-muted">
                  {dragging ? 'Drop it!' : 'Tap to upload or drag & drop'}
                </p>
                <p className="text-[11px] text-pi-muted/60 mt-1">
                  JPG, PNG, GIF, WEBP · Max 2MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-pi-red font-mono">{error}</p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
