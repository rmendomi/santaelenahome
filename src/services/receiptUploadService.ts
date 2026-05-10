import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import type { ReceiptUpload, ReceiptAnalysisResult, ReceiptExpenseFormData } from '@/types/database'

const BUCKET = 'receipts'
const INBOX_FOLDER = 'inbox'

export async function uploadReceiptFiles(files: File[]): Promise<ReceiptUpload[]> {
  const user = getSession()
  if (!user) throw new Error('No autenticado')

  const results: ReceiptUpload[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `${INBOX_FOLDER}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: false })

    if (uploadError) throw uploadError

    const { data, error: dbError } = await supabase
      .from('receipt_uploads')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        status: 'uploaded',
      })
      .select()
      .single()

    if (dbError) throw dbError
    results.push(data as ReceiptUpload)
  }

  return results
}

export function getReceiptPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function analyzeReceiptUpload(
  receiptId: string,
  storagePath: string,
  mimeType: string | null
): Promise<void> {
  await supabase
    .from('receipt_uploads')
    .update({ status: 'analyzing' })
    .eq('id', receiptId)

  try {
    const publicUrl = getReceiptPublicUrl(storagePath)
    const imageResponse = await fetch(publicUrl)
    if (!imageResponse.ok) throw new Error('No se pudo obtener la imagen')

    const blob = await imageResponse.blob()

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = () => reject(new Error('Error al leer imagen'))
      reader.readAsDataURL(blob)
    })

    const res = await fetch('/api/analyze-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: mimeType || 'image/jpeg',
      }),
    })

    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)

    const analysisResult: ReceiptAnalysisResult = await res.json()

    await supabase
      .from('receipt_uploads')
      .update({
        status: 'review',
        analysis_result: analysisResult,
        analyzed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', receiptId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    await supabase
      .from('receipt_uploads')
      .update({ status: 'failed', error_message: message })
      .eq('id', receiptId)
  }
}

export async function getReceiptUploads(): Promise<ReceiptUpload[]> {
  const { data, error } = await supabase
    .from('receipt_uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []) as ReceiptUpload[]
}

export async function saveReceiptAsExpense(
  receiptId: string,
  storagePath: string,
  formData: ReceiptExpenseFormData
): Promise<string> {
  const user = getSession()
  const receipt_url = getReceiptPublicUrl(storagePath)

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      expense_date: formData.expense_date,
      amount: formData.amount,
      category_id: formData.category_id || null,
      payment_method_id: formData.payment_method_id || null,
      responsible_id: formData.responsible_id || null,
      detail: formData.detail || null,
      vendor: formData.vendor || null,
      receipt_url,
      kind: 'simple',
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw error

  await supabase
    .from('receipt_uploads')
    .update({
      status: 'saved',
      expense_id: expense.id,
      saved_at: new Date().toISOString(),
    })
    .eq('id', receiptId)

  return expense.id
}

export async function deleteReceiptUpload(receiptId: string, storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath])
  const { error } = await supabase.from('receipt_uploads').delete().eq('id', receiptId)
  if (error) throw error
}

export async function retryReceiptAnalysis(receiptId: string): Promise<void> {
  await supabase
    .from('receipt_uploads')
    .update({ status: 'uploaded', error_message: null })
    .eq('id', receiptId)
}
