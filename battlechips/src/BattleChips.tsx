import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

/**
 * BATTLE CHIPS (battleship × roulette) — the whole game, one component.
 *
 * Setup: the next boat is always already on the board, pulsing yellow — drag it or
 * tap a cell to move, the turn-wheel rotates, PLACE locks it and spawns the one
 * after it. All five locked → EDIT / DONE. 30s timer; anything unplaced is
 * auto-deployed at 0:00. (Nothing here waits on an undiscoverable click: new
 * players stalled on the old "tap the grid to spawn a boat" step.)
 *
 * Battle: 5 shots every turn, all match long. Only the clock tightens as the
 * fleets thin out — 20s, then 15s once either side is down to 2 boats, then 10s
 * at 1. The rocket row under the clocks is one rocket per shot the ACTIVE player
 * still holds, so it shrinks as they fire and grows when a card hands them more.
 *
 * Yellow outline marks the board that matters right now, NOT whose turn it is —
 * on your turn that's enemy waters (where you fire), on theirs it's your own
 * fleet (where the shots are landing). Pulsing specifically means "your move",
 * the same signal the boat being placed uses during setup.
 *
 * The stand-in opponent hunts on a checkerboard, then works a hit until the ship
 * sinks — see foeTarget.
 *
 * Roulette: SINKING a ship pauses the turn for a spin — for either side, and the
 * opponent's plays out on screen behind an "OPPONENT'S SPIN" banner rather than
 * resolving offstage. Each slot is dealt an
 * action card first (RED/BLACK: +1 or +2 at 50/50 each, independently; GREEN:
 * Cluster or Skip at 50/50), so you can see what you're playing for. Guess the
 * landing colour right and that slot's card is yours — guess wrong and it goes
 * to your opponent.
 *
 * Action cards are one-time use and playable any time during your own turn.
 * Several can be played in a turn but effects don't stack (Cluster/Skip are
 * armed flags, so a second copy doesn't double them). The opponent spends its
 * own hand at the top of its turn and the play is announced on screen.
 */

const GRID = 10;
const SETUP_SECONDS = 30;
const EXPLOSION_MS = 2100;
const BONUS_POPUP_MS = 2500;
const CALLOUT_MS = 2000;       // "PLACE YOUR BOATS" / "BEGIN" flashes
const FOE_CARD_MS = 1800;      // "ENEMY PLAYS …" flash
const FOE_ANNOUNCE_MS = 3000; // "OPPONENT'S SPIN" banner before their wheel turns
const SPIN_MS = 3200;
const RESULT_MS = 1800;
const CLUSTER_SIZE = 5; // Cluster card fires a 5x5 blast
const SHIELD_SIZE = 5;  // Shield card covers a 5x5 of your own water
const SHIELD_HIT_MS = 1400;

/* ---------- audio ----------
   Browsers block audio until the page has had a user gesture; clicking
   "New match" supplies it. Playback errors are swallowed — sound is never
   allowed to break the game. */
const SFX = {
  countdown: '/game/sounds/countdown-beep.mp3',
  start: '/game/sounds/start-beep.wav',
  hit: '/game/sounds/ship-hit.wav',
  sunk: '/game/sounds/ship-destroyed.wav',
  miss: '/game/sounds/miss.mp3',
  bonus: '/game/sounds/bonus-spin.mp3',
  highlight: '/game/sounds/powerup-highlight.wav',
  selected: '/game/sounds/powerup-selected.wav',
} as const;

const audioCache = new Map<string, HTMLAudioElement>();
const preloadSfx = () => {
  for (const src of Object.values(SFX)) {
    if (audioCache.has(src)) continue;
    const a = new Audio(src);
    a.preload = 'auto';
    audioCache.set(src, a);
  }
};
const playSfx = (src: string) => {
  try {
    const base = audioCache.get(src);
    const node = (base ? base.cloneNode() : new Audio(src)) as HTMLAudioElement;
    node.play().catch(() => {});
  } catch { /* ignore */ }
};

/* ---------- action cards ----------
   Red and black slots deal from one pool and green from another, so anything
   red/black needs art in both colours. Cards with no art yet fall back to a
   labelled chip. */
type Card = '+1' | '+2' | 'SKIP' | 'SHIELD' | 'THUNDERSTORM' | 'CLUSTER' | 'WHIRLPOOL' | 'RESURRECTION';
type Color = 'RED' | 'GREEN' | 'BLACK';
/** A card in a rack remembers the slot colour it came from, for the right art. */
interface CardInst { type: Card; color: Color }

const CARD_INFO: Record<Card, { label: string; name: string; blurb: string; cls: string }> = {
  '+1': { label: '+1', name: 'MISSILE', blurb: '1 extra shot this turn', cls: 'bg-[#1d4ed8]' },
  '+2': { label: '+2', name: 'BOMBER', blurb: '2 extra shots this turn', cls: 'bg-[#7c3aed]' },
  SKIP: { label: '1T', name: 'SKIP', blurb: "Skip opponent's next turn", cls: 'bg-[#0f766e]' },
  SHIELD: { label: '5×5', name: 'SHIELD', blurb: 'Hide a 5×5 area for one enemy turn', cls: 'bg-[#0369a1]' },
  THUNDERSTORM: { label: '1×1', name: 'THUNDERSTORM', blurb: 'Three single strikes at random', cls: 'bg-[#4338ca]' },
  // CLUSTER is aimed by the player; WHIRLPOOL lands wherever it lands.
  CLUSTER: { label: '5×5', name: 'CLUSTER', blurb: 'Your next shot hits a 5×5 you pick', cls: 'bg-[#ea580c]' },
  WHIRLPOOL: { label: '3×3', name: 'WHIRLPOOL', blurb: 'Three 3×3 strikes at random', cls: 'bg-[#0d9488]' },
  RESURRECTION: { label: 'REV', name: 'RESURRECTION', blurb: 'Raise your smallest sunk boat', cls: 'bg-[#65a30d]' },
};

const CARD_ART: Record<string, string> = {
  '+1|RED': '/game/cards/missile-red.png',
  '+1|BLACK': '/game/cards/missile-black.webp',
  '+2|RED': '/game/cards/bomber-red.png',
  '+2|BLACK': '/game/cards/bomber-black.png',
  'CLUSTER|GREEN': '/game/cards/cluster-green.png',
  // dropped in as the files land; until then these render as labelled chips
  'SKIP|RED': '/game/cards/skip-red.png',
  'SKIP|BLACK': '/game/cards/skip-black.png',
  'SHIELD|RED': '/game/cards/shield-red.png',
  'SHIELD|BLACK': '/game/cards/shield-black.png',
  'THUNDERSTORM|RED': '/game/cards/thunderstorm-red.png',
  'THUNDERSTORM|BLACK': '/game/cards/thunderstorm-black.png',
  'WHIRLPOOL|GREEN': '/game/cards/whirlpool-green.png',
  'RESURRECTION|GREEN': '/game/cards/resurrection-green.png',
};
const cardArt = (c: CardInst): string | undefined => CARD_ART[`${c.type}|${c.color}`];

/* ---------- roulette ----------
   AMERICAN wheel: 38 pockets — 18 red, 18 black, plus 0 and 00 green.
   So red/black are 18/38 each and green is 2/38 = 1/19. */
const COLORS: { key: Color; label: string; bg: string; border: string; weight: number }[] = [
  { key: 'RED', label: 'RED', bg: 'bg-red-600', border: 'border-red-600', weight: 18 },
  { key: 'GREEN', label: 'GREEN', bg: 'bg-green-700', border: 'border-green-700', weight: 2 },
  { key: 'BLACK', label: 'BLACK', bg: 'bg-black', border: 'border-black', weight: 18 },
];
const rollColor = (): Color => {
  const total = COLORS.reduce((n, c) => n + c.weight, 0);
  let r = Math.random() * total;
  for (const c of COLORS) { if ((r -= c.weight) < 0) return c.key; }
  return 'BLACK';
};
/* Green is the rare pocket (2/38), so the cards that can swing a match most sit
   there. Red and black share the commoner pool. */
const RED_BLACK_POOL: Card[] = ['+1', '+2', 'SKIP', 'SHIELD', 'THUNDERSTORM'];
const GREEN_POOL: Card[] = ['CLUSTER', 'WHIRLPOOL', 'RESURRECTION'];
const anyOf = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Deal the cards sitting in each slot for one spin. Red/black roll independently. */
type SlotCards = Record<Color, Card>;
const dealSlots = (): SlotCards => ({
  RED: anyOf(RED_BLACK_POOL),
  BLACK: anyOf(RED_BLACK_POOL),
  GREEN: anyOf(GREEN_POOL),
});
type BonusStage = 'select' | 'spinning' | 'result';
interface Bonus { who: 'you' | 'foe'; stage: BonusStage; choice: Color | null; result: Color | null; }

const raised =
  'bg-[#c3c3c3] border-2 border-t-white border-l-white border-b-[#5c5c5c] border-r-[#5c5c5c] shadow-[inset_1px_1px_0_#e6e6e6,inset_-1px_-1px_0_#8a8a8a]';
const sunken =
  'bg-[#c3c3c3] border-2 border-t-[#5c5c5c] border-l-[#5c5c5c] border-b-white border-r-white shadow-[inset_-1px_-1px_0_#e6e6e6,inset_1px_1px_0_#8a8a8a]';
const btn98 =
  `${raised} px-5 py-1.5 font-bold text-black text-sm active:border-t-[#5c5c5c] active:border-l-[#5c5c5c] active:border-b-white active:border-r-white select-none disabled:text-[#7a7a7a] disabled:active:border-t-white disabled:active:border-l-white`;

