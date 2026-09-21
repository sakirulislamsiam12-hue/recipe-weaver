CREATE TABLE public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('recipe','donation','request','group','user')),
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

CREATE POLICY "Users can create their own reports"
  ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read their own reports"
  ON public.content_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

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

CREATE POLICY "Users manage their own block list"
  ON public.user_blocks FOR ALL TO authenticated
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

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

CREATE TRIGGER trg_hide_heavily_reported_recipe
AFTER INSERT ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.hide_heavily_reported_recipe();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_content_reports_updated_at
BEFORE UPDATE ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();