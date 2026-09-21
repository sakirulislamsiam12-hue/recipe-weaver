REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.community_recipes
  ADD COLUMN IF NOT EXISTS moderation TEXT NOT NULL DEFAULT 'approved' CHECK (moderation IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS remixed_from UUID REFERENCES public.community_recipes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS remix_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "public recipes readable" ON public.community_recipes;
CREATE POLICY "public approved recipes readable" ON public.community_recipes
  FOR SELECT TO anon, authenticated
  USING (is_public = true AND moderation = 'approved');

CREATE TABLE IF NOT EXISTS public.community_recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.community_recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_ratings_recipe_idx ON public.community_recipe_ratings (recipe_id);

GRANT SELECT ON public.community_recipe_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_recipe_ratings TO authenticated;
GRANT ALL ON public.community_recipe_ratings TO service_role;

ALTER TABLE public.community_recipe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings readable" ON public.community_recipe_ratings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "own rating insert" ON public.community_recipe_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rating update" ON public.community_recipe_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rating delete" ON public.community_recipe_ratings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER community_ratings_updated BEFORE UPDATE ON public.community_recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_recipe_rating() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target UUID;
BEGIN
  target := COALESCE(NEW.recipe_id, OLD.recipe_id);
  UPDATE public.community_recipes c
     SET rating_avg = COALESCE((SELECT ROUND(AVG(stars)::numeric, 2) FROM public.community_recipe_ratings r WHERE r.recipe_id = target), 0),
         rating_count = (SELECT COUNT(*) FROM public.community_recipe_ratings r WHERE r.recipe_id = target)
   WHERE c.id = target;
  RETURN NULL;
END; $$;

REVOKE EXECUTE ON FUNCTION public.refresh_recipe_rating() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER community_ratings_rollup
AFTER INSERT OR UPDATE OR DELETE ON public.community_recipe_ratings
FOR EACH ROW EXECUTE FUNCTION public.refresh_recipe_rating();