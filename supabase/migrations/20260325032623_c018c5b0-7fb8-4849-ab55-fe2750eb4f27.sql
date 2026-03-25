
CREATE TABLE public.holder_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_holders integer NOT NULL DEFAULT 0,
  total_txns integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date)
);

ALTER TABLE public.holder_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage snapshots" ON public.holder_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view snapshots" ON public.holder_snapshots
  FOR SELECT TO public USING (true);
