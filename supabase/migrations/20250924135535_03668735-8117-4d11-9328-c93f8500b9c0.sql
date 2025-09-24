-- Fix function search path security issues

-- Fix existing functions to have proper search_path settings
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

CREATE OR REPLACE FUNCTION public.validate_email(email_text text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT email_text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
$$;