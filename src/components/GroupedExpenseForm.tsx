import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { ReceiptScanner } from './ReceiptScanner'
import { CategoryButtonGrid } from './CategoryButtonGrid'
import { useCatalog } from '@/hooks/useCatalog'
import { useToastContext } from '@/contexts/ToastContext'
import { createGroupedExpense } from '@/services/expensesService'
import { formatCLP, todayString } from '@/utils/formatters'
import type { GroupedExpenseItem } from '@/types/database'

interface GroupedExpenseFormProps {
  onClose: () => void
  onSaved: () => void
}

interface ItemForm {
  id: string
  name: string
  amount: string
  category_id: string
}

function newItem(): ItemForm {
  return { id: Math.random().toString(36).slice(2), name: '', amount: '', category_id: '' }
}

export function GroupedExpenseForm({ onClose, onSaved }: GroupedExpenseFormProps) {
  const { categories, paymentMethods, responsibles, defaultPaymentMethodId, defaultResponsibleId, recordLastUsed } = useCatalog()
  const { showSuccess, showError } = useToastContext()

  const [vendor, setVendor] = useState('')
  const [expenseDate, setExpenseDate] = useState(todayString())
  const [paymentMethodId, setPaymentMethodId] = useState(defaultPaymentMethodId)
  const [responsibleId, setResponsibleId] = useState(defaultResponsibleId)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [items, setItems] = useState<ItemForm[]>([newItem()])
  const [saving, setSaving] = useState(false)
  const [selectingCategoryFor, setSelectingCategoryFor] = useState<string | null>(null)

  const total = items.reduce((sum, item) => sum + (parseInt(item.amount, 10) || 0), 0)

  function updateItem(id: string, field: keyof Omit<ItemForm, 'id'>, value: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  function removeItem(id: string) {
    if (items.length === 1) return
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleAnalysis(data: {
    vendor?: string | null
    date?: string | null
    total?: number | null
    items?: { name: string; amount: number; suggestedCategory?: string }[]
  }) {
    if (data.vendor) setVendor(data.vendor)
    if (data.date) setExpenseDate(data.date)
    if (data.items && data.items.length > 0) {
      const filled: ItemForm[] = data.items.map((item) => {
        const catMatch = categories.find((c) => c.name === item.suggestedCategory)
        return {
          id: Math.random().toString(36).slice(2),
          name: item.name,
          amount: String(item.amount),
          category_id: catMatch?.id ?? '',
        }
      })
      setItems(filled)
    }
  }

  async function handleSave() {
    if (items.some((i) => !i.name || !i.amount)) {
      showError('Completa nombre y monto de todos los ítems')
      return
    }
    if (total <= 0) { showError('El total debe ser mayor a 0'); return }

    const expenseItems: GroupedExpenseItem[] = items.map((i) => ({
      name: i.name,
      amount: parseInt(i.amount, 10),
      category_id: i.category_id,
    }))

    try {
      setSaving(true)
      await createGroupedExpense({
        expense_date: expenseDate,
        vendor,
        payment_method_id: paymentMethodId,
        responsible_id: responsibleId,
        receipt_file: receiptFile,
        items: expenseItems,
      })
      recordLastUsed(responsibleId, paymentMethodId)
      showSuccess('Compra guardada')
      onSaved()
      onClose()
    } catch {
      showError('Error al guardar la compra')
    } finally {
      setSaving(false)
    }
  }

  if (selectingCategoryFor) {
    const item = items.find((i) => i.id === selectingCategoryFor)
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-warm">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => setSelectingCategoryFor(null)} className="p-2 text-gray-400">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Categoría para: {item?.name || 'ítem'}</h2>
        </div>
        <div className="px-4 overflow-y-auto">
          <CategoryButtonGrid
            categories={categories}
            selected={item?.category_id ?? ''}
            onSelect={(id) => {
              updateItem(selectingCategoryFor, 'category_id', id)
              setSelectingCategoryFor(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-warm">
      {/* Header con total */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compra agrupada</h2>
          <p className="text-2xl font-bold text-primary mt-0.5">{formatCLP(total)}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* General info */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Lugar / Proveedor</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Ej: Jumbo, Líder, Ferretería..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-base bg-white"
            />
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
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Medio de pago</label>
            <div className="flex gap-2 flex-wrap">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethodId(pm.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl border-2 text-sm font-medium active:scale-95 transition-all ${
                    paymentMethodId === pm.id ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-700'
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
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium active:scale-95 transition-all ${
                    responsibleId === r.id ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <ReceiptScanner
            file={receiptFile}
            onFileChange={setReceiptFile}
            onAnalysis={handleAnalysis}
          />
        </div>

        {/* Items */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Ítems de la compra</h3>
          <div className="space-y-2">
            {items.map((item, idx) => {
              const cat = categories.find((c) => c.id === item.category_id)
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center font-medium">{idx + 1}</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Nombre del ítem"
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="p-1.5 text-gray-400 hover:text-danger disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, 'amount', e.target.value.replace(/\D/g, ''))}
                      placeholder="$ Monto"
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectingCategoryFor(item.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                    >
                      <span>{cat?.icon ?? '🏷️'}</span>
                      <span className="text-gray-500">{cat?.name ?? 'Cat.'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, newItem()])}
            className="w-full mt-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-primary font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Agregar ítem
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-4 pb-6 pt-3 space-y-2 border-t border-gray-100 bg-white">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? 'Guardando...' : `Guardar ${formatCLP(total)}`}
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
