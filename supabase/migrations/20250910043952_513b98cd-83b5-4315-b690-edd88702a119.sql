-- Drop ALL existing policies on user_families first
DROP POLICY IF EXISTS "Users can view their own family memberships" ON user_families;
DROP POLICY IF EXISTS "Admins can view all family members" ON user_families;
DROP POLICY IF EXISTS "Users can insert their own family memberships" ON user_families;
DROP POLICY IF EXISTS "Admins can update family memberships" ON user_families; 
DROP POLICY IF EXISTS "Admins can delete family memberships" ON user_families;
DROP POLICY IF EXISTS "Users can view family members of their families" ON user_families;
DROP POLICY IF EXISTS "Users can update family memberships as admin" ON user_families;
DROP POLICY IF EXISTS "Users can delete family memberships as admin" ON user_families;

-- Drop other problematic policies
DROP POLICY IF EXISTS "Family members can view all family budgets" ON budgets;
DROP POLICY IF EXISTS "Family members can view all family categories" ON categories;
DROP POLICY IF EXISTS "Family members can view all family expenses" ON expenses;
DROP POLICY IF EXISTS "Family members can view all family members" ON family_members;
DROP POLICY IF EXISTS "Admins can delete family members" ON family_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_family_ids()
RETURNS uuid[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(family_id) 
  FROM user_families 
  WHERE user_id = auth.uid() 
  AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_family_admin(family_uuid uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_families 
    WHERE user_id = auth.uid() 
    AND family_id = family_uuid 
    AND role = 'admin' 
    AND status = 'active'
  );
$$;

-- Create NEW non-recursive policies
-- user_families policies
CREATE POLICY "Users can view their own family memberships v2" 
ON user_families 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own family memberships v2" 
ON user_families 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Family admins can update memberships v2" 
ON user_families 
FOR UPDATE 
USING (public.is_family_admin(family_id));

CREATE POLICY "Family admins can delete memberships v2" 
ON user_families 
FOR DELETE 
USING (public.is_family_admin(family_id));

-- budgets policies
CREATE POLICY "Users can view their budgets and family budgets v2" 
ON budgets 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

-- categories policies
CREATE POLICY "Users can view their categories and family categories v2" 
ON categories 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

-- expenses policies
CREATE POLICY "Users can view their expenses and family expenses v2" 
ON expenses 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

-- family_members policies
CREATE POLICY "Users can view their family members v2" 
ON family_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

CREATE POLICY "Family admins can delete family members v2" 
ON family_members 
FOR DELETE 
USING (
  family_id IS NOT NULL AND public.is_family_admin(family_id)
);