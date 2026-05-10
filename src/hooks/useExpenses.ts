import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getExpensesToday } from '@/services/expensesService'
import type { ExpenseWithRelations } from '@/types/database'

export function useExpensesToday() {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getExpensesToday()
      setExpenses(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando gastos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    // Suscripción realtime: recargar cuando hay cambios
    const channel = supabase
      .channel('expenses-today')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => { load() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  const todayTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
  const todayCount = expenses.length

  return { expenses, loading, error, refresh: load, todayTotal, todayCount }
}
