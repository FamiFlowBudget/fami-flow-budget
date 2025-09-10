-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own family memberships" ON user_families;
DROP POLICY IF EXISTS "Users can insert their own family memberships" ON user_families;

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

-- Create simple, non-recursive policies for user_families
CREATE POLICY "Users can view their own family memberships" 
ON user_families 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own family memberships" 
ON user_families 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Family admins can update memberships" 
ON user_families 
FOR UPDATE 
USING (public.is_family_admin(family_id));

CREATE POLICY "Family admins can delete memberships" 
ON user_families 
FOR DELETE 
USING (public.is_family_admin(family_id));

-- For budgets
CREATE POLICY "Users can view their budgets and family budgets" 
ON budgets 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

-- For categories  
CREATE POLICY "Users can view their categories and family categories" 
ON categories 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

-- For expenses
CREATE POLICY "Users can view their expenses and family expenses" 
ON expenses 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

-- For family_members
CREATE POLICY "Users can view their family members" 
ON family_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id = ANY(public.get_user_family_ids()))
);

CREATE POLICY "Family admins can delete family members" 
ON family_members 
FOR DELETE 
USING (
  family_id IS NOT NULL AND public.is_family_admin(family_id)
);