import { useState, useCallback } from 'react'

interface InsightData {
  month: string
  year: number
  categoryTotals: { name: string; amount: number }[]
  responsibleTotals: { name: string; amount: number }[]
  grandTotal: number
}

export function useMonthlyInsights() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async (data: InsightData) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/monthly-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al obtener análisis')
      const json = await res.json() as { insights: string[] }
      setInsights(json.insights ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  return { insights, loading, error, fetchInsights }
}
