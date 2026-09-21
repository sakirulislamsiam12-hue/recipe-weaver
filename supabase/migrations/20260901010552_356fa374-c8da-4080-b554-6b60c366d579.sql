CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  lang TEXT NOT NULL DEFAULT 'en',
  country TEXT,
  spice TEXT,
  salt TEXT,
  diet TEXT[] NOT NULL DEFAULT '{}',
  cook_time TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- pantry items
CREATE TABLE public.pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  quantity TEXT,
  freshness TEXT NOT NULL DEFAULT 'fresh',
  expires_on DATE,
  source TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pantry_items_user_idx ON public.pantry_items (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pantry_items TO authenticated;
GRANT ALL ON public.pantry_items TO service_role;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pantry" ON public.pantry_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pantry_updated BEFORE UPDATE ON public.pantry_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- saved recipes
CREATE TABLE public.saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  recipe JSONB NOT NULL,
  servings INTEGER NOT NULL DEFAULT 2,
  is_favourite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX saved_recipes_user_idx ON public.saved_recipes (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_recipes TO authenticated;
GRANT ALL ON public.saved_recipes TO service_role;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved recipes" ON public.saved_recipes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER saved_recipes_updated BEFORE UPDATE ON public.saved_recipes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- per-recipe chat history
CREATE TABLE public.recipe_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_key TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recipe_chat_idx ON public.recipe_chat_messages (user_id, recipe_key, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_chat_messages TO authenticated;
GRANT ALL ON public.recipe_chat_messages TO service_role;
ALTER TABLE public.recipe_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat" ON public.recipe_chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- community recipes
CREATE TABLE public.community_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT,
  title TEXT NOT NULL,
  recipe JSONB NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  is_public BOOLEAN NOT NULL DEFAULT true,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX community_public_idx ON public.community_recipes (is_public, created_at DESC);
GRANT SELECT ON public.community_recipes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_recipes TO authenticated;
GRANT ALL ON public.community_recipes TO service_role;
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authors read own" ON public.community_recipes FOR SELECT TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "authors insert" ON public.community_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors update" ON public.community_recipes FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors delete" ON public.community_recipes FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE TRIGGER community_updated BEFORE UPDATE ON public.community_recipes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'expiry',
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.community_recipes
  ADD COLUMN IF NOT EXISTS moderation TEXT NOT NULL DEFAULT 'approved' CHECK (moderation IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS remixed_from UUID REFERENCES public.community_recipes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS remix_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

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

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  country text,
  cuisines text[] NOT NULL DEFAULT '{}',
  storage text,
  household_size integer,
  skill text,
  spice_level integer,
  salt_level integer,
  diet text[] NOT NULL DEFAULT '{}',
  allergies text,
  cook_time text,
  healthy text,
  budget text,
  frequency text,
  appliances text[] NOT NULL DEFAULT '{}',
  living text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own preferences" ON public.user_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();