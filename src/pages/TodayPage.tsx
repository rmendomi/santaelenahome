import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Plus, ShoppingCart, LogOut, ScanLine, ChevronRight } from 'lucide-react'
import { useExpensesToday } from '@/hooks/useExpenses'
import { useReceiptUploads } from '@/hooks/useReceiptUploads'
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
  const { pendingCount, reviewCount } = useReceiptUploads()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState<Modal>(null)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const urgentCount = pendingCount + reviewCount

  function handleEdit(expense: ExpenseWithRelations) {
    setEditingExpense(expense)
    setModal('quick')
  }

  function handleModalClose() {
    setModal(null)
    setEditingExpense(null)
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-4 pt-safe-top pb-6">
        <div className="flex items-start justify-between pt-4">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Gastos Santa Elena</h1>
            <p className="text-primary-200 text-base mt-1 capitalize">{formatDate(todayString())}</p>
          </div>
          {!confirmLogout ? (
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-1.5 text-primary-200 text-sm px-3 py-2 rounded-xl border border-primary-300 mt-1"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          ) : (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmLogout(false)}
                className="text-primary-200 text-sm px-3 py-2 rounded-xl border border-primary-300"
              >
                Cancelar
              </button>
              <button
                onClick={signOut}
                className="text-white text-sm px-3 py-2 rounded-xl bg-red-500 font-semibold"
              >
                Confirmar salida
              </button>
            </div>
          )}
        </div>

        {/* Total del día - número muy grande */}
        <div className="bg-white/15 rounded-2xl p-5 mt-4">
          <p className="text-primary-100 text-base font-medium">Total gastado hoy</p>
          <p className="text-5xl font-bold text-white mt-1 leading-none">
            {formatCLP(todayTotal)}
          </p>
          <p className="text-primary-200 text-base mt-2">
            {todayCount === 0
              ? 'No hay gastos registrados aún'
              : `${todayCount} gasto${todayCount !== 1 ? 's' : ''} registrado${todayCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Alerta de boletas pendientes */}
        {urgentCount > 0 && (
          <button
            onClick={() => navigate('/boletas')}
            className="w-full flex items-center gap-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 active:scale-95 transition-transform text-left"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ScanLine className="w-7 h-7 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-amber-900">
                {reviewCount > 0
                  ? `${reviewCount} boleta${reviewCount !== 1 ? 's' : ''} lista${reviewCount !== 1 ? 's' : ''} para revisar`
                  : `${pendingCount} boleta${pendingCount !== 1 ? 's' : ''} por analizar`}
              </p>
              <p className="text-sm text-amber-700">Toca para ir a Mis Boletas</p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-500 flex-shrink-0" />
          </button>
        )}

        {/* ACCIÓN PRINCIPAL: Subir boletas */}
        <button
          onClick={() => navigate('/boletas')}
          className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl bg-primary text-white font-bold text-xl shadow-md active:scale-95 transition-transform"
        >
          <Camera className="w-8 h-8" />
          Subir Boletas con Foto
        </button>

        {/* Acciones secundarias */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setModal('quick')}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-primary text-primary font-semibold text-base bg-white active:scale-95 transition-transform"
          >
            <Plus className="w-7 h-7" />
            Gasto Manual
          </button>
          <button
            onClick={() => setModal('grouped')}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold text-base bg-white active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-7 h-7" />
            Compra Agrupada
          </button>
        </div>

        {/* Gastos de hoy */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Gastos de hoy</h2>
            {todayCount > 0 && (
              <span className="text-sm text-gray-500 font-medium">
                {todayCount} registro{todayCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <ExpenseList
              expenses={expenses}
              onEdit={handleEdit}
              onDeleted={refresh}
              emptyTitle="Sin gastos hoy"
              emptyDescription="Use los botones de arriba para registrar el primer gasto del día."
            />
          )}
        </div>
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
