import { useState, useEffect, useCallback } from 'react'
import type { ReceiptUpload } from '@/types/database'
import {
  getReceiptUploads,
  uploadReceiptFiles,
  analyzeReceiptUpload,
  deleteReceiptUpload as deleteReceiptService,
} from '@/services/receiptUploadService'

export function useReceiptUploads() {
  const [receipts, setReceipts] = useState<ReceiptUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)

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
    pendingCount,
    reviewCount,
    savedCount,
    analyzingCount,
    load,
    uploadFiles,
    analyzeOne,
    analyzeAll,
    deleteReceipt,
  }
}
