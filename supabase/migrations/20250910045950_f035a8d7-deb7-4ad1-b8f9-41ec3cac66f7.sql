-- Limpiar datos corruptos de miembros de familia
-- Primero eliminar registros duplicados y corruptos

-- Eliminar el registro de Marianne Fuentes que tiene el user_id incorrecto
DELETE FROM family_members 
WHERE email = 'manefb05@gmail.com' 
AND user_id = 'a562114c-477e-4370-abb7-00a845cb077c';

-- Eliminar registros duplicados de gusdlg
DELETE FROM family_members 
WHERE email = 'gusdlg@hotmail.com' 
AND id != (
  SELECT MIN(id) 
  FROM family_members fm2 
  WHERE fm2.email = 'gusdlg@hotmail.com'
);

-- Asegurar que solo quede un registro por usuario real
-- Mantener solo el registro de Gustavo Zurita con el user_id correcto