-- Fix the security definer functions to handle null auth.uid() cases better

-- Update get_user_family_ids to return empty array instead of null
CREATE OR REPLACE FUNCTION public.get_user_family_ids()
RETURNS uuid[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY_AGG(family_id) FILTER (WHERE family_id IS NOT NULL), 
    ARRAY[]::uuid[]
  )
  FROM user_families 
  WHERE user_id = auth.uid() 
  AND status = 'active';
$$;

-- Update is_family_admin to handle null auth.uid()
CREATE OR REPLACE FUNCTION public.is_family_admin(family_uuid uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT EXISTS (
      SELECT 1 
      FROM user_families 
      WHERE user_id = auth.uid() 
      AND family_id = family_uuid 
      AND role = 'admin' 
      AND status = 'active'
    )
  ), false);
$$;

-- Also ensure categories have proper default data setup
-- Check if current user has any categories, if not set them up
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get current authenticated user (if any)
  user_uuid := auth.uid();
  
  IF user_uuid IS NOT NULL THEN
    -- Check if user has categories
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = user_uuid AND active = true) THEN
      -- Setup default categories
      PERFORM setup_default_categories_for_user(user_uuid);
    END IF;
  END IF;
END $$;