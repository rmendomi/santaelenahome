import { supabase } from '@/lib/supabase'
import type { Category, PaymentMethod, Responsible, AppDefaults } from '@/types/database'

// ── Categories ──────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function createCategory(cat: Pick<Category, 'name' | 'color' | 'icon'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(cat)
    .select()
    .single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('categories').update(updates).eq('id', id)
  if (error) throw error
}

export async function toggleCategory(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('categories').update({ active }).eq('id', id)
  if (error) throw error
}

// ── Payment Methods ──────────────────────────────────────────────
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function createPaymentMethod(pm: Pick<PaymentMethod, 'name' | 'icon'>): Promise<PaymentMethod> {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert(pm)
    .select()
    .single()
  if (error) throw error
  return data as PaymentMethod
}

export async function togglePaymentMethod(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('payment_methods').update({ active }).eq('id', id)
  if (error) throw error
}

// ── Responsibles ─────────────────────────────────────────────────
export async function getResponsibles(): Promise<Responsible[]> {
  const { data, error } = await supabase
    .from('responsibles')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getActiveResponsibles(): Promise<Responsible[]> {
  const { data, error } = await supabase
    .from('responsibles')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function createResponsible(name: string): Promise<Responsible> {
  const { data, error } = await supabase
    .from('responsibles')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data as Responsible
}

export async function toggleResponsible(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('responsibles').update({ active }).eq('id', id)
  if (error) throw error
}

// ── App Settings ─────────────────────────────────────────────────
export async function getDefaults(): Promise<AppDefaults> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'defaults')
    .single()
  return (data?.value ?? {}) as AppDefaults
}

export async function saveDefaults(defaults: AppDefaults): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'defaults', value: defaults as Record<string, unknown> })
  if (error) throw error
}
