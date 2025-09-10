-- Limpiar categorías duplicadas masivas
-- Eliminar todos los duplicados y mantener solo un conjunto limpio de categorías

-- 1. Primero crear una tabla temporal con las categorías únicas que queremos mantener
CREATE TEMP TABLE clean_categories AS 
SELECT DISTINCT ON (user_id, name, icon, color) 
  id,
  user_id,
  name,
  icon,
  color,
  order_index,
  created_at
FROM categories 
WHERE user_id = 'a562114c-477e-4370-abb7-00a845cb077c'
ORDER BY user_id, name, icon, color, created_at ASC;

-- 2. Eliminar TODAS las categorías del usuario
DELETE FROM categories 
WHERE user_id = 'a562114c-477e-4370-abb7-00a845cb077c';

-- 3. Insertar solo las categorías limpias (las 11 por defecto)
INSERT INTO categories (user_id, name, icon, color, order_index, active)
VALUES 
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Hogar', 'Home', 'blue', 1, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Alimentación', 'ShoppingCart', 'green', 2, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Transporte', 'Car', 'yellow', 3, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Educación', 'GraduationCap', 'indigo', 4, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Salud', 'Heart', 'red', 5, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Seguros', 'Shield', 'gray', 6, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Entretenimiento', 'Gamepad2', 'purple', 7, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Ropa', 'Shirt', 'pink', 8, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Mascotas', 'Heart', 'orange', 9, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Ahorro', 'PiggyBank', 'emerald', 10, true),
  ('a562114c-477e-4370-abb7-00a845cb077c', 'Imprevistos', 'AlertTriangle', 'amber', 11, true);

-- 4. Verificar el resultado
SELECT COUNT(*) as total_categories_after_cleanup FROM categories WHERE user_id = 'a562114c-477e-4370-abb7-00a845cb077c';