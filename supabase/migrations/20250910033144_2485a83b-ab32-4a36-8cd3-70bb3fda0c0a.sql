-- Add RLS policies for all new tables to fix security warnings

-- RLS Policies for families table
CREATE POLICY "Users can view families they belong to" 
  ON public.families FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = families.id 
      AND user_families.user_id = auth.uid() 
      AND user_families.status = 'active'
    )
  );

CREATE POLICY "Users can update families they are admin of" 
  ON public.families FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = families.id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role = 'admin' 
      AND user_families.status = 'active'
    )
  );

CREATE POLICY "Users can insert new families" 
  ON public.families FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for user_families table
CREATE POLICY "Users can view their own family memberships" 
  ON public.user_families FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all family members" 
  ON public.user_families FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families admin_check
      WHERE admin_check.family_id = user_families.family_id 
      AND admin_check.user_id = auth.uid() 
      AND admin_check.role = 'admin' 
      AND admin_check.status = 'active'
    )
  );

CREATE POLICY "Users can insert their own family memberships" 
  ON public.user_families FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update family memberships" 
  ON public.user_families FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families admin_check
      WHERE admin_check.family_id = user_families.family_id 
      AND admin_check.user_id = auth.uid() 
      AND admin_check.role = 'admin' 
      AND admin_check.status = 'active'
    )
  );

CREATE POLICY "Admins can delete family memberships" 
  ON public.user_families FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families admin_check
      WHERE admin_check.family_id = user_families.family_id 
      AND admin_check.user_id = auth.uid() 
      AND admin_check.role = 'admin' 
      AND admin_check.status = 'active'
    )
  );

-- RLS Policies for join_requests table
CREATE POLICY "Users can view join requests for their families" 
  ON public.join_requests FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = join_requests.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role = 'admin' 
      AND user_families.status = 'active'
    )
    OR requester_user_id = auth.uid()
  );

CREATE POLICY "Anyone can insert join requests" 
  ON public.join_requests FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can update join requests" 
  ON public.join_requests FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = join_requests.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role = 'admin' 
      AND user_families.status = 'active'
    )
  );

-- RLS Policies for invitations table
CREATE POLICY "Users can view invitations for their families" 
  ON public.invitations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = invitations.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role = 'admin' 
      AND user_families.status = 'active'
    )
  );

CREATE POLICY "Admins can manage invitations" 
  ON public.invitations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = invitations.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role = 'admin' 
      AND user_families.status = 'active'
    )
  );