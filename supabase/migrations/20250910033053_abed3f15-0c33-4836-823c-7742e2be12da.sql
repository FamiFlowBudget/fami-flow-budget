-- First, let's see what roles we currently have and fix them
UPDATE public.family_members SET role = 'editor' WHERE role = 'adult';
UPDATE public.family_members SET role = 'admin' WHERE role = 'admin'; -- This ensures admin stays admin

-- Now drop the old constraint if it exists
ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_role_check;

-- Add the new constraint
ALTER TABLE public.family_members 
  ADD CONSTRAINT family_members_role_check 
  CHECK (role IN ('admin', 'editor', 'visitor'));

-- Add the missing columns that were in the failed migration
ALTER TABLE public.family_members 
  ADD COLUMN IF NOT EXISTS family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked'));