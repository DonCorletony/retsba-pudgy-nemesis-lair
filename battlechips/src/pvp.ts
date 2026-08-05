/* ---------- online play ----------
   The wire between two captains. Everything the game exchanges rides one small
   message set; the transport underneath is swappable:

   - SupabaseTransport: production. Realtime channels on the same Supabase
     project the parent site uses — broadcast for messages, presence for
     "is the opponent still on the game screen".
   - LocalTransport: BroadcastChannel between same-origin tabs. It exists so the
     whole PvP flow can be driven end-to-end in tests (and locally) without a
     network; presence is emulated with join/leave notes and a heartbeat.

   Trust model, stated plainly: fleets are exchanged at setup's end and each
   client applies both sides' actions deterministically. A modified client could
   read the opponent's fleet. That is the accepted v1 trade for keeping the
   protocol small; server-refereed play is the eventual answer for real stakes. */

import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

/* Same project as the parent site; the publishable key is public by design. */
const SUPABASE_URL = 'https://ksbrlstprqtqhfhynkcq.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYnJsc3RwcnF0cWhmaHlua2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTU1NDEsImV4cCI6MjA2ODczMTU0MX0.kECt1sIzhEHrqTz0JyJ4M8AFN6vjknQvHFRC5UOhY5o';

/* ---------- messages ---------- */
export type Wager = { token: 'LUCKY' | 'USDG'; amount: number } | null;

export type PvpMessage =
  | { t: 'pair'; matchId: string; a: string; b: string; first: string }
  | { t: 'hello' }
  | { t: 'fleet'; fleet: unknown }
  | { t: 'volley'; cells: number[] }
  | { t: 'card'; card: string; color: string; cells?: number[]; row?: number; col?: number; berth?: unknown }
  | { t: 'spin'; choice: string; landed: string }
  | { t: 'endturn' }
  | { t: 'forfeit' }
  | { t: 'rematch' }
  | { t: 'over' };

export interface PvpChannel {
  send(msg: PvpMessage): void;
  onMessage(cb: (msg: PvpMessage, from: string) => void): () => void;
  /** ids currently present, mine included */
  members(): string[];
  onPresence(cb: (ids: string[]) => void): () => void;
  leave(): void;
}

export interface PvpTransport {
  readonly id: string;
  join(name: string): Promise<PvpChannel>;
}

const randomId = () => Math.random().toString(36).slice(2, 10);

/* ---------- BroadcastChannel transport (tests, local play) ---------- */
const HEARTBEAT_MS = 1500;
const STALE_MS = 4000;

class LocalChannel implements PvpChannel {
  private bc: BroadcastChannel;
  private seen = new Map<string, number>();   // id -> last heartbeat
  private msgCbs = new Set<(m: PvpMessage, from: string) => void>();
  private presCbs = new Set<(ids: string[]) => void>();
  private timer: ReturnType<typeof setInterval>;
  /* Messages can land between our join broadcast and the caller wiring its
     handler — a pair offer arriving in that gap must not be lost. Held until
     the first listener, then replayed. (Supabase can't hit this: its handlers
     are wired before subscribe completes.) */
  private pending: { msg: PvpMessage; from: string }[] = [];

  constructor(name: string, private me: string) {
    this.bc = new BroadcastChannel(`bc-pvp:${name}`);
    this.seen.set(me, Date.now());
    this.bc.onmessage = (e) => {
      const d = e.data as { kind: string; id: string; msg?: PvpMessage };
      if (d.kind === 'beat' || d.kind === 'join') {
        const fresh = !this.seen.has(d.id);
        this.seen.set(d.id, Date.now());
        if (d.kind === 'join') this.post('beat');     // announce back so joiners see us
        if (fresh) this.fanPresence();
      } else if (d.kind === 'leave') {
        this.seen.delete(d.id);
        this.fanPresence();
      } else if (d.kind === 'msg' && d.msg) {
        if (this.msgCbs.size === 0) this.pending.push({ msg: d.msg, from: d.id });
        else this.msgCbs.forEach((cb) => cb(d.msg!, d.id));
      }
    };
    this.post('join');
    this.timer = setInterval(() => {
      this.post('beat');
      const cut = Date.now() - STALE_MS;
      let dropped = false;
      for (const [id, at] of this.seen) if (id !== me && at < cut) { this.seen.delete(id); dropped = true; }
      if (dropped) this.fanPresence();
    }, HEARTBEAT_MS);
  }

  private post(kind: string, msg?: PvpMessage) { this.bc.postMessage({ kind, id: this.me, msg }); }
  private fanPresence() { const ids = this.members(); this.presCbs.forEach((cb) => cb(ids)); }

