-- Hosted Postgres such as Supabase publishes the `public` schema through an HTTP Data API.
-- The site never uses that API: it connects directly as the owner of these tables, and
-- owners bypass row-level security. Turning RLS on with no policies therefore closes the
-- Data API (no row is visible or writable through it) without changing the site at all.
-- Tables added by later migrations should enable RLS too.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END
$$;