const FLEET = [
  { key: 'carrier', label: 'Carrier', len: 5, src: '/game/ship-carrier.png' },
  { key: 'battleship', label: 'Battleship', len: 4, src: '/game/ship-battleship.png' },
  { key: 'cruiser', label: 'Cruiser', len: 3, src: '/game/ship-cruiser.png' },
  { key: 'submarine', label: 'Submarine', len: 3, src: '/game/ship-submarine.png' },
  { key: 'destroyer', label: 'Destroyer', len: 2, src: '/game/ship-destroyer.png' },
] as const;
type ShipKey = (typeof FLEET)[number]['key'];

interface Placed { key: ShipKey; len: number; row: number; col: number; dir: 'v' | 'h'; }
type Shots = Record<number, 'hit' | 'miss' | 'blocked'>;
type Phase = 'idle' | 'setup' | 'battle' | 'over';

const cellsFor = (s: Placed): number[] =>
  Array.from({ length: s.len }, (_, i) => (s.dir === 'v' ? (s.row + i) * GRID + s.col : s.row * GRID + s.col + i));

const inBounds = (s: Placed): boolean => (s.dir === 'v' ? s.row + s.len <= GRID : s.col + s.len <= GRID) && s.row >= 0 && s.col >= 0;
const overlaps = (s: Placed, others: Placed[]): boolean => {
  const taken = new Set(others.flatMap(cellsFor));
  return cellsFor(s).some((c) => taken.has(c));
};
const fits = (s: Placed, others: Placed[]): boolean => inBounds(s) && !overlaps(s, others);
const clamp = (s: Placed): Placed => ({
  ...s,
  row: Math.min(Math.max(s.row, 0), s.dir === 'v' ? GRID - s.len : GRID - 1),
  col: Math.min(Math.max(s.col, 0), s.dir === 'h' ? GRID - s.len : GRID - 1),
});

const autoPlace = (existing: Placed[]): Placed[] => {
  const placed = [...existing];
  const done = new Set(placed.map((s) => s.key));
  for (const f of FLEET) {
    if (done.has(f.key)) continue;
    for (let attempt = 0; attempt < 500; attempt++) {
      const cand: Placed = {
        key: f.key, len: f.len, dir: Math.random() < 0.5 ? 'v' : 'h',
        row: Math.floor(Math.random() * GRID), col: Math.floor(Math.random() * GRID),
      };
      if (fits(cand, placed)) { placed.push(cand); break; }
    }
  }
  return placed;
};

/** Middle of a boat, in grid coords — used to judge which berth is "nearest". */
const centreOf = (s: Placed) => ({
  r: s.row + (s.dir === 'v' ? (s.len - 1) / 2 : 0),
  c: s.col + (s.dir === 'h' ? (s.len - 1) / 2 : 0),
});

/** Closest legal berth for `ship`, measured from where `from` currently sits.
    Lets a boat turn even when it's boxed in: it relocates rather than refusing. */
const nearestBerth = (ship: Placed, others: Placed[], from: Placed): Placed | null => {
  const target = centreOf(from);
  let best: Placed | null = null;
  let bestDist = Infinity;
  for (let row = 0; row < GRID; row++)
    for (let col = 0; col < GRID; col++) {
      const cand: Placed = { ...ship, row, col };
      if (!fits(cand, others)) continue;
      const c = centreOf(cand);
      const dist = (c.r - target.r) ** 2 + (c.c - target.c) ** 2;
      if (dist < bestDist) { bestDist = dist; best = cand; }
    }
  return best;
};

const boatsRemaining = (fleet: Placed[], shots: Shots): number =>
  fleet.filter((s) => !cellsFor(s).every((c) => shots[c] === 'hit')).length;
const sunkShips = (fleet: Placed[], shots: Shots): Placed[] =>
  fleet.filter((s) => cellsFor(s).every((c) => shots[c] === 'hit'));
const didSink = (fleet: Placed[], shotsAfter: Shots, idx: number): boolean => {
  const ship = fleet.find((s) => cellsFor(s).includes(idx));
  return !!ship && cellsFor(ship).every((c) => shotsAfter[c] === 'hit');
};
/* Turn ladder. Everyone gets 5 shots for the whole match — as boats go down the
   pressure comes from the shrinking clock, not from a smaller volley. */
const stageFor = (minBoats: number): { shots: number; secs: number } =>
  ({ shots: 5, secs: minBoats <= 1 ? 10 : minBoats === 2 ? 15 : 20 });

/** `count` distinct random centres among cells nobody has fired at yet. */
const randomCentres = (shots: Shots, count: number): number[] => {
  const open = Array.from({ length: GRID * GRID }, (_, i) => i).filter((i) => shots[i] === undefined);
  const picked: number[] = [];
  for (let n = 0; n < count && open.length; n++) {
    picked.push(...open.splice(Math.floor(Math.random() * open.length), 1));
  }
  return picked;
};

/** Square of side `size` centred on idx, clipped to the board. */
const blockAround = (idx: number, size: number): number[] => {
  const r0 = Math.floor(idx / GRID), c0 = idx % GRID, half = Math.floor(size / 2);
  const out: number[] = [];
  for (let r = r0 - half; r <= r0 + half; r++)
    for (let c = c0 - half; c <= c0 + half; c++)
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) out.push(r * GRID + c);
  return out;
};

/* ---------- resurrection ----------
   Raises the SMALLEST boat you've lost. It can't be steered: the card drops it
   on a random berth that is clear of your other boats and of every cell the
   enemy has already fired at, so it can't come back pre-damaged or onto ground
   they've already ruled out. */
const sunkSmallest = (fleet: Placed[], shots: Shots): Placed | null => {
  const down = sunkShips(fleet, shots);
  if (!down.length) return null;
  return down.reduce((a, b) => (b.len < a.len ? b : a));
};

const resurrectionBerth = (ship: Placed, fleet: Placed[], shots: Shots): Placed | null => {
  const others = fleet.filter((s) => s.key !== ship.key);
  const berths: Placed[] = [];
  for (const dir of ['v', 'h'] as const)
    for (let row = 0; row < GRID; row++)
      for (let col = 0; col < GRID; col++) {
        const cand: Placed = { ...ship, row, col, dir };
        if (!fits(cand, others)) continue;
        if (cellsFor(cand).some((c) => shots[c] !== undefined)) continue;   // no pre-damaged spawn
        berths.push(cand);
      }
  return berths.length ? anyOf(berths) : null;
};

/* ---------- opponent targeting ----------
   The stand-in foe plays the way a person does: hunt for a lead, then work it
   until the ship goes down.

   Everything is derived from the board on each shot rather than tracked in a
   running queue, so the opponent can't drift out of sync with the real state —
   it re-reads the situation every time and picks up mid-game from any position.

   Fairness: it reads which of ITS OWN hits belong to a ship that has already
   sunk, which is exactly what "you sank my battleship" tells a human. It never
   looks at cells it hasn't fired on. */

/** The up-to-four orthogonal neighbours of a cell, clipped to the board. */
const orthogonal = (idx: number): number[] => {
  const r = Math.floor(idx / GRID), c = idx % GRID;
  const out: number[] = [];
  if (r > 0) out.push(idx - GRID);
  if (r < GRID - 1) out.push(idx + GRID);
  if (c > 0) out.push(idx - 1);
  if (c < GRID - 1) out.push(idx + 1);
  return out;
};

