
CREATE TABLE public.holder_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank integer NOT NULL,
  address text NOT NULL,
  balance text NOT NULL,
  tx_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(address)
);

ALTER TABLE public.holder_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage holder_cache" ON public.holder_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view holder_cache" ON public.holder_cache
  FOR SELECT TO public USING (true);
