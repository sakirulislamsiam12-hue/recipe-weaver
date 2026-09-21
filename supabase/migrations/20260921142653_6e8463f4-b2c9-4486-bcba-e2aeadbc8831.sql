ALTER TABLE public.content_reports DROP CONSTRAINT content_reports_content_type_check;
ALTER TABLE public.content_reports ADD CONSTRAINT content_reports_content_type_check
  CHECK (content_type IN ('recipe','donation','request','group','user','ai_output'));