import { useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { useExpensesToday } from '@/hooks/useExpenses'
import { ExpenseList } from '@/components/ExpenseList'
import { QuickExpenseForm } from '@/components/QuickExpenseForm'
import { GroupedExpenseForm } from '@/components/GroupedExpenseForm'
import { LoadingState } from '@/components/LoadingState'
import { formatCLP, formatDate, todayString } from '@/utils/formatters'
import { useAuth } from '@/contexts/AuthContext'
import type { ExpenseWithRelations } from '@/types/database'

type Modal = 'quick' | 'grouped' | null

export function TodayPage() {
  const { expenses, loading, todayTotal, todayCount, refresh } = useExpensesToday()
  const { signOut } = useAuth()
  const [modal, setModal] = useState<Modal>(null)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null)

  function handleEdit(expense: ExpenseWithRelations) {
    setEditingExpense(expense)
    setModal('quick')
  }

  function handleModalClose() {
    setModal(null)
    setEditingExpense(null)
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-primary px-4 pt-safe-top pb-6">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Gastos Santa Elena</h1>
            <p className="text-primary-200 text-sm mt-0.5 capitalize">{formatDate(todayString())}</p>
          </div>
          <button
            onClick={signOut}
            className="text-primary-200 text-xs px-3 py-1.5 rounded-lg border border-primary-300"
          >
            Salir
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white/10 rounded-2xl p-4 mt-4 text-white">
          <p className="text-primary-100 text-sm">Total hoy</p>
          <p className="text-4xl font-bold mt-1">{formatCLP(todayTotal)}</p>
          <p className="text-primary-200 text-sm mt-1">
            {todayCount === 0
              ? 'Sin gastos registrados'
              : `${todayCount} gasto${todayCount !== 1 ? 's' : ''} registrado${todayCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 space-y-2">
        <button
          onClick={() => setModal('quick')}
          className="w-full flex items-center justify-center gap-2 py-5 rounded-2xl bg-primary text-white font-bold text-lg shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
          + Gasto
        </button>
        <button
          onClick={() => setModal('grouped')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-primary text-primary font-semibold text-base active:scale-95 transition-transform bg-white"
        >
          <ShoppingCart className="w-5 h-5" />
          Compra con varios ítems
        </button>
      </div>

      {/* Today's expenses */}
      <div className="px-4 pb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Gastos de hoy</h2>
        {loading ? (
          <LoadingState />
        ) : (
          <ExpenseList
            expenses={expenses}
            onEdit={handleEdit}
            onDeleted={refresh}
            emptyTitle="Sin gastos hoy"
            emptyDescription="Toca '+ Gasto' para registrar tu primer gasto del día."
          />
        )}
      </div>

      {/* Modals */}
      {modal === 'quick' && (
        <QuickExpenseForm
          onClose={handleModalClose}
          onSaved={refresh}
          editing={editingExpense}
        />
      )}
      {modal === 'grouped' && (
        <GroupedExpenseForm
          onClose={handleModalClose}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
