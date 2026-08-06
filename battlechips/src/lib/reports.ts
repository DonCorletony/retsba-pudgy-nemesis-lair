/* ---------- match reports ----------
   Every finished online match is reported by BOTH clients, straight into
   Postgres. The table is insert-only under RLS — reports can be added, never
   edited — so a result is two independent attestations that either agree or
   visibly don't.

   This is what makes a payout checkable: the bank pays a winner only when both
   sides of the match said the same thing. One client claiming victory with no
   matching report from the other side is not a result, it's a claim. */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ksbrlstprqtqhfhynkcq.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYnJsc3RwcnF0cWhmaHlua2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTU1NDEsImV4cCI6MjA2ODczMTU0MX0.kECt1sIzhEHrqTz0JyJ4M8AFN6vjknQvHFRC5UOhY5o';

const client = () => createClient(SUPABASE_URL, SUPABASE_KEY);

export interface MatchReport {
  match_id: string;
  reporter: string;                  // transport id of the reporting client
  wallet: string | null;             // reporter's connected wallet, if any
  winner: string;                    // transport id of who this client says won
  outcome: 'win' | 'loss' | 'forfeit-win' | 'abandon-win';
  wager_token: string | null;
  wager_amount: number | null;
}

/** Fire-and-forget: a report that can't land must never break the game. */
export const sendMatchReport = (report: MatchReport): void => {
  // tests read the attempt; the insert itself needs a network we may not have
  const w = window as unknown as { __BC_REPORTS?: MatchReport[] };
  (w.__BC_REPORTS ||= []).push(report);
  try {
    void client().from('bc_match_reports').insert(report).then(() => undefined);
  } catch {
    /* offline, blocked, or misconfigured — the game goes on */
  }
};
