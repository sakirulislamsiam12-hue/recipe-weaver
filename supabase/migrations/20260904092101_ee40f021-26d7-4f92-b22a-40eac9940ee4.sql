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