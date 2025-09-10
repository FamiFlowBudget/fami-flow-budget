-- Continue with the remaining tables and fix security issues

-- Add family_id columns to existing tables if they don't exist
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add constraint for family_members status
ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_status_check;
ALTER TABLE public.family_members ADD CONSTRAINT family_members_status_check 
  CHECK (status IN ('active', 'pending', 'revoked'));

-- Add constraint for family_members role with correct values
ALTER TABLE public.family_members ADD CONSTRAINT family_members_role_check_new 
  CHECK (role IN ('admin', 'editor', 'visitor'));

-- Add family_id to other tables if they don't exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE; 
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;

-- Create indexes for family scoping
CREATE INDEX IF NOT EXISTS idx_family_members_family ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_categories_family ON public.categories(family_id);
CREATE INDEX IF NOT EXISTS idx_budgets_family ON public.budgets(family_id);
CREATE INDEX IF NOT EXISTS idx_expenses_family ON public.expenses(family_id);

-- Create user_families junction table to handle multiple families per user
CREATE TABLE IF NOT EXISTS public.user_families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'visitor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, family_id)
);

-- Create indexes for user_families
CREATE INDEX IF NOT EXISTS idx_user_families_user ON public.user_families(user_id);
CREATE INDEX IF NOT EXISTS idx_user_families_family ON public.user_families(family_id);

-- Enable RLS
ALTER TABLE public.user_families ENABLE ROW LEVEL SECURITY;

-- Create join_requests table for pending requests
CREATE TABLE IF NOT EXISTS public.join_requests (
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
CREATE INDEX IF NOT EXISTS idx_join_requests_family_status ON public.join_requests(family_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_email ON public.join_requests(email);

-- Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Create invitations table for deep-link invitations
CREATE TABLE IF NOT EXISTS public.invitations (
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
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_family ON public.invitations(family_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.generate_family_public_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'FAM-';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  IF EXISTS (SELECT 1 FROM public.families WHERE family_public_id = result) THEN
    RETURN public.generate_family_public_id();
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.hash_join_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(pin || 'family_join_salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_family_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_public_id IS NULL OR NEW.family_public_id = '' THEN
    NEW.family_public_id := public.generate_family_public_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;