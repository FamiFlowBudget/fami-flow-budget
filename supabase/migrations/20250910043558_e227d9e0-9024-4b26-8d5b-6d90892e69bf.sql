-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can delete family memberships" ON user_families;
DROP POLICY IF EXISTS "Admins can update family memberships" ON user_families;
DROP POLICY IF EXISTS "Admins can view all family members" ON user_families;

-- Create new non-recursive policies
-- Allow users to view all family members of families they belong to
CREATE POLICY "Users can view family members of their families" 
ON user_families 
FOR SELECT 
USING (
  family_id IN (
    SELECT uf.family_id 
    FROM user_families uf 
    WHERE uf.user_id = auth.uid() 
    AND uf.status = 'active'
  )
);

-- Allow users to update family memberships if they are admin of that family
CREATE POLICY "Users can update family memberships as admin" 
ON user_families 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_families uf 
    WHERE uf.user_id = auth.uid() 
    AND uf.family_id = user_families.family_id 
    AND uf.role = 'admin' 
    AND uf.status = 'active'
    AND uf.id != user_families.id  -- Prevent self-reference
  )
);

-- Allow users to delete family memberships if they are admin of that family
CREATE POLICY "Users can delete family memberships as admin" 
ON user_families 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_families uf 
    WHERE uf.user_id = auth.uid() 
    AND uf.family_id = user_families.family_id 
    AND uf.role = 'admin' 
    AND uf.status = 'active'
    AND uf.id != user_families.id  -- Prevent self-reference
  )
);