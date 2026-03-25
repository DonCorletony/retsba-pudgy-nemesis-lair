CREATE TABLE public.ip_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  portal text NOT NULL DEFAULT 'abstracttxns',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ip_address, portal)
);

ALTER TABLE public.ip_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage ip_sessions" ON public.ip_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);