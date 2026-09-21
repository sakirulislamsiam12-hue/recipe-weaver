CREATE TABLE public.pantry_purchase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  storage_type TEXT NOT NULL CHECK (storage_type IN ('freezer','refrigerator','shelf','room_temp')),
  expected_usage TEXT,
  expected_expiry_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pantry_purchase_user_idx ON public.pantry_purchase (user_id, purchase_date DESC);
CREATE INDEX pantry_purchase_expiry_idx ON public.pantry_purchase (user_id, expected_expiry_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pantry_purchase TO authenticated;
GRANT ALL ON public.pantry_purchase TO service_role;
ALTER TABLE public.pantry_purchase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases" ON public.pantry_purchase FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pantry_purchase_updated BEFORE UPDATE ON public.pantry_purchase FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();