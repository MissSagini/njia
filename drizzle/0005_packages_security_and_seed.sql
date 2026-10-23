-- Packages: same lock-down as every other table (see 0001). Supabase's default
-- privileges give new tables full access to anon and authenticated, so take it back.

REVOKE ALL ON public.packages FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON public.packages TO authenticated;
--> statement-breakpoint
-- Package names and prices are public information (they're on the website)
CREATE POLICY "packages: everyone signed in" ON public.packages FOR SELECT TO authenticated
  USING (true);
--> statement-breakpoint
-- Only one package is on sale at a time
CREATE UNIQUE INDEX packages_one_active_key ON public.packages (active) WHERE active;
--> statement-breakpoint
INSERT INTO public.packages (name, price_kes, weeks) VALUES ('12-week mentorship', 250000, 12);