/** Flood-fill the run of connected hits containing `start`. */
const runOfHits = (start: number, pool: Set<number>): number[] => {
  const seen = new Set([start]);
  const stack = [start];
  const out: number[] = [];
  while (stack.length) {
    const cur = stack.pop()!;
    out.push(cur);
    for (const n of orthogonal(cur)) if (pool.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
  }
  return out;
};

const pickOne = (xs: number[]): number => xs[Math.floor(Math.random() * xs.length)];

/** Where the opponent fires next, or null if the board is exhausted. */
const foeTarget = (fleet: Placed[], shots: Shots, ghosts: Set<number> = new Set()): number | null => {
  const isOpen = (i: number) => shots[i] === undefined;
  // `ghosts` are hits on a boat that has since been raised elsewhere — the wreck
  // is still on the board but there's nothing left there to finish off, so they
  // must not read as live leads or the opponent works them forever.
  const downed = new Set([...sunkShips(fleet, shots).flatMap(cellsFor), ...ghosts]);
  // Hits on ships still afloat — the live leads worth chasing.
  const leads = new Set(
    Object.keys(shots).map(Number).filter((i) => shots[i] === 'hit' && !downed.has(i)),
  );

  // TARGET — finish what we started before looking anywhere else.
  const done = new Set<number>();
  for (const lead of leads) {
    if (done.has(lead)) continue;
    const run = runOfHits(lead, leads);
    run.forEach((c) => done.add(c));

    const rows = new Set(run.map((c) => Math.floor(c / GRID)));
    const cols = new Set(run.map((c) => c % GRID));
    let candidates: number[];

    if (run.length > 1 && rows.size === 1) {
      // Two hits in a row means the ship lies flat: press on past either end.
      const row = Math.floor(run[0] / GRID);
      const cs = run.map((c) => c % GRID).sort((a, b) => a - b);
      candidates = [];
      if (cs[0] > 0) candidates.push(row * GRID + cs[0] - 1);
      if (cs[cs.length - 1] < GRID - 1) candidates.push(row * GRID + cs[cs.length - 1] + 1);
    } else if (run.length > 1 && cols.size === 1) {
      const col = run[0] % GRID;
      const rs = run.map((c) => Math.floor(c / GRID)).sort((a, b) => a - b);
      candidates = [];
      if (rs[0] > 0) candidates.push((rs[0] - 1) * GRID + col);
      if (rs[rs.length - 1] < GRID - 1) candidates.push((rs[rs.length - 1] + 1) * GRID + col);
    } else {
      // A single hit gives no direction yet, so probe all four sides. An L-shaped
      // run means two ships are touching, and the same probe untangles it.
      candidates = run.flatMap(orthogonal);
    }

    const usable = candidates.filter(isOpen);
    if (usable.length) return pickOne(usable);
    // Ship is boxed in by earlier shots — try the next lead instead.
  }

  // HUNT — no live leads, so go looking. Firing only on one colour of a
  // checkerboard halves the search without ever missing a ship, since the
  // shortest boat is 2 cells and must cover both colours.
  const open = Array.from({ length: GRID * GRID }, (_, i) => i).filter(isOpen);
  if (!open.length) return null;
  const checker = open.filter((i) => (Math.floor(i / GRID) + (i % GRID)) % 2 === 0);
  return pickOne(checker.length ? checker : open);
};

/** Cells covered by a shield anchored at its top-left corner. */
const shieldCells = (row: number, col: number): number[] => {
  const out: number[] = [];
  for (let r = row; r < row + SHIELD_SIZE; r++)
    for (let c = col; c < col + SHIELD_SIZE; c++) out.push(r * GRID + c);
  return out;
};
/** Keep a shield fully on the board. */
const clampShield = (row: number, col: number) => ({
  row: Math.min(Math.max(row, 0), GRID - SHIELD_SIZE),
  col: Math.min(Math.max(col, 0), GRID - SHIELD_SIZE),
});

/** The 5×5 a Cluster hits, centred where the player aimed. */
const clusterCells = (idx: number): number[] => blockAround(idx, CLUSTER_SIZE);

/* ---------- 7-segment clock ---------- */
const SEG: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abfgcd',
};
const SEG_RECTS: Record<string, [number, number, number, number]> = {
  a: [2, 0, 8, 2], b: [10, 1.5, 2, 7.5], c: [10, 11, 2, 7.5], d: [2, 18, 8, 2],
  e: [0, 11, 2, 7.5], f: [0, 1.5, 2, 7.5], g: [2, 9, 8, 2],
};
const Digit = ({ ch, on }: { ch: string; on: boolean }) => (
  <svg viewBox="0 0 12 20" className="h-full w-auto" style={{ transform: 'skewX(-4deg)' }}>
    {Object.entries(SEG_RECTS).map(([seg, [x, y, w, h]]) => {
      const lit = on && SEG[ch]?.includes(seg);
      return <rect key={seg} x={x} y={y} width={w} height={h} rx={0.6}
        fill={lit ? '#ff2222' : '#3a0f0f'} style={lit ? { filter: 'drop-shadow(0 0 2px #ff2222)' } : undefined} />;
    })}
  </svg>
);
const SegClock = ({ seconds, on }: { seconds: number; on: boolean }) => {
  const m = Math.max(0, Math.floor(seconds / 60));
  const s = Math.max(0, seconds % 60);
  const str = `${m}${String(s).padStart(2, '0')}`;
  return (
    <div className="flex items-center justify-center gap-[3px] h-12 py-1">
      <Digit ch={str[0]} on={on} />
      <div className="flex flex-col justify-center gap-1.5 h-full px-[1px]">
        {[0, 1].map((i) => <span key={i} className="block w-1 h-1" style={{ background: on ? '#ff2222' : '#3a0f0f', filter: on ? 'drop-shadow(0 0 2px #ff2222)' : undefined }} />)}
      </div>
      <Digit ch={str[1]} on={on} />
      <Digit ch={str[2]} on={on} />
    </div>
  );
};
/** M and V have no faithful 7-segment form, so words render as glowing text. */
const SegWord = ({ word, flash }: { word: string; flash?: boolean }) => (
  <span className="font-mono font-bold text-[#ff2222] text-2xl tracking-[0.15em] select-none"
    style={{
      transform: 'skewX(-4deg)',
      fontSize: 'clamp(1.25rem, 2.1vw, 2rem)',
      textShadow: '0 0 6px rgba(255,34,34,0.85)',
      animation: flash ? 'bcFlash 0.9s steps(1,end) infinite' : undefined,
    }}>{word}</span>
);

/* One rocket per shot still in hand. Spent ones are removed rather than dimmed:
   a greyed-out rocket was darker than a live one and read as decoration, so the
   row looked identical whether you had five shots or one — and a card handing you
   extra shots didn't visibly change anything either. */
const Missile = () => (
  <svg viewBox="0 0 24 8" className="h-4 w-12">
    <g fill="#7d7d7d">
      <polygon points="0,0 3,2 3,6 0,8" />
      <rect x="3" y="2" width="12" height="4" />
      <polygon points="15,0.5 23,4 15,7.5" />
    </g>
  </svg>
);

/* draggable={false} is load-bearing: without it a mouse drag on the boat starts
   the browser's own image drag-and-drop, which swallows the pointer stream and
   makes boats immovable on desktop. Touch has no native image drag, so only
   desktop was broken. */
