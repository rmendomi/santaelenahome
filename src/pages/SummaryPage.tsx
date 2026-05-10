import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getMonthlySummary } from '@/services/expensesService'
import { useMonthlyInsights } from '@/hooks/useMonthlyInsights'
import { LoadingState } from '@/components/LoadingState'
import { formatCLP, formatMonthYear, currentYearMonth } from '@/utils/formatters'

interface Summary {
  total: number
  count: number
  byCategory: { name: string; amount: number; color: string }[]
  byResponsible: { name: string; amount: number }[]
  byPaymentMethod: { name: string; amount: number }[]
}

const COLORS = ['#2D6A4F', '#74C69D', '#F4A261', '#E76F51', '#264653', '#E9C46A', '#4CC9F0', '#7B2D8B']

export function SummaryPage() {
  const { year: initYear, month: initMonth } = currentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const { insights, loading: insightsLoading, fetchInsights } = useMonthlyInsights()

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getMonthlySummary(year, month)
    setSummary(data as Summary)
    setLoading(false)
  }, [year, month])

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

  const { year: cy, month: cm } = currentYearMonth()
  const isCurrentMonth = year === cy && month === cm

  async function handleGetInsights() {
    if (!summary) return
    await fetchInsights({
      month: formatMonthYear(year, month),
      year,
      categoryTotals: summary.byCategory.map((c) => ({ name: c.name, amount: c.amount })),
      responsibleTotals: summary.byResponsible,
      grandTotal: summary.total,
    })
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Resumen mensual</h1>
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
      </div>

      {loading ? (
        <LoadingState />
      ) : summary ? (
        <div className="px-4 py-4 space-y-5">
          {/* Total */}
          <div className="bg-primary rounded-2xl p-5 text-white">
            <p className="text-primary-200 text-sm">Total del mes</p>
            <p className="text-4xl font-bold mt-1">{formatCLP(summary.total)}</p>
            <p className="text-primary-200 text-sm mt-1">{summary.count} gastos registrados</p>
          </div>

          {/* Bar chart: por categoría */}
          {summary.byCategory.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-3">Por categoría</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={summary.byCategory.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCLP(v as number)} />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                    {summary.byCategory.slice(0, 6).map((entry, idx) => (
                      <Cell key={entry.name} fill={entry.color || COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pie chart: por responsable */}
          {summary.byResponsible.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-3">Por responsable</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={summary.byResponsible}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {summary.byResponsible.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 5 */}
          {summary.byCategory.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-3">Top 5 categorías</h2>
              <div className="space-y-2">
                {summary.byCategory.slice(0, 5).map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-4">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                        <span className="text-sm font-bold text-gray-900">{formatCLP(cat.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(cat.amount / summary.byCategory[0].amount) * 100}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Análisis con IA</h2>
              <button
                onClick={handleGetInsights}
                disabled={insightsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 text-primary text-sm font-medium border border-primary-200 active:scale-95 transition-transform disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {insightsLoading ? 'Analizando...' : 'Analizar'}
              </button>
            </div>
            {insights.length > 0 ? (
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-2 p-3 bg-primary-50 rounded-xl">
                    <span>✨</span>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Toca "Analizar" para obtener observaciones personalizadas sobre los gastos del mes.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