  send(msg: PvpMessage) { this.post('msg', msg); }
  onMessage(cb: (m: PvpMessage, from: string) => void) {
    this.msgCbs.add(cb);
    const held = this.pending.splice(0);
    held.forEach(({ msg, from }) => cb(msg, from));
    return () => this.msgCbs.delete(cb);
  }
  members() { return [...this.seen.keys()].sort(); }
  onPresence(cb: (ids: string[]) => void) { this.presCbs.add(cb); return () => this.presCbs.delete(cb); }
  leave() { clearInterval(this.timer); this.post('leave'); this.bc.close(); }
}

export class LocalTransport implements PvpTransport {
  readonly id = randomId();
  async join(name: string): Promise<PvpChannel> {
    const ch = new LocalChannel(name, this.id);
    await new Promise((r) => setTimeout(r, 60));   // let join/beat echoes land
    return ch;
  }
}

/* ---------- Supabase transport (production) ---------- */
class SupabaseChannel implements PvpChannel {
  private msgCbs = new Set<(m: PvpMessage, from: string) => void>();
  private presCbs = new Set<(ids: string[]) => void>();

  constructor(private ch: RealtimeChannel, private me: string) {
    ch.on('broadcast', { event: 'msg' }, (p) => {
      const { from, msg } = p.payload as { from: string; msg: PvpMessage };
      if (from !== me) this.msgCbs.forEach((cb) => cb(msg, from));
    });
    ch.on('presence', { event: 'sync' }, () => {
      const ids = this.members();
      this.presCbs.forEach((cb) => cb(ids));
    });
  }

  send(msg: PvpMessage) { this.ch.send({ type: 'broadcast', event: 'msg', payload: { from: this.me, msg } }); }
  onMessage(cb: (m: PvpMessage, from: string) => void) { this.msgCbs.add(cb); return () => this.msgCbs.delete(cb); }
  members() { return Object.keys(this.ch.presenceState()).sort(); }
  onPresence(cb: (ids: string[]) => void) { this.presCbs.add(cb); return () => this.presCbs.delete(cb); }
  leave() { this.ch.unsubscribe(); }
}

export class SupabaseTransport implements PvpTransport {
  readonly id = randomId();
  private client = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 20 } } });

  join(name: string): Promise<PvpChannel> {
    return new Promise((resolve, reject) => {
      const ch = this.client.channel(`bc-pvp:${name}`, {
        config: { presence: { key: this.id }, broadcast: { self: false } },
      });
      const wrapped = new SupabaseChannel(ch, this.id);
      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') { await ch.track({ at: Date.now() }); resolve(wrapped); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(`channel ${status}`));
      });
    });
  }
}

/** Tests flip this on to keep everything in-tab; production rides Supabase. */
export const makeTransport = (): PvpTransport =>
  (window as unknown as { __BC_LOCAL_PVP?: boolean }).__BC_LOCAL_PVP
    ? new LocalTransport()
    : new SupabaseTransport();

/* ---------- matchmaking ---------- */
export const bucketFor = (wager: Wager) =>
  wager ? `paid:${wager.token}:${wager.amount}` : 'free';

export interface Paired {
  matchId: string;
  opponent: string;
  /** whoever the pairer flipped for goes first — same answer on both clients */
  youStart: boolean;
}

/** Sit in the queue for `bucket` until someone matches. Cancellable. */
export const findMatch = (
  transport: PvpTransport,
  bucket: string,
  signal?: { cancelled?: boolean },
): Promise<Paired | null> =>
  new Promise((resolve) => {
    let queue: PvpChannel | null = null;
    let settled = false;
    let watch: ReturnType<typeof setInterval> | null = null;
    const finish = (r: Paired | null) => {
      if (settled) return;
      settled = true;
      if (watch) clearInterval(watch);
      queue?.leave();
      resolve(r);
    };
    // an empty queue never fires presence again, so the cancel flag needs a pulse
    watch = setInterval(() => { if (signal?.cancelled) finish(null); }, 200);

    transport.join(`queue:${bucket}`).catch(() => { finish(null); return null; }).then((q) => {
      if (!q) return;
      queue = q;
      if (signal?.cancelled) return finish(null);

      q.onMessage((m) => {
        if (m.t !== 'pair') return;
        if (m.a === transport.id || m.b === transport.id) {
          finish({
            matchId: m.matchId,
            opponent: m.a === transport.id ? m.b : m.a,
            youStart: m.first === transport.id,
          });
        }
      });

      /* The lowest id present does the pairing, so exactly one client acts.
         Everyone else just waits to be named. */
      const tryPair = (ids: string[]) => {
        if (signal?.cancelled) return finish(null);
        if (ids.length < 2 || ids[0] !== transport.id) return;
        const [a, b] = ids;
        const matchId = randomId();
        const first = Math.random() < 0.5 ? a : b;
        q.send({ t: 'pair', matchId, a, b, first });
        // the sender doesn't hear its own broadcast; pair ourselves directly
        finish({ matchId, opponent: b, youStart: first === a });
      };
      q.onPresence(tryPair);
      tryPair(q.members());
    });
  });
