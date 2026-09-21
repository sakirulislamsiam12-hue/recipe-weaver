ALTER TABLE public.recipe_library ADD COLUMN IF NOT EXISTS cuisine TEXT NOT NULL DEFAULT 'bengali';
UPDATE public.recipe_library SET cuisine = 'bengali' WHERE cuisine IS NULL OR cuisine = '';
ALTER TABLE public.recipe_library DROP CONSTRAINT IF EXISTS recipe_library_name_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS recipe_library_cuisine_name_key_idx ON public.recipe_library (cuisine, name_key);
CREATE INDEX IF NOT EXISTS recipe_library_cuisine_idx ON public.recipe_library (cuisine);