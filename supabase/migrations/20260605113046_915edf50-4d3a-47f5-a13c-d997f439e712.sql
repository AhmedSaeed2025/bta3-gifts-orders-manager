CREATE OR REPLACE FUNCTION public.generate_serial_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_year integer;
    current_month integer;
    max_sequence integer;
    year_month text;
    new_serial text;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE) % 100;
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    year_month := LPAD(current_year::text, 2, '0') || LPAD(current_month::text, 2, '0');

    SELECT COALESCE(MAX(CAST(SUBSTRING(serial FROM 'INV-' || year_month || '-(.*)') AS integer)), 0)
    INTO max_sequence
    FROM public.orders
    WHERE serial LIKE 'INV-' || year_month || '-%';

    new_serial := 'INV-' || year_month || '-' || LPAD((max_sequence + 1)::text, 4, '0');
    RETURN new_serial;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_serial_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_serial_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_serial_number() TO service_role;