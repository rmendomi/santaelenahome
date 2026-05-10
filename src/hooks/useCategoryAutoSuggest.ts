import { useState, useEffect, useRef } from 'react'

export function useCategoryAutoSuggest(
  detail: string,
  categoryNames: string[]
): { suggestedCategory: string | null; loading: boolean } {
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!detail || detail.length < 3 || categoryNames.length === 0) {
      setSuggestedCategory(null)
      return
    }

    timerRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/suggest-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detail, categories: categoryNames }),
        })
        if (!res.ok) return
        const { category } = await res.json() as { category: string }
        setSuggestedCategory(category ?? null)
      } catch {
        // silencioso — sugerencia es opcional
      } finally {
        setLoading(false)
      }
    }, 800)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [detail, categoryNames])

  return { suggestedCategory, loading }
}
