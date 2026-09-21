CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

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

CREATE TABLE public.community_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT,
  title TEXT NOT NULL,
  recipe JSONB NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  is_public BOOLEAN NOT NULL DEFAULT true,
  likes INTEGER NOT NULL DEFAULT 0,
  moderation TEXT NOT NULL DEFAULT 'approved' CHECK (moderation IN ('pending','approved','rejected')),
  remixed_from UUID REFERENCES public.community_recipes(id) ON DELETE SET NULL,
  remix_count INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
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
CREATE POLICY "public approved recipes readable" ON public.community_recipes FOR SELECT TO anon, authenticated USING (is_public = true AND moderation = 'approved');
CREATE TRIGGER community_updated BEFORE UPDATE ON public.community_recipes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

CREATE TABLE public.community_recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.community_recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, user_id)
);
CREATE INDEX community_ratings_recipe_idx ON public.community_recipe_ratings (recipe_id);
GRANT SELECT ON public.community_recipe_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_recipe_ratings TO authenticated;
GRANT ALL ON public.community_recipe_ratings TO service_role;
ALTER TABLE public.community_recipe_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings readable" ON public.community_recipe_ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "own rating insert" ON public.community_recipe_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rating update" ON public.community_recipe_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rating delete" ON public.community_recipe_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER community_ratings_updated BEFORE UPDATE ON public.community_recipe_ratings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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
CREATE TRIGGER community_ratings_rollup AFTER INSERT OR UPDATE OR DELETE ON public.community_recipe_ratings FOR EACH ROW EXECUTE FUNCTION public.refresh_recipe_rating();

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
CREATE POLICY "own preferences" ON public.user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

CREATE TABLE public.community_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT,
  condition TEXT NOT NULL DEFAULT 'fresh' CHECK (condition IN ('fresh','partly_spoiled','spoiled')),
  location TEXT,
  contact TEXT,
  message TEXT,
  notify_nearby BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX community_donations_created_idx ON public.community_donations (created_at DESC);
GRANT SELECT ON public.community_donations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_donations TO authenticated;
GRANT ALL ON public.community_donations TO service_role;
ALTER TABLE public.community_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations readable" ON public.community_donations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "own donation insert" ON public.community_donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own donation update" ON public.community_donations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own donation delete" ON public.community_donations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.community_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  food_needed TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT,
  urgency TEXT NOT NULL DEFAULT 'this_week' CHECK (urgency IN ('today','this_week','this_month')),
  location TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX community_requests_created_idx ON public.community_requests (created_at DESC);
GRANT SELECT ON public.community_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_requests TO authenticated;
GRANT ALL ON public.community_requests TO service_role;
ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests readable" ON public.community_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "own request insert" ON public.community_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own request update" ON public.community_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own request delete" ON public.community_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.sharing_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  group_name TEXT NOT NULL,
  platform_type TEXT NOT NULL DEFAULT 'whatsapp' CHECK (platform_type IN ('whatsapp','telegram','facebook','other')),
  group_link TEXT NOT NULL,
  region TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sharing_groups_region_idx ON public.sharing_groups (region);
GRANT SELECT ON public.sharing_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sharing_groups TO authenticated;
GRANT ALL ON public.sharing_groups TO service_role;
ALTER TABLE public.sharing_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups readable" ON public.sharing_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "group insert" ON public.sharing_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "own group update" ON public.sharing_groups FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "own group delete" ON public.sharing_groups FOR DELETE TO authenticated USING (auth.uid() = created_by);

INSERT INTO public.sharing_groups (group_name, platform_type, group_link, region, member_count, last_activity) VALUES
  ('ঢাকা খাদ্য শেয়ারিং', 'whatsapp', 'https://chat.whatsapp.com/invite/dhaka-food-share', 'ঢাকা', 248, now() - interval '2 hours'),
  ('মিরপুর ফুড ব্যাংক', 'whatsapp', 'https://chat.whatsapp.com/invite/mirpur-food-bank', 'মিরপুর, ঢাকা', 132, now() - interval '1 day'),
  ('চট্টগ্রাম উদ্বৃত্ত খাবার', 'telegram', 'https://t.me/ctg_surplus_food', 'চট্টগ্রাম', 87, now() - interval '5 hours'),
  ('সিলেট শেয়ার অ্যান্ড কেয়ার', 'whatsapp', 'https://chat.whatsapp.com/invite/sylhet-share-care', 'সিলেট', 64, now() - interval '3 days');

CREATE TABLE public.recipe_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  ingredients TEXT,
  method TEXT,
  source TEXT NOT NULL DEFAULT 'excel_import',
  cuisine TEXT NOT NULL DEFAULT 'bengali',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recipe_library_name_idx ON public.recipe_library (name);
CREATE UNIQUE INDEX recipe_library_cuisine_name_key_idx ON public.recipe_library (cuisine, name_key);
CREATE INDEX recipe_library_cuisine_idx ON public.recipe_library (cuisine);
GRANT SELECT ON public.recipe_library TO anon;
GRANT SELECT ON public.recipe_library TO authenticated;
GRANT ALL ON public.recipe_library TO service_role;
ALTER TABLE public.recipe_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe library readable" ON public.recipe_library FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER recipe_library_updated BEFORE UPDATE ON public.recipe_library FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('recipe','donation','request','group','user','ai_output')),
  content_id UUID NOT NULL,
  reported_user_id UUID,
  reason TEXT NOT NULL CHECK (reason IN ('spam','offensive','unsafe_food','sexual','hate','fraud','other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','actioned','dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, content_type, content_id)
);
GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create their own reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can read their own reports" ON public.content_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own block list" ON public.user_blocks FOR ALL TO authenticated USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

CREATE INDEX idx_content_reports_content ON public.content_reports (content_type, content_id);
CREATE INDEX idx_user_blocks_blocker ON public.user_blocks (blocker_id);

CREATE OR REPLACE FUNCTION public.hide_heavily_reported_recipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_total INTEGER;
BEGIN
  IF NEW.content_type = 'recipe' THEN
    SELECT count(*) INTO report_total
    FROM public.content_reports
    WHERE content_type = 'recipe' AND content_id = NEW.content_id;

    IF report_total >= 3 THEN
      UPDATE public.community_recipes
      SET moderation = 'hidden'
      WHERE id = NEW.content_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.hide_heavily_reported_recipe() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_hide_heavily_reported_recipe AFTER INSERT ON public.content_reports FOR EACH ROW EXECUTE FUNCTION public.hide_heavily_reported_recipe();

CREATE TRIGGER update_content_reports_updated_at BEFORE UPDATE ON public.content_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();