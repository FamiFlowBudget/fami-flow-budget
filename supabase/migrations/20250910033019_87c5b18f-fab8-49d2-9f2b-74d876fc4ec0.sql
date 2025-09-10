-- First, let's check and fix the family_members table step by step
-- Drop the existing role constraint if it exists
ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_role_check;

-- Check current role values and update them properly
UPDATE public.family_members SET role = 'editor' WHERE role = 'adult';
UPDATE public.family_members SET role = 'visitor' WHERE role = 'kid';

-- Now create families table with unique public ID
CREATE TABLE IF NOT EXISTS public.families (
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
CREATE INDEX IF NOT EXISTS idx_families_public_id ON public.families(family_public_id);

-- Enable RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

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
DROP TRIGGER IF EXISTS set_family_public_id_trigger ON public.families;
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
DROP TRIGGER IF EXISTS update_families_updated_at ON public.families;
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();