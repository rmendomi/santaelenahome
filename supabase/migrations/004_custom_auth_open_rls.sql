-- =====================================================
-- Auth propia: tabla app_users + RLS abierto
-- =====================================================

-- 1. Tabla de usuarios propios
CREATE TABLE IF NOT EXISTS public.app_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Quitar FK que apuntan a auth.users (ya no las necesitamos)
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;

ALTER TABLE public.receipt_uploads
  DROP CONSTRAINT IF EXISTS receipt_uploads_user_id_fkey;

-- 3. RLS → acceso libre a todas las tablas (app interna sin auth de supabase)
DROP POLICY IF EXISTS "categories: autenticados leen" ON public.categories;
DROP POLICY IF EXISTS "categories: autenticados escriben" ON public.categories;
DROP POLICY IF EXISTS "categories: autenticados actualizan" ON public.categories;
CREATE POLICY "categories: acceso libre"
  ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payment_methods: autenticados leen" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods: autenticados escriben" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods: autenticados actualizan" ON public.payment_methods;
CREATE POLICY "payment_methods: acceso libre"
  ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "responsibles: autenticados leen" ON public.responsibles;
DROP POLICY IF EXISTS "responsibles: autenticados escriben" ON public.responsibles;
DROP POLICY IF EXISTS "responsibles: autenticados actualizan" ON public.responsibles;
CREATE POLICY "responsibles: acceso libre"
  ON public.responsibles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "expenses: autenticados leen" ON public.expenses;
DROP POLICY IF EXISTS "expenses: autenticados insertan" ON public.expenses;
DROP POLICY IF EXISTS "expenses: autenticados actualizan" ON public.expenses;
DROP POLICY IF EXISTS "expenses: autenticados eliminan" ON public.expenses;
CREATE POLICY "expenses: acceso libre"
  ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "expense_items: autenticados leen" ON public.expense_items;
DROP POLICY IF EXISTS "expense_items: autenticados insertan" ON public.expense_items;
DROP POLICY IF EXISTS "expense_items: autenticados actualizan" ON public.expense_items;
DROP POLICY IF EXISTS "expense_items: autenticados eliminan" ON public.expense_items;
CREATE POLICY "expense_items: acceso libre"
  ON public.expense_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "app_settings: autenticados leen" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings: autenticados escriben" ON public.app_settings;
CREATE POLICY "app_settings: acceso libre"
  ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage receipt uploads" ON public.receipt_uploads;
CREATE POLICY "receipt_uploads: acceso libre"
  ON public.receipt_uploads FOR ALL USING (true) WITH CHECK (true);

-- 4. Storage: permitir anon subir y eliminar
DROP POLICY IF EXISTS "receipts: autenticados suben" ON storage.objects;
DROP POLICY IF EXISTS "receipts: autenticados eliminan" ON storage.objects;
CREATE POLICY "receipts: anon sube"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "receipts: anon elimina"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts');

-- 5. Usuario admin inicial (contraseña: Hostal123)
INSERT INTO public.app_users (email, name, password_hash)
VALUES (
  'dhmendozam@gmail.com',
  'Admin',
  '$2b$10$Yp3cBQvPnKK7RulnmtdV.OYX3V23H930vgYFlDD7RmjE/9EENwH0e'
)
ON CONFLICT (email) DO NOTHING;
