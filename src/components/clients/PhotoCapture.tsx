import { useState, useRef } from 'react'

interface Props {
  currentUrl?: string | null
  onCapture: (file: File) => void
}

export function PhotoCapture({ currentUrl, onCapture }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    onCapture(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-navy-mid mb-1 uppercase tracking-wide">
        Foto de fachada
      </label>

      {preview && (
        <img
          src={preview}
          alt="Fachada"
          className="w-full h-40 object-cover rounded-xl mb-2"
        />
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-sm text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
        </svg>
        {preview ? 'Cambiar foto' : 'Tomar foto o seleccionar'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
