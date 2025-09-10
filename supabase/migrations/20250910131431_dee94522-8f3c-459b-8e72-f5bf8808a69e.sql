-- Ensure Gustavo Zurita has a family assigned
INSERT INTO public.families (name, currency, timezone)
SELECT 'Familia Zurita', 'CLP', 'America/Santiago'
WHERE NOT EXISTS (
  SELECT 1 FROM public.families f
  JOIN public.user_families uf ON f.id = uf.family_id
  JOIN auth.users u ON uf.user_id = u.id
  WHERE u.email = 'gustavozuritacitizens@gmail.com'
);

-- Get the family ID for Gustavo or create the user-family relationship
DO $$
DECLARE
  gustavo_user_id uuid;
  family_id uuid;
BEGIN
  -- Get Gustavo's user ID
  SELECT id INTO gustavo_user_id
  FROM auth.users
  WHERE email = 'gustavozuritacitizens@gmail.com';
  
  IF gustavo_user_id IS NOT NULL THEN
    -- Get or create family for Gustavo
    SELECT f.id INTO family_id
    FROM public.families f
    JOIN public.user_families uf ON f.id = uf.family_id
    WHERE uf.user_id = gustavo_user_id
    LIMIT 1;
    
    IF family_id IS NULL THEN
      -- Create family for Gustavo
      INSERT INTO public.families (name, currency, timezone)
      VALUES ('Familia Zurita', 'CLP', 'America/Santiago')
      RETURNING id INTO family_id;
      
      -- Add Gustavo as admin of his family
      INSERT INTO public.user_families (user_id, family_id, role, status)
      VALUES (gustavo_user_id, family_id, 'admin', 'active');
      
      -- Create family member profile for Gustavo
      INSERT INTO public.family_members (user_id, family_id, name, email, role, active)
      VALUES (gustavo_user_id, family_id, 'Gustavo Zurita', 'gustavozuritacitizens@gmail.com', 'admin', true);
    END IF;
  END IF;
END $$;