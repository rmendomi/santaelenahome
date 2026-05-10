import { useState, useEffect } from 'react'
import { X, CheckCircle, Trash2, AlertCircle, ReceiptText } from 'lucide-react'
import { useCatalog } from '@/hooks/useCatalog'
import { useToastContext } from '@/contexts/ToastContext'
import { saveReceiptAsExpense, deleteReceiptUpload, getReceiptPublicUrl } from '@/services/receiptUploadService'
import { todayString } from '@/utils/formatters'
import type { ReceiptUpload, ReceiptExpenseFormData } from '@/types/database'

interface ReceiptReviewModalProps {
  receipt: ReceiptUpload
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}

function formatAmount(v: number) {
  return '$ ' + v.toLocaleString('es-CL')
}

export function ReceiptReviewModal({ receipt, onClose, onSaved, onDeleted }: ReceiptReviewModalProps) {
  const { categories, paymentMethods, responsibles, defaultResponsibleId, defaultPaymentMethodId, recordLastUsed } = useCatalog()
  const { showSuccess, showError } = useToastContext()

  const analysis = receipt.analysis_result

  const [amount, setAmount] = useState(analysis?.total ?? 0)
  const [vendor, setVendor] = useState(analysis?.vendor ?? '')
  const [detail, setDetail] = useState(
    analysis?.items?.map(i => i.name).join(', ') ?? ''
  )
  const [expenseDate, setExpenseDate] = useState(analysis?.date ?? todayString())
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [responsibleId, setResponsibleId] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Auto-select defaults and suggested category
  useEffect(() => {
    if (defaultPaymentMethodId) setPaymentMethodId(defaultPaymentMethodId)
    if (defaultResponsibleId) setResponsibleId(defaultResponsibleId)
  }, [defaultPaymentMethodId, defaultResponsibleId])

  useEffect(() => {
    if (!analysis?.items?.length || categories.length === 0) return
    const suggested = analysis.items[0]?.suggestedCategory
    if (!suggested) return
    const match = categories.find(c =>
      c.name.toLowerCase() === suggested.toLowerCase()
    )
    if (match) setCategoryId(match.id)
  }, [analysis, categories])

  // Ensure date is valid, fall back to today
  useEffect(() => {
    if (!expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
      setExpenseDate(todayString())
    }
  }, [expenseDate])

  async function handleSave() {
    if (!amount || amount <= 0) {
      showError('Ingresa un monto válido')
      return
    }
    setSaving(true)
    try {
      const formData: ReceiptExpenseFormData = {
        amount: Math.round(amount),
        category_id: categoryId || null,
        detail,
        vendor,
        payment_method_id: paymentMethodId || null,
        responsible_id: responsibleId || null,
        expense_date: expenseDate || todayString(),
      }
      await saveReceiptAsExpense(receipt.id, receipt.storage_path, formData)
      recordLastUsed(responsibleId, paymentMethodId)
      showSuccess('¡Gasto guardado correctamente!')
      onSaved()
    } catch {
      showError('No se pudo guardar. Intente de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteReceiptUpload(receipt.id, receipt.storage_path)
      showSuccess('Boleta eliminada')
      onDeleted()
    } catch {
      showError('No se pudo eliminar. Intente de nuevo.')
      setDeleting(false)
    }
  }

  const photoUrl = getReceiptPublicUrl(receipt.storage_path)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <ReceiptText className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Revisar Boleta</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Foto de la boleta */}
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <img
              src={photoUrl}
              alt="Foto de boleta"
              className="w-full max-h-56 object-contain bg-gray-100"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>

          {/* Datos detectados - banner informativo */}
          {analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">Datos detectados por la IA</p>
              <p className="text-sm text-blue-700">Revisa y corrige si es necesario antes de guardar.</p>
            </div>
          )}

          {/* Monto */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-base font-bold text-gray-800 mb-2">
              Monto Total *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">$</span>
              <input
                type="number"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                inputMode="numeric"
              />
            </div>
            {amount > 0 && (
              <p className="text-lg text-primary font-semibold mt-2">{formatAmount(amount)}</p>
            )}
          </div>

          {/* Comercio y Detalle */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-4">
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">Comercio / Proveedor</label>
              <input
                type="text"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                placeholder="Ej: Supermercado Líder"
                className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">Detalle</label>
              <input
                type="text"
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Descripción del gasto"
                className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">Fecha del Gasto</label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-base font-bold text-gray-800 mb-3">Categoría</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-base font-medium transition-all ${
                    categoryId === cat.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-300'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Medio de pago y Responsable */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-4">
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">Medio de Pago</label>
              <select
                value={paymentMethodId}
                onChange={e => setPaymentMethodId(e.target.value)}
                className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Sin especificar</option>
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">Responsable</label>
              <select
                value={responsibleId}
                onChange={e => setResponsibleId(e.target.value)}
                className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Sin especificar</option>
                {responsibles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items detectados */}
          {analysis?.items && analysis.items.length > 1 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <p className="text-base font-bold text-gray-800 mb-3">
                Ítems detectados ({analysis.items.length})
              </p>
              <div className="space-y-2">
                {analysis.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-base text-gray-700 flex-1">{item.name}</span>
                    <span className="text-base font-semibold text-gray-900 ml-2">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Espaciado para los botones fijos */}
          <div className="h-4" />
        </div>
      </div>

      {/* Botones fijos en el fondo */}
      <div className="bg-white border-t border-gray-200 p-4 space-y-3 pb-safe-bottom">
        <button
          onClick={handleSave}
          disabled={saving || deleting}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-primary text-white font-bold text-xl shadow-md active:scale-95 transition-transform disabled:opacity-60"
        >
          <CheckCircle className="w-7 h-7" />
          {saving ? 'Guardando gasto...' : 'Guardar Gasto'}
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving || deleting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-300 text-red-600 font-semibold text-lg active:scale-95 transition-transform disabled:opacity-60"
          >
            <Trash2 className="w-5 h-5" />
            Eliminar boleta
          </button>
        ) : (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-base font-semibold text-red-800">¿Seguro que quiere eliminar esta boleta?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-base disabled:opacity-60"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
