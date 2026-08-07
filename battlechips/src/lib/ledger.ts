/* ---------- the player's account at the bank ----------
   Money in: transfer to the bank wallet, then hand the tx hash to bc-ledger,
   which reads the transaction from the chain and credits the sender. The hash
   is the authentication — only the depositor's wallet can be its signer.

   A confirmed transfer whose credit call fails is NOT lost: the hash goes into
   a local retry queue and is resubmitted next time — crediting is idempotent
   (one hash credits exactly once), so retrying is always safe. */

const FN_URL = 'https://ksbrlstprqtqhfhynkcq.supabase.co/functions/v1/bc-ledger';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYnJsc3RwcnF0cWhmaHlua2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTU1NDEsImV4cCI6MjA2ODczMTU0MX0.kECt1sIzhEHrqTz0JyJ4M8AFN6vjknQvHFRC5UOhY5o';
const PENDING_KEY = 'battlechips.pendingDeposits';

const call = async (body: Record<string, unknown>) => {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ledger ${res.status}`);
  return res.json();
};

export const accountBalances = async (wallet: string): Promise<Record<string, number>> => {
  const { balances } = await call({ action: 'balance', wallet });
  return balances ?? {};
};

const pending = (): string[] => {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]'); } catch { return []; }
};
const setPending = (hashes: string[]) => {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(hashes)); } catch { /* full/blocked */ }
};

/** Credit one confirmed transfer; on failure the hash queues for retry. */
export const creditDeposit = async (txHash: string): Promise<boolean> => {
  try {
    await call({ action: 'deposit', tx_hash: txHash });
    return true;
  } catch {
    setPending([...new Set([...pending(), txHash])]);
    return false;
  }
};

/** Re-submit anything the last session couldn't credit. Safe to call often. */
export const retryPendingDeposits = async (): Promise<void> => {
  const queue = pending();
  if (!queue.length) return;
  const still: string[] = [];
  for (const hash of queue) {
    try { await call({ action: 'deposit', tx_hash: hash }); } catch { still.push(hash); }
  }
  setPending(still);
};
