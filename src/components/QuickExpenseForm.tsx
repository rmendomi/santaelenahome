import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { MoneyInput } from './MoneyInput'
import { CategoryButtonGrid } from './CategoryButtonGrid'
import { ReceiptScanner } from './ReceiptScanner'
import { useCatalog } from '@/hooks/useCatalog'
import { useCategoryAutoSuggest } from '@/hooks/useCategoryAutoSuggest'
import { useToastContext } from '@/contexts/ToastContext'
import { createExpense, updateExpense } from '@/services/expensesService'
import { todayString } from '@/utils/formatters'
import type { ExpenseWithRelations, QuickExpenseFormData } from '@/types/database'

interface QuickExpenseFormProps {
  onClose: () => void
  onSaved: () => void
  editing?: ExpenseWithRelations | null
}

export function QuickExpenseForm({ onClose, onSaved, editing }: QuickExpenseFormProps) {
  const { categories, paymentMethods, responsibles, defaultResponsibleId, defaultPaymentMethodId, recordLastUsed } = useCatalog()
  const { showSuccess, showError } = useToastContext()

  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '')
  const [detail, setDetail] = useState(editing?.detail ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(editing?.payment_method_id ?? defaultPaymentMethodId)
  const [responsibleId, setResponsibleId] = useState(editing?.responsible_id ?? defaultResponsibleId)
  const [expenseDate, setExpenseDate] = useState(editing?.expense_date ?? todayString())
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [addAnother, setAddAnother] = useState(false)

  const categoryNames = categories.map((c) => c.name)
  const { suggestedCategory } = useCategoryAutoSuggest(detail, categoryNames)

  // Sync defaults cuando cargan
  useEffect(() => {
    if (!editing && defaultResponsibleId) setResponsibleId(defaultResponsibleId)
    if (!editing && defaultPaymentMethodId) setPaymentMethodId(defaultPaymentMethodId)
  }, [defaultResponsibleId, defaultPaymentMethodId, editing])

  function resetForm() {
    setAmount(0)
    setCategoryId('')
    setDetail('')
    setReceiptFile(null)
  }

  async function handleSubmit(andAnother: boolean) {
    if (amount <= 0) { showError('Ingresa un monto válido'); return }
    if (!categoryId) { showError('Selecciona una categoría'); return }

    const formData: QuickExpenseFormData = {
      amount,
      category_id: categoryId,
      detail,
      payment_method_id: paymentMethodId,
      responsible_id: responsibleId,
      expense_date: expenseDate,
      receipt_file: receiptFile,
    }

    try {
      setSaving(true)
      setAddAnother(andAnother)

      if (editing) {
        await updateExpense(editing.id, formData)
        showSuccess('Gasto actualizado')
      } else {
        await createExpense(formData)
        showSuccess('Gasto guardado')
        recordLastUsed(responsibleId, paymentMethodId)
      }

      onSaved()

      if (andAnother) {
        resetForm()
      } else {
        onClose()
      }
    } catch {
      showError('Error al guardar el gasto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-warm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900">
          {editing ? 'Editar gasto' : 'Nuevo gasto'}
        </h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        <MoneyInput value={amount} onChange={setAmount} autoFocus />

        <CategoryButtonGrid
          categories={categories}
          selected={categoryId}
          onSelect={setCategoryId}
          suggested={suggestedCategory}
        />

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Detalle (opcional)</label>
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Ej: pan de molde, escoba..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-base bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Medio de pago</label>
          <div className="flex gap-2 flex-wrap">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethodId(pm.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                  paymentMethodId === pm.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {pm.icon} {pm.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Responsable</label>
          <div className="flex gap-2 flex-wrap">
            {responsibles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setResponsibleId(r.id)}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                  responsibleId === r.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-base bg-white"
          />
        </div>

        <ReceiptScanner
          file={receiptFile}
          onFileChange={setReceiptFile}
          onAnalysis={(data) => {
            if (data.total) setAmount(data.total)
            if (data.items?.[0]?.suggestedCategory) {
              const match = categories.find((c) => c.name === data.items![0].suggestedCategory)
              if (match) setCategoryId(match.id)
            }
            if (data.items?.[0]?.name) setDetail(data.items[0].name)
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-6 pt-3 space-y-2 border-t border-gray-100 bg-white">
        {!editing && (
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving && addAnother ? 'Guardando...' : 'Guardar y agregar otro'}
          </button>
        )}
        <button
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving && !addAnother ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-base"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
