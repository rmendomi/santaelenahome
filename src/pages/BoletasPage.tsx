import { useRef, useState } from 'react'
import {
  Camera,
  Images,
  ScanLine,
  Check,
  Trash2,
  RefreshCw,
  ReceiptText,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
} from 'lucide-react'
import { useReceiptUploads } from '@/hooks/useReceiptUploads'
import { useCatalog } from '@/hooks/useCatalog'
import { ReceiptReviewModal } from '@/components/ReceiptReviewModal'
import { getReceiptPublicUrl, retryReceiptAnalysis } from '@/services/receiptUploadService'
import { useToastContext } from '@/contexts/ToastContext'
import { formatDateShort } from '@/utils/formatters'
import type { ReceiptUpload } from '@/types/database'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  uploaded:  { label: 'Sin analizar',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  analyzing: { label: 'Analizando...',  color: 'text-blue-700',   bg: 'bg-blue-100'  },
  review:    { label: 'Lista para revisar', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  saved:     { label: 'Guardada',       color: 'text-gray-500',   bg: 'bg-gray-100'  },
  failed:    { label: 'Error al analizar', color: 'text-red-700',  bg: 'bg-red-100'   },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL['uploaded']
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  )
}

function ReceiptCard({
  receipt,
  onReview,
  onDelete,
  onRetry,
  isDeleting,
  analyzingId,
}: {
  receipt: ReceiptUpload
  onReview: (r: ReceiptUpload) => void
  onDelete: (r: ReceiptUpload) => void
  onRetry: (r: ReceiptUpload) => void
  isDeleting: boolean
  analyzingId: string | null
}) {
  const photoUrl = getReceiptPublicUrl(receipt.storage_path)
  const isAnalyzing = receipt.status === 'analyzing' || analyzingId === receipt.id
  const isSaved = receipt.status === 'saved'

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm ${
      isSaved ? 'border-gray-200 opacity-75' : 'border-gray-200'
    }`}>
      <div className="flex gap-3 p-3">
        {/* Miniatura */}
        <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          <img
            src={photoUrl}
            alt="Boleta"
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
              const parent = el.parentElement
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>'
              }
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-base font-semibold text-gray-900 truncate">
              {receipt.original_filename ?? 'Boleta'}
            </p>
            {receipt.status !== 'saved' && (
              <button
                onClick={() => onDelete(receipt)}
                disabled={isDeleting || isAnalyzing}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <StatusBadge status={receipt.status} />

          {/* Datos detectados */}
          {receipt.analysis_result?.total && (
            <p className="text-lg font-bold text-primary mt-1">
              $ {receipt.analysis_result.total.toLocaleString('es-CL')}
            </p>
          )}
          {receipt.analysis_result?.vendor && (
            <p className="text-sm text-gray-600 truncate">{receipt.analysis_result.vendor}</p>
          )}
          {receipt.analysis_result?.date && (
            <p className="text-sm text-gray-500">
              📅 {formatDateShort(receipt.analysis_result.date)}
            </p>
          )}

          {/* Error */}
          {receipt.status === 'failed' && receipt.error_message && (
            <p className="text-sm text-red-600 mt-1 line-clamp-2">{receipt.error_message}</p>
          )}

          {/* Fecha */}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(receipt.created_at).toLocaleDateString('es-CL', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {!isSaved && (
        <div className="border-t border-gray-100 px-3 py-2.5 flex gap-2">
          {receipt.status === 'review' && (
            <button
              onClick={() => onReview(receipt)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-base"
            >
              <Edit3 className="w-5 h-5" />
              Revisar
            </button>
          )}
          {receipt.status === 'failed' && (
            <button
              onClick={() => onRetry(receipt)}
              disabled={isAnalyzing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-bold text-base disabled:opacity-60"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar análisis
            </button>
          )}
          {receipt.status === 'analyzing' && (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold text-base">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Analizando con IA...
            </div>
          )}
          {receipt.status === 'uploaded' && (
            <p className="flex-1 text-center py-3 text-sm text-gray-500">
              Esperando análisis
            </p>
          )}
        </div>
      )}

      {isSaved && (
        <div className="border-t border-gray-100 px-3 py-2.5 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <p className="text-sm text-emerald-700 font-medium">Gasto registrado correctamente</p>
        </div>
      )}
    </div>
  )
}

export function BoletasPage() {
  const {
    receipts, loading, uploading, analyzing, analyzingId, savingAll, bulkProgress,
    pendingCount, reviewCount, savedCount,
    uploadAndAnalyzeAll, saveAll, analyzeAll, analyzeOne, deleteReceipt, load,
  } = useReceiptUploads()
  const { categories, defaultResponsibleId, defaultPaymentMethodId } = useCatalog()
  const { showSuccess, showError } = useToastContext()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reviewingReceipt, setReviewingReceipt] = useState<ReceiptUpload | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  const pendingReceipts  = receipts.filter(r => r.status === 'uploaded' || r.status === 'analyzing' || r.status === 'failed')
  const reviewReceipts   = receipts.filter(r => r.status === 'review')
  const savedReceipts    = receipts.filter(r => r.status === 'saved')

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''
    try {
      await uploadAndAnalyzeAll(files)
      showSuccess(`${files.length} boleta${files.length > 1 ? 's' : ''} procesada${files.length > 1 ? 's' : ''} correctamente`)
    } catch {
      showError('Error al procesar las fotos. Intente de nuevo.')
    }
  }

  async function handleDelete(receipt: ReceiptUpload) {
    setDeletingId(receipt.id)
    try {
      await deleteReceipt(receipt.id, receipt.storage_path)
      showSuccess('Boleta eliminada')
    } catch {
      showError('No se pudo eliminar. Intente de nuevo.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRetry(receipt: ReceiptUpload) {
    try {
      await retryReceiptAnalysis(receipt.id)
      await analyzeOne(receipt)
    } catch {
      showError('No se pudo reintentar el análisis.')
    }
  }

  async function handleSaveAll() {
    try {
      const { saved, skipped } = await saveAll({
        defaultResponsibleId,
        defaultPaymentMethodId,
        categories,
      })
      if (skipped > 0) {
        showSuccess(`${saved} guardada${saved !== 1 ? 's' : ''}. ${skipped} posible${skipped !== 1 ? 's' : ''} duplicado${skipped !== 1 ? 's' : ''} — revíselo${skipped !== 1 ? 's' : ''} manualmente.`)
      } else {
        showSuccess(`${saved} gasto${saved !== 1 ? 's' : ''} guardado${saved !== 1 ? 's' : ''} correctamente`)
      }
    } catch {
      showError('Error al guardar. Intente de nuevo.')
    }
  }

  function handleSaved() {
    setReviewingReceipt(null)
    load()
  }

  function handleDeleted() {
    setReviewingReceipt(null)
    load()
  }

  const totalReceipts = receipts.length

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-4 pt-safe-top pb-6">
        <div className="pt-4">
          <div className="flex items-center gap-3">
            <ReceiptText className="w-7 h-7 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Mis Boletas</h1>
              <p className="text-primary-200 text-sm mt-0.5">
                {totalReceipts === 0
                  ? 'Sin boletas aún'
                  : `${totalReceipts} boleta${totalReceipts !== 1 ? 's' : ''} en total`}
              </p>
            </div>
          </div>

          {/* Contadores */}
          {totalReceipts > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
                <p className="text-xs text-primary-200 mt-0.5">Por analizar</p>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{reviewCount}</p>
                <p className="text-xs text-primary-200 mt-0.5">Por revisar</p>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{savedCount}</p>
                <p className="text-xs text-primary-200 mt-0.5">Guardadas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 pb-32">
        {/* Botón SUBIR FOTOS - principal */}
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || analyzing}
            className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl bg-white border-3 border-dashed border-primary text-primary font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-60"
            style={{ borderWidth: '3px', borderStyle: 'dashed' }}
          >
            {bulkProgress ? (
              <>
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                {bulkProgress.phase === 'uploading' ? (
                  <>
                    <span className="text-xl">
                      Subiendo {bulkProgress.current} de {bulkProgress.total} fotos...
                    </span>
                    <div className="w-full max-w-xs bg-primary-100 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xl">
                      Analizando {bulkProgress.current} de {bulkProgress.total} boletas...
                    </span>
                    <div className="w-full max-w-xs bg-amber-100 rounded-full h-2.5">
                      <div
                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                  <Camera className="w-9 h-9 text-primary" />
                </div>
                <span className="text-xl">Subir Fotos de Boletas</span>
                <span className="text-sm font-normal text-primary-600">
                  Seleccione varias fotos a la vez — se analizan solas
                </span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>

        {/* Botón ANALIZAR - aparece cuando hay boletas pendientes */}
        {pendingCount > 0 && (
          <button
            onClick={analyzeAll}
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-amber-500 text-white font-bold text-xl shadow-md active:scale-95 transition-transform disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                Analizando boletas con IA...
              </>
            ) : (
              <>
                <ScanLine className="w-7 h-7" />
                Analizar {pendingCount} boleta{pendingCount !== 1 ? 's' : ''} con IA
              </>
            )}
          </button>
        )}

        {/* Estado vacío */}
        {!loading && totalReceipts === 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center">
            <Images className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay boletas todavía</h3>
            <p className="text-base text-gray-500">
              Toca el botón de arriba para subir fotos de sus boletas.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Boletas para revisar - PRIORIDAD MÁXIMA */}
        {reviewReceipts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  Listas para revisar ({reviewReceipts.length})
                </h2>
              </div>
            </div>

            {/* Botón Guardar todo */}
            <button
              onClick={handleSaveAll}
              disabled={savingAll || analyzing}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-md active:scale-95 transition-transform disabled:opacity-60 mb-3"
            >
              {savingAll && bulkProgress?.phase === 'saving' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando {bulkProgress.current} de {bulkProgress.total}...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  Guardar todo ({reviewReceipts.length})
                </>
              )}
            </button>

            <div className="space-y-3">
              {reviewReceipts.map(r => (
                <ReceiptCard
                  key={r.id}
                  receipt={r}
                  onReview={setReviewingReceipt}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  isDeleting={deletingId === r.id}
                  analyzingId={analyzingId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Boletas pendientes de análisis */}
        {pendingReceipts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Por analizar ({pendingReceipts.length})
              </h2>
            </div>
            <div className="space-y-3">
              {pendingReceipts.map(r => (
                <ReceiptCard
                  key={r.id}
                  receipt={r}
                  onReview={setReviewingReceipt}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  isDeleting={deletingId === r.id}
                  analyzingId={analyzingId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Boletas guardadas - colapsadas */}
        {savedReceipts.length > 0 && (
          <div>
            <button
              onClick={() => setShowSaved(v => !v)}
              className="w-full flex items-center justify-between py-3 px-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-lg font-bold text-gray-600">
                  Ya guardadas ({savedReceipts.length})
                </span>
              </div>
              {showSaved ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showSaved && (
              <div className="space-y-3">
                {savedReceipts.map(r => (
                  <ReceiptCard
                    key={r.id}
                    receipt={r}
                    onReview={setReviewingReceipt}
                    onDelete={handleDelete}
                    onRetry={handleRetry}
                    isDeleting={deletingId === r.id}
                    analyzingId={analyzingId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de revisión */}
      {reviewingReceipt && (
        <ReceiptReviewModal
          receipt={reviewingReceipt}
          onClose={() => setReviewingReceipt(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
