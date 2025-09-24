-- Fix critical security issues identified in security review

-- 1. Fix join_requests RLS policy to require authentication
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert join requests" ON public.join_requests;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can insert join requests" 
ON public.join_requests 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Add additional security to family_members table for email protection
-- Ensure emails are only visible to family members
DROP POLICY IF EXISTS "Users can view their family members v2" ON public.family_members;

CREATE POLICY "Users can view their family members v3" 
ON public.family_members 
FOR SELECT 
TO authenticated
USING (
  (user_id = auth.uid()) OR 
  ((family_id IS NOT NULL) AND (family_id = ANY (get_user_family_ids())))
);

-- 3. Add rate limiting protection for join requests
-- Create a function to check if user has exceeded join request limit
CREATE OR REPLACE FUNCTION public.check_join_request_limit(family_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < 5 
  FROM public.join_requests 
  WHERE requester_user_id = auth.uid() 
  AND family_id = family_uuid
  AND created_at > NOW() - INTERVAL '1 hour';
$$;

-- Update join request policy to include rate limiting
DROP POLICY IF EXISTS "Authenticated users can insert join requests" ON public.join_requests;

CREATE POLICY "Authenticated users can insert join requests with rate limit" 
ON public.join_requests 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  requester_user_id = auth.uid() AND
  public.check_join_request_limit(family_id)
);

-- 4. Add email validation function
CREATE OR REPLACE FUNCTION public.validate_email(email_text text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT email_text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
$$;

-- Add email validation to join requests
ALTER TABLE public.join_requests 
ADD CONSTRAINT valid_email_format 
CHECK (public.validate_email(email));

-- 5. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  metadata jsonb,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_families uf
    WHERE uf.user_id = auth.uid() 
    AND uf.role = 'admin' 
    AND uf.status = 'active'
  )
);