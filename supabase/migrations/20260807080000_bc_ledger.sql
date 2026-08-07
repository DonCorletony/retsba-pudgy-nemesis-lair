-- Battle Chips account ledger: append-only, service-role writes ONLY.
-- Every credit and debit is a row; an account balance is the sum of its rows.
-- Clients can read everything and write nothing — deposits are credited by the
-- bc-ledger function only after it has verified the transfer on-chain, and the
-- unique (kind, ref) pair means one transaction can never credit twice.
create table if not exists public.bc_ledger (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  token text not null check (token in ('USDG', 'LUCKY')),
  delta numeric not null,
  kind text not null check (kind in ('deposit', 'withdraw', 'stake', 'payout', 'refund', 'adjust')),
  ref text not null,
  created_at timestamptz not null default now(),
  unique (kind, ref)
);

alter table public.bc_ledger enable row level security;
create policy "the ledger is public reading" on public.bc_ledger for select using (true);
-- no insert/update/delete policies: anon and authenticated cannot write at all

create or replace view public.bc_balances as
  select wallet, token, sum(delta) as balance
  from public.bc_ledger group by wallet, token;
