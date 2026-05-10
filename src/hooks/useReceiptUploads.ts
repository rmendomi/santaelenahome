import { useState, useEffect, useCallback } from 'react'
import type { ReceiptUpload, Category } from '@/types/database'
import {
  getReceiptUploads,
  uploadReceiptFiles,
  analyzeReceiptUpload,
  saveReceiptAsExpense,
  deleteReceiptUpload as deleteReceiptService,
} from '@/services/receiptUploadService'
import { checkDuplicateExpense } from '@/services/expensesService'
import { todayString } from '@/utils/formatters'

export interface UploadProgress {
  current: number
  total: number
  phase: 'uploading' | 'analyzing' | 'saving'
}

export function useReceiptUploads() {
  const [receipts, setReceipts] = useState<ReceiptUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<UploadProgress | null>(null)
  const [duplicateIds, setDuplicateIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    try {
      const data = await getReceiptUploads()
      setReceipts(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploading(true)
    try {
      await uploadReceiptFiles(files)
      await load()
    } finally {
      setUploading(false)
    }
  }, [load])

  // Sube Y analiza todas en secuencia, mostrando progreso
  const uploadAndAnalyzeAll = useCallback(async (files: File[]) => {
    setUploading(true)
    setBulkProgress({ current: 0, total: files.length, phase: 'uploading' })
    let uploaded: ReceiptUpload[] = []
    try {
      uploaded = await uploadReceiptFiles(files, (current, total) => {
        setBulkProgress({ current, total, phase: 'uploading' })
      })
      await load()
    } finally {
      setUploading(false)
    }

    if (uploaded.length === 0) {
      setBulkProgress(null)
      return
    }

    setAnalyzing(true)
    try {
      for (let i = 0; i < uploaded.length; i++) {
        const receipt = uploaded[i]
        setBulkProgress({ current: i + 1, total: uploaded.length, phase: 'analyzing' })
        setAnalyzingId(receipt.id)
        setReceipts(prev =>
          prev.map(r => r.id === receipt.id ? { ...r, status: 'analyzing' as const } : r)
        )
        await analyzeReceiptUpload(receipt.id, receipt.storage_path, receipt.mime_type)
        const updated = await getReceiptUploads()
        setReceipts(updated)
      }
    } finally {
      setAnalyzing(false)
      setAnalyzingId(null)
      setBulkProgress(null)
      await load()
    }
  }, [load])

  // Guarda todas las boletas en estado 'review' usando los defaults del catálogo.
  // Las que tienen posible duplicado se dejan en 'review' para revisión manual.
  const saveAll = useCallback(async (opts: {
    defaultResponsibleId: string
    defaultPaymentMethodId: string
    categories: Category[]
  }): Promise<{ saved: number; skipped: number }> => {
    const toSave = receipts.filter(r => r.status === 'review')
    if (toSave.length === 0) return { saved: 0, skipped: 0 }

    setSavingAll(true)
    setBulkProgress({ current: 0, total: toSave.length, phase: 'saving' })
    let saved = 0
    let skipped = 0
    const newDuplicateIds = new Set<string>()

    try {
      for (let i = 0; i < toSave.length; i++) {
        const receipt = toSave[i]
        setBulkProgress({ current: i + 1, total: toSave.length, phase: 'saving' })

        const analysis = receipt.analysis_result
        const amount = analysis?.total ?? 0
        if (amount <= 0) { skipped++; continue }

        const expenseDate = (analysis?.date && /^\d{4}-\d{2}-\d{2}$/.test(analysis.date))
          ? analysis.date
          : todayString()

        const isDuplicate = await checkDuplicateExpense(expenseDate, amount)
        if (isDuplicate) { skipped++; newDuplicateIds.add(receipt.id); continue }

        const suggested = analysis?.items?.[0]?.suggestedCategory
        const category = suggested
          ? opts.categories.find(c => c.name.toLowerCase() === suggested.toLowerCase())
          : null

        await saveReceiptAsExpense(receipt.id, receipt.storage_path, {
          amount: Math.round(amount),
          category_id: category?.id ?? null,
          detail: analysis?.items?.map(i => i.name).join(', ') ?? '',
          vendor: analysis?.vendor ?? '',
          payment_method_id: opts.defaultPaymentMethodId || null,
          responsible_id: opts.defaultResponsibleId || null,
          expense_date: expenseDate,
        })
        saved++
      }
    } finally {
      setSavingAll(false)
      setBulkProgress(null)
      setDuplicateIds(newDuplicateIds)
      await load()
    }

    return { saved, skipped }
  }, [receipts, load])

  const forceSaveOne = useCallback(async (
    receipt: ReceiptUpload,
    opts: { defaultResponsibleId: string; defaultPaymentMethodId: string; categories: Category[] }
  ): Promise<void> => {
    const analysis = receipt.analysis_result
    const amount = analysis?.total ?? 0
    if (amount <= 0) throw new Error('Monto inválido')

    const expenseDate = (analysis?.date && /^\d{4}-\d{2}-\d{2}$/.test(analysis.date))
      ? analysis.date
      : todayString()

    const suggested = analysis?.items?.[0]?.suggestedCategory
    const category = suggested
      ? opts.categories.find(c => c.name.toLowerCase() === suggested.toLowerCase())
      : null

    await saveReceiptAsExpense(receipt.id, receipt.storage_path, {
      amount: Math.round(amount),
      category_id: category?.id ?? null,
      detail: analysis?.items?.map(i => i.name).join(', ') ?? '',
      vendor: analysis?.vendor ?? '',
      payment_method_id: opts.defaultPaymentMethodId || null,
      responsible_id: opts.defaultResponsibleId || null,
      expense_date: expenseDate,
    })

    setDuplicateIds(prev => {
      const next = new Set(prev)
      next.delete(receipt.id)
      return next
    })
    await load()
  }, [load])

  const analyzeOne = useCallback(async (receipt: ReceiptUpload) => {
    setAnalyzingId(receipt.id)
    setReceipts(prev =>
      prev.map(r => r.id === receipt.id ? { ...r, status: 'analyzing' as const } : r)
    )
    try {
      await analyzeReceiptUpload(receipt.id, receipt.storage_path, receipt.mime_type)
    } finally {
      setAnalyzingId(null)
      await load()
    }
  }, [load])

  const analyzeAll = useCallback(async () => {
    const pending = receipts.filter(r => r.status === 'uploaded' || r.status === 'failed')
    if (pending.length === 0) return

    setAnalyzing(true)
    try {
      for (const receipt of pending) {
        setAnalyzingId(receipt.id)
        setReceipts(prev =>
          prev.map(r => r.id === receipt.id ? { ...r, status: 'analyzing' as const } : r)
        )
        await analyzeReceiptUpload(receipt.id, receipt.storage_path, receipt.mime_type)
        const updated = await getReceiptUploads()
        setReceipts(updated)
      }
    } finally {
      setAnalyzing(false)
      setAnalyzingId(null)
      await load()
    }
  }, [receipts, load])

  const deleteReceipt = useCallback(async (receiptId: string, storagePath: string) => {
    await deleteReceiptService(receiptId, storagePath)
    setReceipts(prev => prev.filter(r => r.id !== receiptId))
  }, [])

  const pendingCount = receipts.filter(r => r.status === 'uploaded' || r.status === 'failed').length
  const reviewCount = receipts.filter(r => r.status === 'review').length
  const savedCount = receipts.filter(r => r.status === 'saved').length
  const analyzingCount = receipts.filter(r => r.status === 'analyzing').length

  return {
    receipts,
    loading,
    uploading,
    analyzing,
    analyzingId,
    savingAll,
    bulkProgress,
    duplicateIds,
    pendingCount,
    reviewCount,
    savedCount,
    analyzingCount,
    load,
    uploadFiles,
    uploadAndAnalyzeAll,
    saveAll,
    forceSaveOne,
    analyzeOne,
    analyzeAll,
    deleteReceipt,
  }
}
