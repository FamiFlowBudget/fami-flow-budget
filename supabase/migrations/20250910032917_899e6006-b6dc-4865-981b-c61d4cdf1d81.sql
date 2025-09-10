-- Create families table with unique public ID
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  family_public_id TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'CLP',
  timezone TEXT DEFAULT 'America/Santiago',
  join_pin_hash TEXT NULL,
  invitation_policy JSONB DEFAULT '{"requirePin": false, "defaultRoleOnInvite": "editor", "tokenExpiryDays": 7, "allowEditorImports": false, "allowEditorReports": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for family_public_id
CREATE INDEX idx_families_public_id ON public.families(family_public_id);

-- Enable RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Create join_requests table for pending requests
CREATE TABLE public.join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requester_user_id UUID NULL,
  email TEXT NOT NULL,
  message TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by_user_id UUID NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for join_requests
CREATE INDEX idx_join_requests_family_status ON public.join_requests(family_id, status);
CREATE INDEX idx_join_requests_email ON public.join_requests(email);

-- Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Create invitations table for deep-link invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email_allowlist TEXT NULL,
  suggested_role TEXT NOT NULL DEFAULT 'editor' CHECK (suggested_role IN ('admin', 'editor', 'visitor')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  uses_remaining INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for invitations
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_family ON public.invitations(family_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Update family_members table to include family reference and new roles
ALTER TABLE public.family_members 
  ADD COLUMN family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked'));

-- Update role column to use new enum values, mapping adult->editor, kid->visitor
UPDATE public.family_members SET role = 'editor' WHERE role = 'adult';
UPDATE public.family_members SET role = 'visitor' WHERE role = 'kid';

-- Add constraint for new role values
ALTER TABLE public.family_members 
  ADD CONSTRAINT family_members_role_check 
  CHECK (role IN ('admin', 'editor', 'visitor'));

-- Create user_families junction table to handle multiple families per user
CREATE TABLE public.user_families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'visitor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, family_id)
);

-- Create indexes for user_families
CREATE INDEX idx_user_families_user ON public.user_families(user_id);
CREATE INDEX idx_user_families_family ON public.user_families(family_id);

-- Enable RLS
ALTER TABLE public.user_families ENABLE ROW LEVEL SECURITY;

-- Add family_id to all existing tables that need family scoping
ALTER TABLE public.categories ADD COLUMN family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE;

-- Create indexes for family scoping
CREATE INDEX idx_categories_family ON public.categories(family_id);
CREATE INDEX idx_budgets_family ON public.budgets(family_id);
CREATE INDEX idx_expenses_family ON public.expenses(family_id);

-- Function to generate family public ID
CREATE OR REPLACE FUNCTION public.generate_family_public_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789'; -- Excluding confusing chars
  result TEXT := 'FAM-';
  i INTEGER;
BEGIN
  -- Generate format: FAM-XXXX-XXXX
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Ensure uniqueness
  IF EXISTS (SELECT 1 FROM public.families WHERE family_public_id = result) THEN
    RETURN public.generate_family_public_id();
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to hash join PIN
CREATE OR REPLACE FUNCTION public.hash_join_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(pin || 'family_join_salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate family_public_id
CREATE OR REPLACE FUNCTION public.set_family_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_public_id IS NULL OR NEW.family_public_id = '' THEN
    NEW.family_public_id := public.generate_family_public_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_family_public_id_trigger
  BEFORE INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_public_id();

-- Trigger for updated_at on families
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for families
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

-- RLS Policies for user_families
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

-- RLS Policies for join_requests
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

-- RLS Policies for invitations
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

-- Update RLS policies for existing tables to include family scoping
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
CREATE POLICY "Users can view categories in their families" 
  ON public.categories FOR SELECT 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = categories.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
CREATE POLICY "Editors and admins can insert categories in their families" 
  ON public.categories FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND
    (family_id IS NULL OR EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = categories.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role IN ('admin', 'editor')
      AND user_families.status = 'active'
    ))
  );

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Admins can update categories in their families" 
  ON public.categories FOR UPDATE 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = categories.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role = 'admin'
      AND user_families.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Admins can delete categories in their families" 
  ON public.categories FOR DELETE 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_families 
      WHERE user_families.family_id = categories.family_id 
      AND user_families.user_id = auth.uid() 
      AND user_families.role = 'admin'
      AND user_families.status = 'active'
    )
  );