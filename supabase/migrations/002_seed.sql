-- =====================================================
-- Seed: categorías, medios de pago, responsables
-- =====================================================

-- Categories
insert into public.categories (name, color, icon, sort_order) values
  ('Desayuno',     '#F4A261', '🥐', 1),
  ('Supermercado', '#2A9D8F', '🛒', 2),
  ('Verduras',     '#57CC99', '🥦', 3),
  ('Pan',          '#E9C46A', '🍞', 4),
  ('Limpieza',     '#4CC9F0', '🧹', 5),
  ('Lavandería',   '#7B2D8B', '👕', 6),
  ('Gas',          '#E76F51', '🔥', 7),
  ('Mantención',   '#6D6875', '🔧', 8),
  ('Servicios',    '#264653', '💡', 9),
  ('Otros',        '#9B9B9B', '📦', 10)
on conflict do nothing;

-- Payment Methods
insert into public.payment_methods (name, icon, sort_order) values
  ('Efectivo',      '💵', 1),
  ('Transferencia', '📲', 2),
  ('Tarjeta',       '💳', 3),
  ('Dólares',       '💰', 4)
on conflict do nothing;

-- Responsibles
insert into public.responsibles (name, sort_order) values
  ('Mamá',  1),
  ('Papá',  2),
  ('Otro',  3)
on conflict do nothing;

-- App Settings defaults
insert into public.app_settings (key, value) values
  ('defaults', '{"responsible_name": "Mamá", "payment_method_name": "Efectivo"}')
on conflict (key) do nothing;
