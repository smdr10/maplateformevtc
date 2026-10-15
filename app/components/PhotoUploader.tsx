'use client'

import { useState, useRef } from 'react'

interface UploadedImage {
  url: string
  publicId: string
  position: number
  preview?: string
}

interface PhotoUploaderProps {
  listingId: string
  onComplete: (images: UploadedImage[]) => void
}

export default function PhotoUploader({ listingId, onComplete }: PhotoUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(f => f.type.startsWith('image/'))

    if (validFiles.length === 0) {
      setError('Veuillez selectionner des images (JPG, PNG, WebP)')
      return
    }

    if (images.length + validFiles.length > 10) {
      setError('Maximum 10 photos par annonce')
      return
    }

    setUploading(true)
    setError('')

    try {
      const previews = validFiles.map(f => URL.createObjectURL(f))

      const formData = new FormData()
      validFiles.forEach(f => formData.append('files', f))

      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erreur upload')
        return
      }

      const newImages = data.images.map((img: UploadedImage, i: number) => ({
        ...img,
        position: images.length + img.position,
        preview: previews[i],
      }))

      setImages(prev => [...prev, ...newImages])
    } catch {
      setError('Erreur reseau, réessayez')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, position: i }))
    )
  }

  const moveImage = (from: number, to: number) => {
    const updated = [...images]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setImages(updated.map((img, i) => ({ ...img, position: i })))
  }

  const saveImages = async () => {
    if (images.length < 3) {
      setError('Minimum 3 photos requises')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/listings/${listingId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ images }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erreur sauvegarde')
        return
      }

      onComplete(images)
    } catch {
      setError('Erreur reseau, réessayez')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-[4px] p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-[#0B1F3A] hover:bg-[#FFF3CC]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-[#0B1F3A] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#0B1F3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Glissez vos photos ici ou cliquez</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP — max 10 photos — min 3 requises</p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[3px] text-sm text-red-600">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {images.length} photo(s)
              {images.length < 3 && <span className="text-[#0B1F3A] ml-1">(minimum 3 requises)</span>}
            </p>
            <p className="text-xs text-gray-400">La 1ere photo est la photo principale</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div key={img.publicId} className="relative group rounded-[3px] overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                <img
                  src={img.preview || img.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B1F3A] text-white font-medium">
                      Principale
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      className="w-7 h-7 rounded-full bg-white text-gray-700 text-xs font-bold hover:bg-gray-100 flex items-center justify-center"
                    >
                      ←
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 flex items-center justify-center"
                  >
                    ✕
                  </button>
                  {index < images.length - 1 && (
                    <button
                      onClick={() => moveImage(index, index + 1)}
                      className="w-7 h-7 rounded-full bg-white text-gray-700 text-xs font-bold hover:bg-gray-100 flex items-center justify-center"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveImages}
            disabled={saving || images.length < 3}
            className="w-full bg-[#0B1F3A] text-white py-2.5 rounded-[3px] text-sm font-medium hover:bg-[#142D52] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Sauvegarde...' : `Sauvegarder ${images.length} photo(s)`}
          </button>
        </div>
      )}

    </div>
  )
}