import { useState, useEffect, useCallback } from 'react'
import {
  getActiveCategories,
  getActivePaymentMethods,
  getActiveResponsibles,
} from '@/services/catalogService'
import type { Category, PaymentMethod, Responsible } from '@/types/database'

const LAST_USED_KEY = 'gastos_se_last_used'

interface LastUsed {
  responsible_id?: string
  payment_method_id?: string
}

function getLastUsed(): LastUsed {
  try {
    return JSON.parse(localStorage.getItem(LAST_USED_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveLastUsed(data: LastUsed) {
  localStorage.setItem(LAST_USED_KEY, JSON.stringify(data))
}

export function useCatalog() {
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [responsibles, setResponsibles] = useState<Responsible[]>([])
  const [loading, setLoading] = useState(true)
  const lastUsed = getLastUsed()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [cats, pms, resps] = await Promise.all([
        getActiveCategories(),
        getActivePaymentMethods(),
        getActiveResponsibles(),
      ])
      setCategories(cats)
      setPaymentMethods(pms)
      setResponsibles(resps)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const recordLastUsed = useCallback((responsible_id: string, payment_method_id: string) => {
    saveLastUsed({ responsible_id, payment_method_id })
  }, [])

  const defaultResponsibleId = lastUsed.responsible_id ?? responsibles[0]?.id ?? ''
  const defaultPaymentMethodId = lastUsed.payment_method_id ?? paymentMethods[0]?.id ?? ''

  return {
    categories,
    paymentMethods,
    responsibles,
    loading,
    refresh: load,
    defaultResponsibleId,
    defaultPaymentMethodId,
    recordLastUsed,
  }
}
