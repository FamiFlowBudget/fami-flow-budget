-- Limpiar datos corruptos de miembros de familia
-- El usuario actual es gustavozuritacitizens@gmail.com con user_id a562114c-477e-4370-abb7-00a845cb077c

-- 1. Eliminar el registro incorrecto de Marianne Fuentes que tiene el user_id de Gustavo
DELETE FROM family_members 
WHERE email = 'manefb05@gmail.com' 
AND user_id = 'a562114c-477e-4370-abb7-00a845cb077c';

-- 2. Eliminar registros duplicados de gusdlg (mantener solo uno)
DELETE FROM family_members 
WHERE email = 'gusdlg@hotmail.com' 
AND created_at != (
  SELECT MIN(created_at) 
  FROM family_members fm2 
  WHERE fm2.email = 'gusdlg@hotmail.com'
);

-- 3. Verificar que Gustavo Zurita tenga el user_id correcto
UPDATE family_members 
SET name = 'Gustavo Zurita',
    email = 'gustavozuritacitizens@gmail.com'
WHERE user_id = 'a562114c-477e-4370-abb7-00a845cb077c'
AND active = true;