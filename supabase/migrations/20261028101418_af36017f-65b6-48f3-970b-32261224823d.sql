CREATE TABLE public.governorates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  shipping_cost numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX governorates_user_name_idx ON public.governorates (user_id, name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.governorates TO authenticated;
GRANT ALL ON public.governorates TO service_role;

ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own governorates"
ON public.governorates
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_governorates_updated_at ON public.governorates;
CREATE TRIGGER trg_governorates_updated_at
BEFORE UPDATE ON public.governorates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();