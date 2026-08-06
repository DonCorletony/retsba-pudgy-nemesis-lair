-- Battle Chips online match reports: one row per client per match, written the
-- moment a match ends. Insert-only by design — no update or delete policies —
-- so every result is a pair of independent attestations that either agree or
-- visibly disagree. Payouts only ever follow agreement.
create table if not exists public.bc_match_reports (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  reporter text not null,
  wallet text,
  winner text not null,
  outcome text not null check (outcome in ('win', 'loss', 'forfeit-win', 'abandon-win')),
  wager_token text,
  wager_amount numeric,
  created_at timestamptz not null default now(),
  unique (match_id, reporter)
);

alter table public.bc_match_reports enable row level security;

create policy "reports may be filed by anyone"
  on public.bc_match_reports for insert with check (true);

create policy "reports are public"
  on public.bc_match_reports for select using (true);

-- One payout per match, claimed before the transfer is attempted, so replaying
-- a payout request can never pay twice. Written only by the service role.
create table if not exists public.bc_payouts (
  match_id text primary key,
  wallet text not null,
  token text not null,
  amount numeric not null,
  tx_hash text,
  created_at timestamptz not null default now()
);
alter table public.bc_payouts enable row level security;
create policy "payouts are public" on public.bc_payouts for select using (true);
