-- Limpiar categorías duplicadas de forma segura preservando referencias

-- 1. Crear tabla temporal con las categorías a mantener (una por nombre)
CREATE TEMP TABLE categories_to_keep AS 
SELECT DISTINCT ON (name) 
  id,
  name,
  icon,
  color,
  order_index
FROM categories 
WHERE user_id = 'a562114c-477e-4370-abb7-00a845cb077c'
ORDER BY name, created_at ASC;

-- 2. Crear mapeo de categorías duplicadas a las que se van a mantener
CREATE TEMP TABLE category_mapping AS
SELECT 
  c.id as old_id,
  ctk.id as new_id,
  c.name
FROM categories c
JOIN categories_to_keep ctk ON c.name = ctk.name
WHERE c.user_id = 'a562114c-477e-4370-abb7-00a845cb077c';

-- 3. Actualizar presupuestos para usar las categorías correctas
UPDATE budgets 
SET category_id = cm.new_id
FROM category_mapping cm
WHERE budgets.category_id = cm.old_id
AND budgets.user_id = 'a562114c-477e-4370-abb7-00a845cb077c';

-- 4. Actualizar gastos para usar las categorías correctas
UPDATE expenses 
SET category_id = cm.new_id
FROM category_mapping cm
WHERE expenses.category_id = cm.old_id
AND expenses.user_id = 'a562114c-477e-4370-abb7-00a845cb077c';

-- 5. Ahora eliminar las categorías duplicadas (mantener solo las de categories_to_keep)
DELETE FROM categories 
WHERE user_id = 'a562114c-477e-4370-abb7-00a845cb077c'
AND id NOT IN (SELECT id FROM categories_to_keep);

-- 6. Verificar resultado
SELECT COUNT(*) as total_categories FROM categories WHERE user_id = 'a562114c-477e-4370-abb7-00a845cb077c';