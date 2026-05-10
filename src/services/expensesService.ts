import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import type {
  Expense,
  ExpenseWithRelations,
  ExpenseFilters,
  QuickExpenseFormData,
  GroupedExpenseFormData,
} from '@/types/database'

const EXPENSE_SELECT = `
  *,
  category:categories(*),
  payment_method:payment_methods(*),
  responsible:responsibles(*),
  expense_items(*, category:categories(*))
`

export async function getExpensesToday(): Promise<ExpenseWithRelations[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('expense_date', today)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ExpenseWithRelations[]
}

export async function getExpensesByMonth(
  year: number,
  month: number,
  filters?: ExpenseFilters
): Promise<ExpenseWithRelations[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  let query = supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .gte('expense_date', from)
    .lte('expense_date', to)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.responsible_id) query = query.eq('responsible_id', filters.responsible_id)
  if (filters?.payment_method_id) query = query.eq('payment_method_id', filters.payment_method_id)
  if (filters?.search) {
    query = query.or(
      `detail.ilike.%${filters.search}%,vendor.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ExpenseWithRelations[]
}

export async function getExpenseById(id: string): Promise<ExpenseWithRelations | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ExpenseWithRelations | null
}

export async function createExpense(formData: QuickExpenseFormData): Promise<Expense> {
  const user = getSession()

  let receipt_url: string | null = null
  if (formData.receipt_file) {
    receipt_url = await uploadReceipt(formData.receipt_file)
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      expense_date: formData.expense_date,
      amount: formData.amount,
      category_id: formData.category_id || null,
      payment_method_id: formData.payment_method_id || null,
      responsible_id: formData.responsible_id || null,
      detail: formData.detail || null,
      receipt_url,
      kind: 'simple',
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function createGroupedExpense(
  formData: GroupedExpenseFormData
): Promise<Expense> {
  const user = getSession()

  const total = formData.items.reduce((sum, item) => sum + item.amount, 0)

  let receipt_url: string | null = null
  if (formData.receipt_file) {
    receipt_url = await uploadReceipt(formData.receipt_file)
  }

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      expense_date: formData.expense_date,
      amount: total,
      payment_method_id: formData.payment_method_id || null,
      responsible_id: formData.responsible_id || null,
      vendor: formData.vendor || null,
      receipt_url,
      kind: 'grouped',
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (expenseError) throw expenseError

  const items = formData.items.map((item) => ({
    expense_id: expense.id,
    name: item.name,
    amount: item.amount,
    category_id: item.category_id || null,
  }))

  const { error: itemsError } = await supabase.from('expense_items').insert(items)
  if (itemsError) throw itemsError

  return expense as Expense
}

export async function updateExpense(
  id: string,
  updates: Partial<QuickExpenseFormData>
): Promise<Expense> {
  let receipt_url: string | undefined
  if (updates.receipt_file) {
    receipt_url = await uploadReceipt(updates.receipt_file)
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      expense_date: updates.expense_date,
      amount: updates.amount,
      category_id: updates.category_id || null,
      payment_method_id: updates.payment_method_id || null,
      responsible_id: updates.responsible_id || null,
      detail: updates.detail || null,
      ...(receipt_url !== undefined && { receipt_url }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function uploadReceipt(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file, { upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('receipts').getPublicUrl(fileName)
  return data.publicUrl
}

export async function getMonthlySummary(year: number, month: number) {
  const expenses = await getExpensesByMonth(year, month)

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const byCategory: Record<string, { name: string; amount: number; color: string }> = {}
  for (const e of expenses) {
    const key = e.category?.name ?? 'Sin categoría'
    if (!byCategory[key]) {
      byCategory[key] = { name: key, amount: 0, color: e.category?.color ?? '#9B9B9B' }
    }
    byCategory[key].amount += e.amount
  }

  const byResponsible: Record<string, { name: string; amount: number }> = {}
  for (const e of expenses) {
    const key = e.responsible?.name ?? 'Sin responsable'
    if (!byResponsible[key]) byResponsible[key] = { name: key, amount: 0 }
    byResponsible[key].amount += e.amount
  }

  const byPaymentMethod: Record<string, { name: string; amount: number }> = {}
  for (const e of expenses) {
    const key = e.payment_method?.name ?? 'Sin medio'
    if (!byPaymentMethod[key]) byPaymentMethod[key] = { name: key, amount: 0 }
    byPaymentMethod[key].amount += e.amount
  }

  return {
    total,
    count: expenses.length,
    byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
    byResponsible: Object.values(byResponsible).sort((a, b) => b.amount - a.amount),
    byPaymentMethod: Object.values(byPaymentMethod).sort((a, b) => b.amount - a.amount),
  }
}
