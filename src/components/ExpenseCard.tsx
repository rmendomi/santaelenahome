import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, Image } from 'lucide-react'
import { formatCLP, formatDateShort } from '@/utils/formatters'
import { ConfirmDialog } from './ConfirmDialog'
import { deleteExpense } from '@/services/expensesService'
import { useToastContext } from '@/contexts/ToastContext'
import type { ExpenseWithRelations } from '@/types/database'

interface ExpenseCardProps {
  expense: ExpenseWithRelations
  onEdit: (expense: ExpenseWithRelations) => void
  onDeleted: () => void
  showDate?: boolean
}

export function ExpenseCard({ expense, onEdit, onDeleted, showDate = false }: ExpenseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showSuccess, showError } = useToastContext()

  async function handleDelete() {
    try {
      setDeleting(true)
      await deleteExpense(expense.id)
      showSuccess('Gasto eliminado')
      onDeleted()
    } catch {
      showError('Error al eliminar el gasto')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const hasItems = expense.expense_items && expense.expense_items.length > 0

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Main row */}
        <div className="flex items-center gap-3 p-4">
          {/* Category icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ backgroundColor: expense.category?.color ? `${expense.category.color}22` : '#f3f4f6' }}
          >
            {expense.category?.icon ?? '📦'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">
                  {expense.vendor ?? expense.detail ?? expense.category?.name ?? 'Gasto'}
                </p>
                {expense.vendor && expense.detail && (
                  <p className="text-xs text-gray-400 mt-0.5">{expense.detail}</p>
                )}
              </div>
              <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                {formatCLP(expense.amount)}
              </span>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {expense.payment_method && (
                <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {expense.payment_method.icon} {expense.payment_method.name}
                </span>
              )}
              {expense.responsible && (
                <span className="text-[11px] px-2 py-0.5 bg-primary-50 text-primary rounded-full">
                  {expense.responsible.name}
                </span>
              )}
              {showDate && (
                <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                  {formatDateShort(expense.expense_date)}
                </span>
              )}
              {expense.kind === 'grouped' && (
                <span className="text-[11px] px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full">
                  Compra agrupada
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={() => onEdit(expense)}
              className="p-1.5 text-gray-400 hover:text-primary rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-gray-400 hover:text-danger rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {(hasItems || expense.receipt_url) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 text-gray-400 rounded-lg"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded: ítems y boleta */}
        {expanded && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
            {hasItems && (
              <div className="space-y-1">
                {expense.expense_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name}</span>
                    <span className="font-medium">{formatCLP(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {expense.receipt_url && (
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary"
              >
                <Image className="w-4 h-4" />
                Ver boleta
              </a>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar gasto?"
        message="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