const ShipImg = ({ s }: { s: Placed }) => (
  <img src={FLEET.find((f) => f.key === s.key)!.src} alt={s.key} draggable={false}
    className="absolute object-fill select-none"
    style={s.dir === 'v'
      ? { inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', WebkitUserDrag: 'none' } as React.CSSProperties
      : { left: '50%', top: '50%', width: `${100 / s.len}%`, height: `${s.len * 100}%`, transform: 'translate(-50%, -50%) rotate(90deg)', imageRendering: 'pixelated', WebkitUserDrag: 'none' } as React.CSSProperties} />
);

/** Full-screen flash in the console's readout voice, for announcing a beat. */
const Callout = ({ text }: { text: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
    <div className={`${raised} p-2`}>
      <div className={`${sunken} px-6 py-4 md:px-10 md:py-6`} style={{ backgroundColor: '#1b1b1b' }}>
        <span
          className="font-mono font-bold text-[#ff2222] tracking-[0.15em] select-none whitespace-nowrap"
          style={{
            fontSize: 'clamp(1.1rem, 4.5vw, 2.75rem)',
            textShadow: '0 0 10px rgba(255,34,34,0.85)',
            animation: 'bcFlash 0.7s steps(1,end) infinite',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  </div>
);

/** `onArt` for the title screen, where muted grey text vanishes into the ocean. */
const Footer = ({ onArt = false }: { onArt?: boolean }) => (
  <div
    className={`text-center font-mono text-[11px] select-none pt-4 pb-1 ${onArt ? 'text-white' : 'text-black/50'}`}
    style={onArt ? { textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)' } : undefined}
  >
    © 2026 Lucky Jack Games
  </div>
);

/* ---------- action-card rack (outside edge of each grid) ---------- */
/** Horizontal card strip that sits UNDER a grid, so the boards get the full width. */
const Rack = ({ cards, playable, onPlay, label, blocked }: {
  cards: CardInst[]; playable: boolean; onPlay?: (i: number) => void; label?: string;
  /** Reason this card can't be played right now, shown across its face. */
  blocked?: (c: CardInst) => string | null;
}) => (
  <div className={`${raised} p-1.5`}>
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-black/70 shrink-0 leading-tight">
        {label ? label.split(' ').map((w, i) => <React.Fragment key={i}>{w}{i === 0 ? <br /> : null}</React.Fragment>) : <>ACTION<br />CARDS</>}
      </span>
      <div className={`${sunken} flex-1 flex items-center gap-1.5 p-1 min-h-[76px] md:min-h-[92px] overflow-x-auto`}>
        {cards.map((c, i) => {
          const info = CARD_INFO[c.type];
          const art = cardArt(c);
          const stop = blocked?.(c) ?? null;
          const live = playable && !stop;
          return (
            <button
              key={i}
              onClick={() => live && onPlay?.(i)}
              disabled={!live}
              title={stop ? `${info.name} — ${stop}` : `${info.name} (${info.label}) — ${info.blurb}`}
              className={`shrink-0 relative ${live ? 'cursor-pointer hover:brightness-110 hover:-translate-y-0.5' : 'cursor-default'} transition-transform`}
            >
              <div className={stop ? 'grayscale opacity-50' : ''}>
                {art
                  ? <img src={art} alt={info.name} className="h-[68px] md:h-[84px] w-auto border border-black/50" style={{ imageRendering: 'pixelated' }} />
                  : (
                    <div className={`${info.cls} text-white font-bold text-[11px] px-3 h-[68px] md:h-[84px] flex items-center justify-center border border-black/40`}>
                      {info.label}
                    </div>
                  )}
              </div>
              {stop && (
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[9px] md:text-[10px] text-white text-center leading-tight px-1"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.95)' }}>
                  {stop}
                </span>
              )}
            </button>
          );
        })}
        {cards.length === 0 && <span className="text-[10px] text-black/35 font-mono px-2">empty</span>}
      </div>
    </div>
  </div>
);

/* ---------- board ---------- */
const Board = ({ title, right, ships, showShips, sunk, shots, clickable, outlined, pulse, onCell, animating, crosshair,
                arrangeable, selected, onSelect, onShipMove, onRotate, shieldGhost, onShieldMove }: {
  title: string; right: string; ships: Placed[]; showShips: boolean; sunk: Placed[]; shots: Shots;
  clickable: boolean; outlined: boolean; pulse?: boolean;
  onCell?: (idx: number) => void;
  animating?: Record<number, true>;
  crosshair?: boolean;
  /* setup only: every boat can be picked up, moved and turned */
  arrangeable?: boolean; selected?: ShipKey | null;
  onSelect?: (key: ShipKey) => void;
  onShipMove?: (key: ShipKey, row: number, col: number) => void;
  onRotate?: () => void;
  /* shield placement: the translucent square you drag over your own water */
  shieldGhost?: { row: number; col: number } | null;
  onShieldMove?: (row: number, col: number) => void;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ key: ShipKey; dr: number; dc: number } | null>(null);
  const cellFromPointer = (e: React.PointerEvent) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      row: Math.floor(((e.clientY - rect.top) / rect.height) * GRID),
      col: Math.floor(((e.clientX - rect.left) / rect.width) * GRID),
    };
  };

  return (
    <div
      className={`${raised} p-1.5 ${outlined ? 'outline outline-[3px] outline-[#f2c320]' : ''}`}
      // Same breathing outline the boat you're placing gets, so one rule holds all
      // game long: if it's pulsing, that's the board you act on.
      style={pulse ? { animation: 'bcPulse 1.8s ease-in-out infinite' } : undefined}
    >
      <div className="flex items-center justify-between px-2 py-1.5 font-mono text-[13px] text-black">
        <span>{title}</span>
        <span>{right}</span>
      </div>
      <div className={`${sunken} p-1`}>
        <div ref={gridRef} className="relative" style={{ backgroundImage: "url('/game/ocean.gif')", backgroundSize: 'cover', imageRendering: 'pixelated' }}>
          <div className="grid grid-cols-10">
            {Array.from({ length: GRID * GRID }, (_, i) => (
              <button key={i} onClick={() => onCell?.(i)} disabled={!clickable || shots[i] !== undefined}
                className={`aspect-square border border-white/60 bg-transparent ${clickable && shots[i] === undefined ? `hover:bg-white/25 ${crosshair ? 'cursor-crosshair' : 'cursor-pointer'}` : 'cursor-default'}`} />
            ))}
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {(showShips ? ships : sunk).map((s) => {
              const box = {
                left: `${s.col * 10}%`, top: `${s.row * 10}%`,
                width: `${(s.dir === 'h' ? s.len : 1) * 10}%`, height: `${(s.dir === 'v' ? s.len : 1) * 10}%`,
              };
              if (!arrangeable) return <div key={s.key} className="absolute" style={box}><ShipImg s={s} /></div>;
              const isSel = selected === s.key;
              return (
                <div
                  key={s.key}
                  data-boat={s.key}
                  className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing ${isSel ? 'outline outline-[3px] z-10' : ''}`}
                  style={{
                    ...box,
                    touchAction: 'none',
                    // Picked-up boats breathe from invisible to neon yellow, which
                    // reads differently from the steady board outlines.
                    animation: isSel ? 'bcSelect 1.3s ease-in-out infinite' : undefined,
                  }}
                  // Grabbing a boat selects it, so pointing at one and moving it are
                  // the same gesture — there's no separate "select first" step.
                  onPointerDown={(e) => {
                    onSelect?.(s.key);
                    const c = cellFromPointer(e);
                    if (!c) return;
                    drag.current = { key: s.key, dr: c.row - s.row, dc: c.col - s.col };
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d || d.key !== s.key) return;
                    const c = cellFromPointer(e);
                    if (c) onShipMove?.(s.key, c.row - d.dr, c.col - d.dc);
                  }}
                  onPointerUp={() => { drag.current = null; }}
                  onPointerCancel={() => { drag.current = null; }}
                >
                  <ShipImg s={s} />
                </div>
              );
            })}

            {shieldGhost && (
              <div
                className="absolute pointer-events-auto cursor-grab active:cursor-grabbing outline outline-[3px] z-30"
                style={{
                  left: `${shieldGhost.col * 10}%`, top: `${shieldGhost.row * 10}%`,
                  width: `${SHIELD_SIZE * 10}%`, height: `${SHIELD_SIZE * 10}%`,
                  background: 'rgba(0, 209, 255, 0.25)',   // 75% transparent neon blue
                  touchAction: 'none',
                  animation: 'bcShield 1.2s ease-in-out infinite',
                }}
                onPointerDown={(e) => {
                  const c = cellFromPointer(e);
                  if (!c) return;
                  drag.current = { key: 'carrier', dr: c.row - shieldGhost.row, dc: c.col - shieldGhost.col };
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d) return;
                  const c = cellFromPointer(e);
                  if (c) onShieldMove?.(c.row - d.dr, c.col - d.dc);
                }}
                onPointerUp={() => { drag.current = null; }}
                onPointerCancel={() => { drag.current = null; }}
              />
            )}

            {/* The turn-wheel rides the selected boat's top-right corner, so what it
                will rotate is never in question. */}
            {arrangeable && (() => {
              const s = ships.find((b) => b.key === selected);
              if (!s) return null;
              return (
                <button
                  onClick={() => onRotate?.()}
                  title="Turn boat" aria-label="Turn boat"
                  className={`${raised} absolute pointer-events-auto z-20 flex items-center justify-center h-7 w-7 md:h-8 md:w-8 active:border-t-[#5c5c5c] active:border-l-[#5c5c5c] active:border-b-white active:border-r-white`}
                  style={{
                    left: `${(s.col + (s.dir === 'h' ? s.len : 1)) * 10}%`,
                    top: `${s.row * 10}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <RotateCw className="h-4 w-4 md:h-5 md:w-5 text-black" strokeWidth={2.5} />
                </button>
              );
            })()}
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {Object.entries(shots).map(([idx, kind]) => {
              const i = Number(idx);
              return (
                <div key={idx} className="absolute flex items-center justify-center"
                  style={{ left: `${(i % GRID) * 10}%`, top: `${Math.floor(i / GRID) * 10}%`, width: '10%', height: '10%' }}>
                  {kind === 'blocked'
                    ? <span className="block w-full h-full rounded-full" style={{ animation: 'bcBlueBurst 900ms ease-out forwards' }} />
                    : kind === 'hit'
                    ? (animating?.[i]
                        ? <img src={`/game/explosion.gif?c=${i}`} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                        : <span className="text-[3.2vmin] lg:text-2xl leading-none select-none">💥</span>)
                    : <span className="font-black text-red-600 text-[3vmin] lg:text-2xl leading-none select-none" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.4)' }}>X</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- page ---------- */
const BattleChips = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [yourFleet, setYourFleet] = useState<Placed[]>([]);
  const [selected, setSelected] = useState<ShipKey | null>(null);   // boat being arranged
  const [showPlacePrompt, setShowPlacePrompt] = useState(false);
  const [showBegin, setShowBegin] = useState(false);
  const [waitingDone, setWaitingDone] = useState(false);
  const [foeFleet, setFoeFleet] = useState<Placed[]>([]);
  const [yourShots, setYourShots] = useState<Shots>({});
  const [foeShots, setFoeShots] = useState<Shots>({});
  const [turn, setTurn] = useState<'you' | 'foe'>('you');
  const [shotsLeft, setShotsLeft] = useState(5);   // ACTIVE player's remaining shots
  const [clock, setClock] = useState(SETUP_SECONDS);
  const [winner, setWinner] = useState<'you' | 'foe' | null>(null);
  const [anim, setAnim] = useState<{ you: Record<number, true>; foe: Record<number, true> }>({ you: {}, foe: {} });
  const [bonus, setBonus] = useState<Bonus | null>(null);
  const [slots, setSlots] = useState<SlotCards>(dealSlots);
  const [cards, setCards] = useState<{ you: CardInst[]; foe: CardInst[] }>({ you: [], foe: [] });
  const [wheelAngle, setWheelAngle] = useState(0);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [showFoeSpin, setShowFoeSpin] = useState(false);   // "OPPONENT'S SPIN" banner
  const [showForfeit, setShowForfeit] = useState(false);
  const [clusterArmed, setClusterArmed] = useState(false);   // one-time 5x5, no stacking
  const [skipFoeTurn, setSkipFoeTurn] = useState(false);     // Skip card, no stacking
  const [foePlayed, setFoePlayed] = useState<string | null>(null);  // "ENEMY PLAYS …" flash
  /* Shield: `placing` is the ghost you're dragging, `shield` is the locked
     position. Once locked it renders nothing at all — it's meant to be invisible
     to both sides — and it lifts at the end of the next enemy turn. */
  const [shieldPlacing, setShieldPlacing] = useState<{ row: number; col: number } | null>(null);
  const [shield, setShield] = useState<{ row: number; col: number } | null>(null);
  const [shieldHit, setShieldHit] = useState(false);
  const shieldRef = useRef<{ row: number; col: number } | null>(null);
  /* Mirrors of the two armed flags for the opponent. Refs, not state: the fire
     loop reads them from inside an interval that would otherwise close over a
     stale value. */
  const foeClusterRef = useRef(false);
  /** Hits on boats that have since been resurrected elsewhere. */
  const ghostHitsRef = useRef<Set<number>>(new Set());
  const skipYourTurnRef = useRef(false);
  const [turnSeq, setTurnSeq] = useState(0);   // ticks on every turn start, incl. repeats

  const endTurnAfterBonus = useRef(false);
  // Their turn can also run out mid-sink; hand back only once the spin has played.
  const foeEndTurnAfterBonus = useRef(false);
  const foeSpinResult = useRef<Color | null>(null);
  const foeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oppDoneRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foeShotsRef = useRef<Shots>({});
  useEffect(() => { foeShotsRef.current = foeShots; }, [foeShots]);

  const yourBoats = boatsRemaining(yourFleet, foeShots);
  const foeBoats = phase === 'battle' || phase === 'over' ? boatsRemaining(foeFleet, yourShots) : FLEET.length;

  const arranging = phase === 'setup' && !waitingDone;
  const inGame = phase === 'setup' || phase === 'battle';

  const playExplosion = (board: 'you' | 'foe', idx: number) => {
    setAnim((prev) => ({ ...prev, [board]: { ...prev[board], [idx]: true as const } }));
    setTimeout(() => {
      setAnim((prev) => { const c = { ...prev[board] }; delete c[idx]; return { ...prev, [board]: c }; });
    }, EXPLOSION_MS);
  };

  const resetTo = (to: Phase) => {
    if (oppDoneRef.current) clearTimeout(oppDoneRef.current);
    if (foeTimerRef.current) clearInterval(foeTimerRef.current);
    setPhase(to); setYourFleet([]); setSelected(null); setWaitingDone(false);
    setFoeFleet([]); setYourShots({}); setFoeShots({}); setTurn('you'); setShotsLeft(5);
    setClock(SETUP_SECONDS); setWinner(null); setAnim({ you: {}, foe: {} });
    setBonus(null); setCards({ you: [], foe: [] });
    setShowBonusPopup(false); setShowFoeSpin(false); setShowForfeit(false);
    setShowPlacePrompt(false); setShowBegin(false); setClusterArmed(false); setSkipFoeTurn(false);
    setFoePlayed(null); setTurnSeq(0);
    foeClusterRef.current = false;
    skipYourTurnRef.current = false;
    ghostHitsRef.current = new Set();
    setShieldPlacing(null); setShield(null); setShieldHit(false);
    shieldRef.current = null;
    endTurnAfterBonus.current = false;
    foeEndTurnAfterBonus.current = false;
    foeSpinResult.current = null;
    if (to === 'setup') {
      // The whole fleet is on the board from the first frame, already legal, with
      // the Carrier picked out so the turn-wheel has something to act on.
      setYourFleet(autoPlace([]));
      setSelected(FLEET[0].key);
      setShowPlacePrompt(true);
      setTimeout(() => setShowPlacePrompt(false), CALLOUT_MS);
    }
  };
  const newMatch = () => resetTo('setup');

  const beginBattle = (arranged: Placed[]) => {
    if (oppDoneRef.current) clearTimeout(oppDoneRef.current);
    const mine = autoPlace(arranged);   // no-op once all five are down
    setYourFleet(mine); setSelected(null); setWaitingDone(false);
    setFoeFleet(autoPlace([]));
    const stage = stageFor(FLEET.length);
    setPhase('battle'); setTurn('you'); setShotsLeft(stage.shots); setClock(stage.secs);
    playSfx(SFX.start);
    setShowBegin(true);
    setTimeout(() => setShowBegin(false), CALLOUT_MS);
  };

  const startTurn = (who: 'you' | 'foe', yFleet: Placed[], fFleet: Placed[], yShots: Shots, fShots: Shots) => {
    const stage = stageFor(Math.min(boatsRemaining(yFleet, fShots), boatsRemaining(fFleet, yShots)));
    setTurn(who); setShotsLeft(stage.shots); setClock(stage.secs);
    // A Skip can hand the same side two turns running, where `turn` never changes
    // — this counter still moves, so "new turn" logic fires either way.
    setTurnSeq((n) => n + 1);
  };

  /** Hand back after their turn — unless THEY banked a Skip, which eats yours. */
  const handBack = (yShots: Shots, fShots: Shots) => {
    // One enemy turn is the whole life of a shield. Cells it swallowed become
    // ordinary open water again rather than staying permanently immune.
    if (shieldRef.current) {
      shieldRef.current = null;
      setShield(null);
      const cleared: Shots = { ...fShots };
      for (const c of Object.keys(cleared).map(Number)) if (cleared[c] === 'blocked') delete cleared[c];
      fShots = cleared;
      foeShotsRef.current = cleared;
      setFoeShots(cleared);
    }
    if (skipYourTurnRef.current) {
      skipYourTurnRef.current = false;
      startTurn('foe', yourFleet, foeFleet, yShots, fShots);
    } else {
      startTurn('you', yourFleet, foeFleet, yShots, fShots);
    }
  };

  /** Hand over after your turn — unless a Skip card is banked, which eats theirs. */
  const handOver = (yShots: Shots, fShots: Shots) => {
    if (skipFoeTurn) {
      setSkipFoeTurn(false);
      startTurn('you', yourFleet, foeFleet, yShots, fShots);
    } else {
      startTurn('foe', yourFleet, foeFleet, yShots, fShots);
    }
  };

  useEffect(() => { preloadSfx(); }, []);

  /* countdown beeps: last 3s of setup and of every turn */
  useEffect(() => {
    if ((phase === 'setup' || phase === 'battle') && !bonus && !showForfeit && clock >= 1 && clock <= 3) playSfx(SFX.countdown);
  }, [clock, phase, bonus, showForfeit]);

  /* master clock — frozen during a bonus or the forfeit prompt */
  useEffect(() => {
    if (phase === 'idle' || phase === 'over' || bonus || showForfeit) return;
    const id = setInterval(() => setClock((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [phase, turn, bonus, showForfeit]);

  /* clock expiry */
  useEffect(() => {
    if (clock > 0 || phase === 'idle' || phase === 'over' || bonus || showForfeit) return;
    if (phase === 'setup') { beginBattle(yourFleet); return; }
    if (phase === 'battle') {
      // A shield still being dragged when the clock dies locks where it stands,
      // the same way an unplaced boat auto-deploys at the end of setup.
      if (shieldPlacing) { setShield(shieldPlacing); shieldRef.current = shieldPlacing; setShieldPlacing(null); }
      if (turn === 'you') handOver(yourShots, foeShots);
      else handBack(yourShots, foeShots);
    }
  }, [clock]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The opponent spends its hand at the top of its turn, and the play is announced
     — a card vanishing from their rack with no explanation would be exactly the
     invisible mechanic the bonus spin used to be.

     Policy: every +1/+2 gets played, since more shots is never worse. Cluster and
     Skip are armed flags that don't stack, so only one of each is worth spending
     and the rest stay in hand for later turns. */
  useEffect(() => {
    if (phase !== 'battle' || turn !== 'foe' || bonus || showForfeit || foePlayed) return;
    if (!cards.foe.length) return;

    const keep: CardInst[] = [];
    const play: CardInst[] = [];
    let tookCluster = false, tookSkip = false;
    for (const c of cards.foe) {
      if (c.type === 'CLUSTER' && tookCluster) { keep.push(c); continue; }
      if (c.type === 'SKIP' && tookSkip) { keep.push(c); continue; }
      if (c.type === 'CLUSTER') tookCluster = true;
      if (c.type === 'SKIP') tookSkip = true;
      play.push(c);
    }
    if (!play.length) return;

    let extra = 0;
    for (const c of play) {
      if (c.type === '+1') extra += 1;
      else if (c.type === '+2') extra += 2;
      else if (c.type === 'CLUSTER') foeClusterRef.current = true;
      else if (c.type === 'SKIP') skipYourTurnRef.current = true;
    }
    if (extra) setShotsLeft((s) => s + extra);
    setCards((c) => ({ ...c, foe: keep }));
    playSfx(SFX.selected);
    setFoePlayed(play.map((c) => CARD_INFO[c.type].name).join(' + '));
    setTimeout(() => setFoePlayed(null), FOE_CARD_MS);
  }, [turnSeq, phase, turn, bonus, showForfeit]); // eslint-disable-line react-hooks/exhaustive-deps

  /* stand-in opponent: fires once a second (see foeTarget for how it aims),
     decrementing the shared shot counter so the rocket row reflects THEIR
     remaining shots too */
  useEffect(() => {
    if (phase !== 'battle' || turn !== 'foe' || showForfeit || bonus || foePlayed) return;
    foeTimerRef.current = setInterval(() => {
      const prev = foeShotsRef.current;
      const target = foeTarget(yourFleet, prev, ghostHitsRef.current);
      if (target === null) return;

      // An armed Cluster turns their shot into a 5x5 blast, same as yours.
      const area = foeClusterRef.current ? clusterCells(target) : [target];
      if (foeClusterRef.current) foeClusterRef.current = false;
      const fresh = area.filter((i) => prev[i] === undefined);
      const yourCells = new Set(yourFleet.flatMap(cellsFor));
      const guarded = shieldRef.current
        ? new Set(shieldCells(shieldRef.current.row, shieldRef.current.col))
        : new Set<number>();
      const next: Shots = { ...prev };
      let isHit = false, stopped = false;
      for (const i of fresh) {
        // A shielded cell swallows the shot: no explosion, no red X, nothing on
        // the board at all — just the blue burst and the SHIELD HIT! flash.
        if (guarded.has(i)) { next[i] = 'blocked'; stopped = true; continue; }
        const hit = yourCells.has(i);
        next[i] = hit ? 'hit' : 'miss';
        if (hit) { isHit = true; playExplosion('you', i); }
      }
      if (stopped) {
        setShieldHit(true);
        setTimeout(() => setShieldHit(false), SHIELD_HIT_MS);
      }
      foeShotsRef.current = next;
      setFoeShots(next);
      const sank = fresh.some((i) => next[i] === 'hit' && didSink(yourFleet, next, i));
      if (isHit) playSfx(sank ? SFX.sunk : SFX.hit);
      else if (!stopped) playSfx(SFX.miss);
      // Sinking one of your ships earns them a spin, which now plays out on screen
      // instead of resolving offstage — no spin if that shot ended the match.
      const wiped = boatsRemaining(yourFleet, next) === 0;
      if (sank && !wiped) {
        setSlots(dealSlots());
        setBonus({ who: 'foe', stage: 'select', choice: COLORS[Math.floor(Math.random() * COLORS.length)].key, result: null });
        setShowFoeSpin(true);
        playSfx(SFX.bonus);
        // Setting bonus tears down this interval; the foe-spin effect drives it
        // from here and restarts their turn afterwards.
      }
      setShotsLeft((sl) => {
        const left = sl - 1;
        if (wiped) { setWinner('foe'); setPhase('over'); return 0; }
        if (left <= 0) {
          // Defer the handover past the spin, or the turn would flip mid-wheel.
          if (sank) foeEndTurnAfterBonus.current = true;
          else setTimeout(() => handBack(yourShots, next), 700);
        }
        return Math.max(0, left);
      });
    }, 1000);
    return () => { if (foeTimerRef.current) clearInterval(foeTimerRef.current); };
  }, [phase, turn, showForfeit, bonus, foePlayed]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The opponent's spin, played out rather than resolved offstage: announce it,
     turn the wheel, show where it landed, then give them their turn back. Same
     three stages as chooseColor(), just with their call made for them. */
  useEffect(() => {
    if (bonus?.who !== 'foe') return;

    if (bonus.stage === 'select') {
      const id = setTimeout(() => {
        setShowFoeSpin(false);
        foeSpinResult.current = rollColor();
        setWheelAngle((a) => a + 360 * 6 + Math.floor(Math.random() * 360));
        setBonus((b) => (b?.who === 'foe' ? { ...b, stage: 'spinning' } : b));
      }, FOE_ANNOUNCE_MS);
      return () => clearTimeout(id);
    }

    if (bonus.stage === 'spinning') {
      const id = setTimeout(() => {
        const landed = foeSpinResult.current!;
        playSfx(SFX.highlight);
        setBonus((b) => (b?.who === 'foe' ? { ...b, stage: 'result', result: landed } : b));
        // Their call was locked in before the spin; a wrong one hands you the card.
        const won: CardInst = { type: slots[landed], color: landed };
        setCards((c) => (landed === bonus.choice
          ? { ...c, foe: [...c.foe, won] }
          : { ...c, you: [...c.you, won] }));
      }, SPIN_MS);
      return () => clearTimeout(id);
    }

    const id = setTimeout(() => {
      setBonus(null);
      if (foeEndTurnAfterBonus.current) {
        foeEndTurnAfterBonus.current = false;
        handBack(yourShots, foeShotsRef.current);
      }
      // Otherwise their shots aren't spent: clearing bonus restarts their fire loop.
    }, RESULT_MS);
    return () => clearTimeout(id);
  }, [bonus]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- setup ----
     The fleet is complete and legal from the first frame; arranging it is just
     nudging boats around. Every move is validated against the OTHER four, so an
     illegal drag is simply refused and nothing can ever end up overlapping. */

  /** Apply a change to one boat, keeping it on the board and clear of the rest. */
  const reshape = (key: ShipKey, change: (s: Placed) => Placed) => {
    if (!arranging) return;
    setYourFleet((fleet) => {
      const ship = fleet.find((s) => s.key === key);
      if (!ship) return fleet;
      const moved = clamp(change(ship));
      const others = fleet.filter((s) => s.key !== key);
      if (!fits(moved, others)) return fleet;
      return fleet.map((s) => (s.key === key ? moved : s));
    });
  };

  const selectShip = (key: ShipKey) => { if (arranging) setSelected(key); };
  const moveShip = (key: ShipKey, row: number, col: number) => reshape(key, (s) => ({ ...s, row, col }));
  /* Turning is never refused. If the boat can't swing where it stands it slides to
     the closest berth that takes it, so the button always does something. */
  const rotateSelected = () => {
    if (!arranging || !selected) return;
    setYourFleet((fleet) => {
      const ship = fleet.find((s) => s.key === selected);
      if (!ship) return fleet;
      const others = fleet.filter((s) => s.key !== selected);
      const turned = clamp({ ...ship, dir: ship.dir === 'v' ? 'h' : 'v' });
      const berth = fits(turned, others) ? turned : nearestBerth(turned, others, ship);
      if (!berth) return fleet;   // no room anywhere, which five boats can't cause
      return fleet.map((s) => (s.key === selected ? berth : s));
    });
  };

  /** Tapping open water walks the selected boat over — easier than a drag on a phone. */
  const onYourCell = (idx: number) => {
    if (shieldPlacing) { moveShield(Math.floor(idx / GRID), idx % GRID); return; }
    if (!arranging || !selected) return;
    moveShip(selected, Math.floor(idx / GRID), idx % GRID);
  };

  /** Re-scatter the whole fleet. No limit — press it until you like the look. */
  const shuffleFleet = () => {
    if (!arranging) return;
    setYourFleet(autoPlace([]));
    playSfx(SFX.selected);
  };

  const pressDone = () => {
    if (!arranging) return;
    setSelected(null);
    setWaitingDone(true);
    oppDoneRef.current = setTimeout(() => beginBattle(yourFleet), 2000 + Math.random() * 4000);
  };

  /* ---- roulette ---- */
  const chooseColor = (choice: Color) => {
    if (!bonus || bonus.stage !== 'select' || bonus.who !== 'you') return;
    setBonus({ ...bonus, stage: 'spinning', choice });
    const result = rollColor();
    setWheelAngle((a) => a + 360 * 6 + Math.floor(Math.random() * 360));
    setTimeout(() => {
      setBonus((b) => (b ? { ...b, stage: 'result', result } : b));
      playSfx(SFX.highlight);
      // the card dealt into the landing slot: yours if right, theirs if wrong
      const won: CardInst = { type: slots[result], color: result };
      setCards((c) => (result === choice ? { ...c, you: [...c.you, won] } : { ...c, foe: [...c.foe, won] }));
      setTimeout(() => {
        setBonus(null);
        if (endTurnAfterBonus.current) {
          endTurnAfterBonus.current = false;
          handOver(yourShots, foeShots);
        }
      }, RESULT_MS);
    }, SPIN_MS);
  };

  /* ---- action cards ---- */
  const canPlayCards = phase === 'battle' && turn === 'you' && !bonus && !showForfeit;

  /** Raise the smallest boat you've lost onto a random clear berth. */
  const resurrectBoat = (): boolean => {
    const wreck = sunkSmallest(yourFleet, foeShots);
    if (!wreck) return false;
    const berth = resurrectionBerth(wreck, yourFleet, foeShots);
    if (!berth) return false;
    // The old wreck stays drawn on your board, but there's nothing left there to
    // finish off — tell the opponent so it stops treating those hits as leads.
    ghostHitsRef.current = new Set([...ghostHitsRef.current, ...cellsFor(wreck)]);
    setYourFleet((f) => f.map((s) => (s.key === wreck.key ? berth : s)));
    return true;
  };

  /** Why a card in hand can't be played right now, or null if it can. */
  const cardBlocked = (card: CardInst): string | null => {
    if (card.type !== 'RESURRECTION') return null;
    const wreck = sunkSmallest(yourFleet, foeShots);
    if (!wreck) return 'NOTHING SUNK';
    return resurrectionBerth(wreck, yourFleet, foeShots) ? null : 'NO SPACE';
  };

  const playCard = (i: number) => {
    if (!canPlayCards) return;
    const card = cards.you[i];
    if (!card || cardBlocked(card)) return;

    // Resurrection can fail on a crowded board; don't burn the card if it does.
    if (card.type === 'RESURRECTION' && !resurrectBoat()) return;

    setCards((c) => ({ ...c, you: c.you.filter((_, k) => k !== i) })); // one-time use
    playSfx(SFX.selected);
    if (card.type === '+1') setShotsLeft((s) => s + 1);
    else if (card.type === '+2') setShotsLeft((s) => s + 2);
    else if (card.type === 'CLUSTER') setClusterArmed(true);   // flag, so it never stacks
    else if (card.type === 'SKIP') setSkipFoeTurn(true);
    else if (card.type === 'SHIELD') setShieldPlacing(clampShield(3, 3));   // drops mid-board to be dragged
    else if (card.type === 'WHIRLPOOL') strike(randomCentres(yourShots, 3).flatMap((c) => blockAround(c, 3)), false);
    else if (card.type === 'THUNDERSTORM') strike(randomCentres(yourShots, 3), false);
  };

  const lockShield = () => {
    if (!shieldPlacing) return;
    setShield(shieldPlacing);
    shieldRef.current = shieldPlacing;
    setShieldPlacing(null);
    playSfx(SFX.selected);
  };
  const moveShield = (row: number, col: number) => {
    if (!shieldPlacing) return;
    setShieldPlacing(clampShield(row, col));
  };

  /* ---- firing ----
     One volley of cells against the enemy board: marks, sound, sink check, win
     check and the bonus spin. Aimed shots spend a shot; the strike cards don't,
     since playing a card is its own action. */
  const strike = (area: number[], spendShot: boolean) => {
    const fresh = [...new Set(area)].filter((i) => yourShots[i] === undefined);
    const foeCells = new Set(foeFleet.flatMap(cellsFor));
    const next: Shots = { ...yourShots };
    let anyHit = false;
    for (const i of fresh) {
      const hit = foeCells.has(i);
      next[i] = hit ? 'hit' : 'miss';
      if (hit) { anyHit = true; playExplosion('foe', i); }
    }
    setYourShots(next);

    // one sound per volley: the heaviest outcome wins, else it's a miss
    const sankSomething = fresh.some((i) => next[i] === 'hit' && didSink(foeFleet, next, i));
    playSfx(anyHit ? (sankSomething ? SFX.sunk : SFX.hit) : SFX.miss);

    const left = spendShot ? shotsLeft - 1 : shotsLeft;
    if (spendShot) setShotsLeft(left);
    if (boatsRemaining(foeFleet, next) === 0) { setWinner('you'); setPhase('over'); return; }

    // Sinking a ship earns the bonus spin — one per volley, however many boats
    // a Cluster or a Whirlpool takes down at once.
    if (sankSomething) {
      endTurnAfterBonus.current = left <= 0;
      setSlots(dealSlots());                 // deal fresh cards into the slots
      setBonus({ who: 'you', stage: 'select', choice: null, result: null });
      setShowBonusPopup(true);
      playSfx(SFX.bonus);
      setTimeout(() => setShowBonusPopup(false), BONUS_POPUP_MS);
      return;
    }
    if (spendShot && left <= 0) setTimeout(() => handOver(next, foeShots), 700);
  };

  const fireAt = (idx: number) => {
    if (phase !== 'battle' || turn !== 'you' || shotsLeft <= 0 || bonus || showForfeit || shieldPlacing) return;
    if (yourShots[idx] !== undefined) return;
    const area = clusterArmed ? clusterCells(idx) : [idx];
    if (clusterArmed) setClusterArmed(false);
    strike(area, true);
  };

  const statusText =
    phase === 'setup' ? (
        waitingDone ? 'Board locked — waiting for opponent…'
        : 'Drag any boat to move it, ↻ turns the glowing one. SHUFFLE to re-scatter, DONE when you like it.'
      )
    : bonus?.who === 'you' ? (
        bonus.stage === 'select' ? 'Ship sunk — pick a colour to win its card!'
        : bonus.stage === 'spinning' ? `Spinning… you picked ${bonus.choice}.`
        : bonus.result === bonus.choice ? `${bonus.result}! You win the ${CARD_INFO[slots[bonus.result!]].name} card.`
        : `${bonus.result}. Wrong call — the ${CARD_INFO[slots[bonus.result!]].name} card goes to your opponent.`
      )
    : bonus?.who === 'foe' ? (
        bonus.stage === 'select' ? 'They sank one of your ships — watch their bonus spin.'
        : bonus.stage === 'spinning' ? `Spinning… they called ${bonus.choice}.`
        : bonus.result === bonus.choice ? `${bonus.result}. They called it — the ${CARD_INFO[slots[bonus.result!]].name} card is theirs.`
        : `${bonus.result}. They called it wrong — the ${CARD_INFO[slots[bonus.result!]].name} card is yours!`
      )
    : phase === 'battle' ? (
        shieldPlacing
          ? 'Drag your shield over the water you want covered, then press PLACE. It stays hidden.'
        : turn === 'you'
          ? (clusterArmed
              ? 'CLUSTER armed — tap ENEMY WATERS to hit a whole 5×5 area!'
              : `Your turn — tap a square on ENEMY WATERS to fire. ${shotsLeft} shot${shotsLeft === 1 ? '' : 's'} left.`)
          : `Enemy turn — they're firing on your fleet. ${shotsLeft} shot${shotsLeft === 1 ? '' : 's'} left.`
      )
    : winner === 'you' ? 'VICTORY — enemy fleet destroyed.' : 'DEFEAT — your fleet is gone.';

  // rocket row = the ACTIVE player's remaining shots (extra shots widen the row)

  if (typeof window !== 'undefined') {
    (window as any).__BC = { phase, turn, shotsLeft, clock, yourBoats, foeBoats, foeFleet, winner, selected, yourFleet, waitingDone, bonus, cards, slots, clusterArmed, skipFoeTurn, foePlayed, foeTarget, cardBlocked, dealSlots, shield, shieldPlacing, shieldCells, RED_BLACK_POOL, GREEN_POOL, randomCentres, blockAround, sunkSmallest, resurrectionBerth, cellsFor, autoPlace, stageFor, yourShots, foeShots };
  }

  /* ---------- shared pieces (composed differently on mobile vs desktop) ---------- */
  /* Two identical red windows tell you nothing about which clock is yours, so name
     them. Fixed-height label row: it blanks out during a spin (when the windows
     read BONUS / SPIN) without the panel changing size. */
  const clockLabel = (who: string) => (
    <span className="font-mono text-[10px] tracking-widest text-black/70 text-center h-3 leading-3 select-none">
      {phase === 'battle' && !bonus ? who : ''}
    </span>
  );

  const clocksPanel = (
    <div className={`${raised} p-2 flex gap-2 justify-center`}>
      {/* During a spin the windows read BONUS / SPIN; at match end, GAME / OVER —
          both flashing. Otherwise they're the turn clocks. */}
      <div className="flex-1 flex flex-col gap-1">
        {clockLabel('YOU')}
        <div className={`${sunken} h-[72px] flex items-center justify-center`} style={{ backgroundColor: '#1b1b1b' }}>
          {bonus ? <SegWord word="BONUS" flash />
            : phase === 'over' ? <SegWord word="GAME" flash />
            : <SegClock seconds={clock} on={phase === 'setup' || (phase === 'battle' && turn === 'you')} />}
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1">
        {clockLabel('ENEMY')}
        <div className={`${sunken} h-[72px] flex items-center justify-center`} style={{ backgroundColor: '#1b1b1b' }}>
          {bonus ? <SegWord word="SPIN" flash />
            : phase === 'over' ? <SegWord word="OVER" flash />
            : <SegClock seconds={clock} on={phase === 'battle' && turn === 'foe'} />}
        </div>
      </div>
    </div>
  );

  /* The rockets are a shot counter, but a row of rockets doesn't say so — and it
     tracks whoever is shooting, which is worth spelling out too. */
  const missileRow = (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[10px] tracking-widest text-black/70 h-3 leading-3 select-none">
        {phase === 'battle' ? (turn === 'you' ? 'YOUR SHOTS LEFT' : 'ENEMY SHOTS LEFT') : ''}
      </span>
      <div className="flex justify-center gap-1.5 flex-wrap min-h-4">
        {Array.from({ length: Math.max(0, shotsLeft) }, (_, i) => <Missile key={i} />)}
      </div>
    </div>
  );

  const colorSlots = (
    <div className="grid grid-cols-3 gap-2">
      {COLORS.map(({ key, label, bg, border }) => {
        const selecting = bonus?.who === 'you' && bonus.stage === 'select';
        const chosen = bonus?.choice === key;
        const isWinner = bonus?.stage === 'result' && bonus.result === key;
        const ring = selecting || chosen || isWinner ? 'outline outline-[3px] outline-[#f2c320]' : '';
        const card = bonus ? slots[key] : null;
        return (
          <button
            key={key}
            onClick={() => { playSfx(SFX.selected); chooseColor(key); }}
            onMouseEnter={() => { if (selecting) playSfx(SFX.highlight); }}
            disabled={!selecting}
            className={`border-[3px] ${border} ${ring} transition-transform duration-150 origin-center ${selecting ? 'cursor-pointer hover:scale-110 hover:z-10 relative' : 'cursor-default'}`}
          >
            <div className={`${bg} text-white text-center font-bold text-xs py-0.5`}>{label}</div>
            {/* dark display panel, matching the clock windows; the dealt card
                appears here during a spin, otherwise it sits empty */}
            <div className="h-24 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#1b1b1b' }}>
              {card && (() => {
                const art = cardArt({ type: card, color: key });
                return art
                  ? <img src={art} alt={CARD_INFO[card].name} className="h-full w-auto" style={{ imageRendering: 'pixelated' }} />
                  : <span className={`${CARD_INFO[card].cls} text-white font-bold text-[11px] px-1.5 py-1 rounded-sm border border-black/40 leading-none`}>{CARD_INFO[card].label}</span>;
              })()}
            </div>
          </button>
        );
      })}
    </div>
  );

  /** outer/inner classes differ: desktop stretches to fill, mobile is a square block */
  const wheelPanel = (outerCls: string, innerCls: string) => (
    <div className={`${raised} p-1 ${outerCls}`}>
      <div className={`relative bg-[#bdbdbd] overflow-hidden flex items-center justify-center ${innerCls}`}>
        {/* object-contain on both layers keeps the wheel perfectly round even
            if the panel isn't exactly square */}
        <div className="relative h-full w-full">
          <img src="/game/roulette-base.png" alt="" className="absolute inset-0 w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          <img src="/game/roulette-wheel.png" alt="Roulette wheel"
            className={`absolute inset-[2.5%] w-[95%] h-[95%] object-contain ${bonus ? '' : 'animate-[spin_12s_linear_infinite]'}`}
            style={bonus
              ? { imageRendering: 'pixelated', transform: `rotate(${wheelAngle}deg)`, transition: `transform ${SPIN_MS}ms cubic-bezier(0.17,0.67,0.12,0.99)` }
              : { imageRendering: 'pixelated' }} />
        </div>
      </div>
    </div>
  );

  const shieldControls = (
    <div className="flex items-center justify-center gap-2">
      <button onClick={lockShield} className={btn98}>PLACE</button>
    </div>
  );

  const setupControls = (
    <div className="flex items-center justify-center gap-2">
      {/* Two ways out of setup and nothing to unlock first: re-roll the layout, or
          take it. The turn-wheel lives on the selected boat, not down here. */}
      <button onClick={shuffleFleet} className={btn98}>SHUFFLE</button>
      <button onClick={pressDone} className={btn98}>DONE</button>
    </div>
  );

  const yourBoard = (
    <Board
      title="Your fleet"
      right={phase === 'setup' ? `${yourFleet.length}/${FLEET.length} ships` : `boats left: ${yourBoats}`}
      ships={yourFleet} showShips sunk={[]} shots={foeShots}
      clickable={arranging || !!shieldPlacing}
      // Highlighted while you're arranging it, and again while it's under fire —
      // both times it's the board to be looking at. Never on your own turn: the
      // shooting happens over on enemy waters.
      outlined={arranging || (phase === 'battle' && turn === 'foe')}
      onCell={onYourCell}
      animating={anim.you}
      arrangeable={arranging}
      shieldGhost={shieldPlacing}
      onShieldMove={moveShield}
      selected={selected}
      onSelect={selectShip}
      onShipMove={moveShip}
      onRotate={rotateSelected}
    />
  );

  const enemyBoard = (
    <Board
      title="Enemy waters"
      right={phase === 'battle' || phase === 'over' ? `boats left: ${foeBoats}` : 'awaiting battle'}
      ships={foeFleet} showShips={false}
      sunk={phase === 'battle' || phase === 'over' ? sunkShips(foeFleet, yourShots) : []}
      shots={yourShots}
      clickable={phase === 'battle' && turn === 'you' && shotsLeft > 0 && !bonus && !showForfeit}
      // Pulses on your turn because this is where you fire. Static-quiet the rest
      // of the time so the pulse always means "your move".
      outlined={phase === 'battle' && turn === 'you'}
      pulse={phase === 'battle' && turn === 'you' && shotsLeft > 0 && !bonus && !showForfeit}
      onCell={fireAt}
      animating={anim.foe}
      crosshair
    />
  );

  /* Mobile shows ONE board at a time: on your turn you need the enemy grid to
     fire at, on theirs you watch your own fleet take fire. */
  const mobileBoard = shieldPlacing ? yourBoard
    : phase === 'battle'
    ? (turn === 'you' ? enemyBoard : yourBoard)
    : phase === 'over' ? enemyBoard
    : yourBoard;
  const mobileShowRack = waitingDone || phase === 'battle' || phase === 'over';
  const mobileRackIsYours = phase !== 'battle' || turn === 'you';

  /* Title screen. It's where /testgame lands and where forfeiting drops you, so
     the console never shows up without a match behind it. Background is left
     plain on purpose — artwork is coming. */
  if (phase === 'idle') {
    return (
      <div
        className="min-h-screen bg-[#b8b8b8] font-sans text-black flex flex-col p-6"
        /* Temporary wallpaper — a still frame; swap in the animated .gif when it
           lands. The grey ground stays underneath so a missing file degrades to
           the plain screen rather than a hole. */
        style={{
          backgroundImage: "url('/game/title-bg.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated',
        }}
      >
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-around gap-10 md:gap-6">
          <img
            src="/game/logo-battlechips.webp"
            alt="Battle Chips"
            className="w-[min(78vw,520px)] md:w-[min(42vw,620px)] h-auto select-none"
            draggable={false}
          />
          <button
            onClick={newMatch}
            className={`${btn98} !px-12 !py-4 md:!px-16 md:!py-6 text-2xl md:text-4xl tracking-[0.2em]`}
          >
            START
          </button>
        </div>
        <Footer onArt />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#b8b8b8] p-3 md:p-4 font-sans text-black">
      <style>{`
        @keyframes bcBonusPop {
          0%   { transform: scale(0);    opacity: 0; }
          10%  { transform: scale(1.12); opacity: 1; }
          16%  { transform: scale(1); }
          34%  { transform: scale(1.06); }
          52%  { transform: scale(1); }
          70%  { transform: scale(1.06); }
          88%  { transform: scale(1);    opacity: 1; }
          100% { transform: scale(0);    opacity: 0; }
        }
        @keyframes bcFlash { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.07; } }
        /* Slow breathing glow on the boat you're currently positioning, so the
           thing you're meant to be moving is never in doubt. */
        @keyframes bcPulse {
          0%, 100% { outline-color: #f2c320; box-shadow: 0 0 0 0 rgba(242,195,32,0); }
          50%      { outline-color: #fff7cc; box-shadow: 0 0 12px 3px rgba(242,195,32,0.65); }
        }
        /* Shield being positioned: neon blue outline breathing against the water. */
        @keyframes bcShield {
          0%, 100% { outline-color: rgba(0,209,255,0.35); box-shadow: 0 0 6px 1px rgba(0,209,255,0.35), inset 0 0 12px rgba(0,209,255,0.25); }
          50%      { outline-color: #00d1ff;             box-shadow: 0 0 22px 6px rgba(0,209,255,0.85), inset 0 0 22px rgba(0,209,255,0.5); }
        }
        /* A shot the shield ate: blue bloom, then gone. No red X, no explosion. */
        @keyframes bcBlueBurst {
          0%   { transform: scale(0.2); opacity: 1;   box-shadow: 0 0 0 0 rgba(0,209,255,0.9); background: rgba(190,245,255,0.95); }
          55%  { transform: scale(1);   opacity: 0.9; box-shadow: 0 0 18px 6px rgba(0,209,255,0.8); background: rgba(0,209,255,0.55); }
          100% { transform: scale(1.15); opacity: 0;  box-shadow: 0 0 26px 10px rgba(0,209,255,0); background: rgba(0,209,255,0); }
        }
        /* Selected boat: fades right out to nothing and back to neon yellow, which
           reads as "held" rather than the steady board outlines. */
        @keyframes bcSelect {
          0%, 100% { outline-color: rgba(234,255,0,0); box-shadow: 0 0 0 0 rgba(234,255,0,0); }
          50%      { outline-color: #eaff00; box-shadow: 0 0 14px 4px rgba(234,255,0,0.8); }
        }
      `}</style>
      {showBonusPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <img src="/game/bonus-spin.png" alt="Bonus Spin!"
            className="w-[80vw] max-w-[560px] drop-shadow-[0_8px_0_rgba(0,0,0,0.35)]"
            style={{ animation: `bcBonusPop ${BONUS_POPUP_MS}ms ease-in-out forwards` }} />
        </div>
      )}

      {/* Opening call to action, in the console's readout voice — says what this
          screen is for before anyone has to work it out from the board. */}
      {showPlacePrompt && <Callout text="PLACE YOUR BOATS" />}
      {showBegin && <Callout text="BEGIN" />}

      {/* Their spin gets announced before it turns, so the wheel taking over the
          screen on someone else's turn reads as part of the game. Styled like the
          console's readout windows rather than the player's BONUS SPIN! artwork —
          it should feel like something happening TO you. */}
      {showFoeSpin && <Callout text="OPPONENT'S SPIN" />}
      {foePlayed && <Callout text={`ENEMY PLAYS ${foePlayed}`} />}
      {shieldHit && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none p-4">
          <span
            className="font-mono font-bold text-white tracking-[0.15em] select-none whitespace-nowrap"
            style={{
              fontSize: 'clamp(1.3rem, 5vw, 3rem)',
              textShadow: '0 0 10px rgba(0,209,255,0.95), 0 0 26px rgba(0,209,255,0.75), 0 3px 0 rgba(0,0,0,0.85)',
              animation: 'bcFlash 0.5s steps(1,end) infinite',
            }}
          >
            SHIELD HIT!
          </span>
        </div>
      )}

      {showForfeit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className={`${raised} w-full max-w-sm p-1`}>
            <div className="bg-[#000080] text-white font-bold text-sm px-2 py-1">Forfeit match</div>
            <div className="p-4 text-center">
              <p className="text-sm text-black mb-4">Are you sure you&apos;d like to forfeit? Funds will not be returned.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => resetTo('idle')} className={btn98}>Yes, Leave</button>
                <button onClick={() => setShowForfeit(false)} className={btn98}>No, Stay</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chrome bar — buttons stay compact on mobile so the wordmark can't overlap them */}
      <div className={`${raised} relative flex items-center justify-between gap-2 px-2 py-2 md:px-4 md:py-3 mb-3`}>
        <button
          onClick={() => (inGame ? setShowForfeit(true) : resetTo('idle'))}
          className={`${btn98} !px-2.5 !text-[11px] md:!px-5 md:!text-sm relative z-10`}
        >
          {inGame ? 'Forfeit' : 'Exit'}
        </button>
        <img src="/game/logo-battlechips.webp" alt="Battle Chips"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-9 md:h-16 w-auto pointer-events-none" />
        <button onClick={newMatch} className={`${btn98} !px-2.5 !text-[11px] md:!px-5 md:!text-sm relative z-10`}>
          New match
        </button>
      </div>

      {/* Status strip */}
      <div className={`${raised} p-0.5 mb-3`}>
        <div className={`${sunken} bg-[#efefef] flex flex-wrap gap-2 items-center justify-between px-3 py-1.5`}>
          <span className="font-mono text-[13px] tracking-widest uppercase">
            {phase === 'setup' ? 'Private setup' : phase === 'battle' ? 'Battle' : 'Game over'}
          </span>
          <span className="text-sm">{statusText}</span>
        </div>
      </div>

      {/* ---------- MOBILE: one panel at a time under a fixed clock/missile head ---------- */}
      <div className="lg:hidden flex flex-col gap-3 max-w-md mx-auto">
        {clocksPanel}

        {missileRow}

        {/* a spin takes over the board slot; otherwise it's whichever board matters now */}
        {bonus ? (
          <>
            {colorSlots}
            {wheelPanel('', 'aspect-square w-full')}
          </>
        ) : mobileBoard}

        {arranging && setupControls}
        {shieldPlacing && shieldControls}

        {mobileShowRack && (
          <Rack
            cards={mobileRackIsYours ? cards.you : cards.foe}
            playable={mobileRackIsYours && canPlayCards}
            onPlay={playCard}
            blocked={mobileRackIsYours ? cardBlocked : undefined}
            label={mobileRackIsYours ? 'YOUR CARDS' : 'ENEMY CARDS'}
          />
        )}
      </div>

      {/* ---------- DESKTOP: unchanged three-column console ----------
          Columns stretch to a common height so the console's wheel bottoms out
          flush with the action-card racks either side. */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_minmax(300px,27vw)_1fr] gap-4 items-stretch max-w-[1700px] mx-auto">
        {/* YOUR side — board full width, action cards underneath */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 min-w-0">
            {yourBoard}
            {arranging && setupControls}
            {shieldPlacing && shieldControls}
          </div>
          <Rack cards={cards.you} playable={canPlayCards} onPlay={playCard} blocked={cardBlocked} />
        </div>

        {/* center console — fills the column height; the wheel takes whatever
            vertical space the readouts leave, so it ends flush with the racks */}
        <div className="flex flex-col gap-3 h-full">
          {clocksPanel}
          {missileRow}
          {colorSlots}
          {wheelPanel('flex-1 min-h-0', 'h-full w-full')}
        </div>

        {/* ENEMY side — board full width, their action cards underneath */}
        <div className="flex flex-col gap-2">
          <div className="min-w-0">{enemyBoard}</div>
          <Rack cards={cards.foe} playable={false} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BattleChips;
