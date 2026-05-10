export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      payment_methods: { Row: PaymentMethod; Insert: Partial<PaymentMethod>; Update: Partial<PaymentMethod> }
      responsibles: { Row: Responsible; Insert: Partial<Responsible>; Update: Partial<Responsible> }
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> }
      expense_items: { Row: ExpenseItem; Insert: Partial<ExpenseItem>; Update: Partial<ExpenseItem> }
      app_settings: { Row: AppSetting; Insert: Partial<AppSetting>; Update: Partial<AppSetting> }
    }
  }
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface PaymentMethod {
  id: string
  name: string
  icon: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface Responsible {
  id: string
  name: string
  active: boolean
  sort_order: number
  created_at: string
}

export type ExpenseKind = 'simple' | 'grouped'

export interface Expense {
  id: string
  expense_date: string
  amount: number
  category_id: string | null
  payment_method_id: string | null
  responsible_id: string | null
  detail: string | null
  vendor: string | null
  receipt_url: string | null
  kind: ExpenseKind
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseWithRelations extends Expense {
  category: Category | null
  payment_method: PaymentMethod | null
  responsible: Responsible | null
  expense_items: ExpenseItem[]
}

export interface ExpenseItem {
  id: string
  expense_id: string
  name: string
  amount: number
  category_id: string | null
  created_at: string
  category?: Category | null
}

export interface AppSetting {
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export interface AppDefaults {
  responsible_name?: string
  payment_method_name?: string
}

// Para formularios
export interface QuickExpenseFormData {
  amount: number
  category_id: string
  detail: string
  payment_method_id: string
  responsible_id: string
  expense_date: string
  receipt_file?: File | null
}

export interface GroupedExpenseFormData {
  expense_date: string
  vendor: string
  payment_method_id: string
  responsible_id: string
  receipt_file?: File | null
  items: GroupedExpenseItem[]
}

export interface GroupedExpenseItem {
  name: string
  amount: number
  category_id: string
}

export interface ExpenseFilters {
  year?: number
  month?: number
  category_id?: string
  responsible_id?: string
  payment_method_id?: string
  search?: string
}
