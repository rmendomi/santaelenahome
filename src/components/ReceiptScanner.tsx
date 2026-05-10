import { useState } from 'react'
import { Camera, Sparkles, X, Image } from 'lucide-react'

interface ReceiptAnalysis {
  vendor?: string | null
  date?: string | null
  total?: number | null
  items?: { name: string; amount: number; suggestedCategory?: string }[]
}

interface ReceiptScannerProps {
  file: File | null
  onFileChange: (file: File | null) => void
  onAnalysis?: (data: ReceiptAnalysis) => void
}

export function ReceiptScanner({ file, onFileChange, onAnalysis }: ReceiptScannerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    onFileChange(selected)
    if (selected) {
      const url = URL.createObjectURL(selected)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  function handleRemove() {
    onFileChange(null)
    setPreview(null)
  }

  async function handleAnalyze() {
    if (!file || !onAnalysis) return
    try {
      setAnalyzing(true)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const res = await fetch('/api/analyze-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        })
        if (!res.ok) throw new Error('Error al analizar')
        const data = await res.json() as ReceiptAnalysis
        onAnalysis(data)
        setAnalyzing(false)
      }
    } catch {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-600">Foto de boleta (opcional)</label>

      {!file ? (
        <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary transition-colors">
          <Camera className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Toca para agregar foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            {preview ? (
              <img src={preview} alt="Boleta" className="w-full h-32 object-cover" />
            ) : (
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {onAnalysis && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-50 text-primary font-medium text-sm border border-primary-200 active:scale-95 transition-transform disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {analyzing ? 'Analizando boleta...' : 'Analizar con IA'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
