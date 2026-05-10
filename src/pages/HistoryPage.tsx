import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { getExpensesByMonth } from '@/services/expensesService'
import { useCatalog } from '@/hooks/useCatalog'
import { ExpenseList } from '@/components/ExpenseList'
import { LoadingState } from '@/components/LoadingState'
import { QuickExpenseForm } from '@/components/QuickExpenseForm'
import { formatCLP, formatMonthYear, currentYearMonth } from '@/utils/formatters'
import type { ExpenseWithRelations, ExpenseFilters } from '@/types/database'

export function HistoryPage() {
  const { year: initYear, month: initMonth } = currentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [responsibleId, setResponsibleId] = useState('')
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null)
  const { categories, responsibles } = useCatalog()

  const load = useCallback(async () => {
    setLoading(true)
    const filters: ExpenseFilters = {}
    if (categoryId) filters.category_id = categoryId
    if (responsibleId) filters.responsible_id = responsibleId
    if (search) filters.search = search
    const data = await getExpensesByMonth(year, month, filters)
    setExpenses(data)
    setLoading(false)
  }, [year, month, categoryId, responsibleId, search])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const { year: cy, month: cm } = currentYearMonth()
    if (year === cy && month === cm) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const { year: cy, month: cm } = currentYearMonth()
  const isCurrentMonth = year === cy && month === cm

  function clearFilters() {
    setCategoryId('')
    setResponsibleId('')
    setSearch('')
  }

  const hasFilters = !!(categoryId || responsibleId || search)

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Historial</h1>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`p-2 rounded-xl border ${hasFilters ? 'border-primary text-primary bg-primary-50' : 'border-gray-200 text-gray-500'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <button onClick={prevMonth} className="p-1.5 text-gray-500 active:scale-90 transition-transform">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-800 capitalize">{formatMonthYear(year, month)}</span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 text-gray-500 active:scale-90 transition-transform disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {filtersOpen && (
          <div className="mt-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por detalle o proveedor..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:outline-none bg-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="">Todos</option>
                {responsibles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-danger">
                <X className="w-3.5 h-3.5" /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Total banner */}
      {!loading && (
        <div className="mx-4 mt-4 bg-primary rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-white/80 text-sm">{expenses.length} gastos</span>
          <span className="text-white font-bold text-xl">{formatCLP(total)}</span>
        </div>
      )}

      {/* List */}
      <div className="px-4 py-4">
        {loading ? (
          <LoadingState />
        ) : (
          <ExpenseList
            expenses={expenses}
            onEdit={setEditingExpense}
            onDeleted={load}
            showDate
            emptyTitle="Sin gastos en este período"
            emptyDescription="Ajusta los filtros o registra nuevos gastos."
          />
        )}
      </div>

      {editingExpense && (
        <QuickExpenseForm
          onClose={() => setEditingExpense(null)}
          onSaved={load}
          editing={editingExpense}
        />
      )}
    </div>
  )
}
