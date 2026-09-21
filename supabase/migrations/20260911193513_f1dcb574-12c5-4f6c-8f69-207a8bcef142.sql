-- Shared recipe library (imported from spreadsheets)
CREATE TABLE public.recipe_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  ingredients TEXT,
  method TEXT,
  source TEXT NOT NULL DEFAULT 'excel_import',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recipe_library_name_idx ON public.recipe_library (name);
GRANT SELECT ON public.recipe_library TO anon;
GRANT SELECT ON public.recipe_library TO authenticated;
GRANT ALL ON public.recipe_library TO service_role;
ALTER TABLE public.recipe_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe library readable" ON public.recipe_library FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER recipe_library_updated BEFORE UPDATE ON public.recipe_library FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.recipe_library ADD COLUMN IF NOT EXISTS cuisine TEXT NOT NULL DEFAULT 'bengali';
UPDATE public.recipe_library SET cuisine = 'bengali' WHERE cuisine IS NULL OR cuisine = '';
ALTER TABLE public.recipe_library DROP CONSTRAINT IF EXISTS recipe_library_name_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS recipe_library_cuisine_name_key_idx ON public.recipe_library (cuisine, name_key);
CREATE INDEX IF NOT EXISTS recipe_library_cuisine_idx ON public.recipe_library (cuisine);