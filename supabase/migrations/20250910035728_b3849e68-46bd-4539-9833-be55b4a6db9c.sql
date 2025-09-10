-- Update RLS policies for family-based access control

-- Categories: Allow family members to view all categories, but only modify their own
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Family members can view all family categories"
ON public.categories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_families uf
    WHERE uf.user_id = auth.uid()
    AND uf.status = 'active'
    AND (
      -- User's own categories (backward compatibility)
      categories.user_id = auth.uid()
      OR
      -- Family categories if user belongs to any family
      (categories.family_id IS NOT NULL AND uf.family_id = categories.family_id)
    )
  )
);

CREATE POLICY "Users can insert their own categories"
ON public.categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.categories
FOR DELETE
USING (auth.uid() = user_id);

-- Budgets: Allow family members to view all budgets, editors and admins can modify their own
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Family members can view all family budgets"
ON public.budgets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_families uf
    WHERE uf.user_id = auth.uid()
    AND uf.status = 'active'
    AND (
      -- User's own budgets
      budgets.user_id = auth.uid()
      OR
      -- Family budgets if user belongs to the family
      (budgets.family_id IS NOT NULL AND uf.family_id = budgets.family_id)
    )
  )
);

CREATE POLICY "Users can insert their own budgets"
ON public.budgets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
ON public.budgets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
ON public.budgets
FOR DELETE
USING (auth.uid() = user_id);

-- Expenses: Allow family members to view all expenses, editors and admins can modify their own
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

CREATE POLICY "Family members can view all family expenses"
ON public.expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_families uf
    WHERE uf.user_id = auth.uid()
    AND uf.status = 'active'
    AND (
      -- User's own expenses
      expenses.user_id = auth.uid()
      OR
      -- Family expenses if user belongs to the family
      (expenses.family_id IS NOT NULL AND uf.family_id = expenses.family_id)
    )
  )
);

CREATE POLICY "Users can insert their own expenses"
ON public.expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
ON public.expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
ON public.expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Family Members: Allow family members to view all family members, but only modify their own profile
DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;

CREATE POLICY "Family members can view all family members"
ON public.family_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_families uf
    WHERE uf.user_id = auth.uid()
    AND uf.status = 'active'
    AND (
      -- User's own family member record
      family_members.user_id = auth.uid()
      OR
      -- Other family members if user belongs to the same family
      (family_members.family_id IS NOT NULL AND uf.family_id = family_members.family_id)
    )
  )
);

CREATE POLICY "Users can insert their own family member records"
ON public.family_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family member profile"
ON public.family_members
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete family members"
ON public.family_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_families uf
    WHERE uf.user_id = auth.uid()
    AND uf.family_id = family_members.family_id
    AND uf.role = 'admin'
    AND uf.status = 'active'
  )
);