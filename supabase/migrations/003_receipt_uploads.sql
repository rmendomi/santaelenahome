-- Tabla para gestionar boletas subidas al sistema
CREATE TABLE IF NOT EXISTS receipt_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'analyzing', 'review', 'saved', 'failed')),
  analysis_result JSONB,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  analyzed_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ
);

ALTER TABLE receipt_uploads ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden ver y gestionar boletas (consistente con el patrón de la app)
CREATE POLICY "Authenticated users can manage receipt uploads"
  ON receipt_uploads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_status ON receipt_uploads (status);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_created_at ON receipt_uploads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_user_id ON receipt_uploads (user_id);
