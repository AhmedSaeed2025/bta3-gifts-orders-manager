-- Fix database linter warnings: set immutable search_path on functions
ALTER FUNCTION public.generate_serial_number()
SET search_path = public;

ALTER FUNCTION public.has_role(uuid, public.user_role)
SET search_path = public;