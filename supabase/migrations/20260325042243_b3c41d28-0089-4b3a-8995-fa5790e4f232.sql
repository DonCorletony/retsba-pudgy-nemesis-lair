
-- Add token_id to holder_cache
ALTER TABLE public.holder_cache ADD COLUMN token_id text NOT NULL DEFAULT 'retsba';

-- Drop old unique constraint on address and add new one on (token_id, address)
ALTER TABLE public.holder_cache DROP CONSTRAINT IF EXISTS holder_cache_address_key;
ALTER TABLE public.holder_cache ADD CONSTRAINT holder_cache_token_address_key UNIQUE (token_id, address);

-- Add token_id to holder_snapshots
ALTER TABLE public.holder_snapshots ADD COLUMN token_id text NOT NULL DEFAULT 'retsba';

-- Drop old unique constraint on snapshot_date and add new one on (token_id, snapshot_date)
ALTER TABLE public.holder_snapshots DROP CONSTRAINT IF EXISTS holder_snapshots_snapshot_date_key;
ALTER TABLE public.holder_snapshots ADD CONSTRAINT holder_snapshots_token_date_key UNIQUE (token_id, snapshot_date);
