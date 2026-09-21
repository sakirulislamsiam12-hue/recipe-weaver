CREATE TABLE IF NOT EXISTS public.migration_probe (id int primary key);
GRANT ALL ON public.migration_probe TO service_role;