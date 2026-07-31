import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SECRET game lab (/testgame) — BATTLE CHIPS (battleship × roulette).
 *
 * Setup: tap the grid to spawn the next boat (outlined yellow), tap/drag to move,
 * ◄ ► rotate, PLACE locks it. All five locked → EDIT / DONE. 30s timer; anything
 * unplaced is auto-deployed at 0:00.
 *
 * Battle: 5 shots/15s per turn → 3/10s once either side is down to 2 boats →
 * 1/5s at 1 boat. The rocket row under the clocks shows the ACTIVE player's
 * remaining shots. Yellow outline = whose turn it is.
 *
 * Roulette: SINKING an enemy ship pauses the turn for a spin. Each slot is dealt an
 * action card first (RED/BLACK: +1 or +2 at 50/50 each, independently; GREEN:
 * Cluster or Skip at 50/50), so you can see what you're playing for. Guess the
 * landing colour right and that slot's card is yours — guess wrong and it goes
 * to your opponent.
 *
 * Action cards are one-time use and playable any time during your own turn.
 * Several can be played in a turn but effects don't stack (Cluster/Skip are
 * armed flags, so a second copy doesn't double them).
 */

const GRID = 10;
const SETUP_SECONDS = 30;
const EXPLOSION_MS = 2100;
const BONUS_POPUP_MS = 2500;
const SPIN_MS = 3200;
const RESULT_MS = 1800;
const CLUSTER_SIZE = 5; // Cluster card fires a 5x5 blast

/* ---------- audio ----------
   Browsers block audio until the page has had a user gesture; clicking
   "New match" supplies it. Playback errors are swallowed — sound is never
   allowed to break the game. */
const SFX = {
  countdown: '/game/sounds/countdown-beep.mp3',
  start: '/game/sounds/start-beep.wav',
  hit: '/game/sounds/ship-hit.wav',
  sunk: '/game/sounds/ship-destroyed.wav',
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

/* ---------- action cards ---------- */
type Card = '+1' | '+2' | 'CLUSTER' | 'SKIP';
const CARD_INFO: Record<Card, { label: string; blurb: string; cls: string }> = {
  '+1': { label: '+1', blurb: '1 extra shot this turn', cls: 'bg-[#1d4ed8]' },
  '+2': { label: '+2', blurb: '2 extra shots this turn', cls: 'bg-[#7c3aed]' },
  CLUSTER: { label: 'CLUSTER', blurb: 'Next shot hits 5×5', cls: 'bg-[#ea580c]' },
  SKIP: { label: 'SKIP', blurb: "Skip opponent's turn", cls: 'bg-[#0f766e]' },
};

/* ---------- roulette ---------- */
type Color = 'RED' | 'GREEN' | 'BLACK';
const COLORS: { key: Color; label: string; bg: string; border: string; weight: number }[] = [
  { key: 'RED', label: 'RED', bg: 'bg-red-600', border: 'border-red-600', weight: 18 },
  { key: 'GREEN', label: 'GREEN', bg: 'bg-green-700', border: 'border-green-700', weight: 1 },
  { key: 'BLACK', label: 'BLACK', bg: 'bg-black', border: 'border-black', weight: 18 },
];
const rollColor = (): Color => {
  const total = COLORS.reduce((n, c) => n + c.weight, 0);
  let r = Math.random() * total;
  for (const c of COLORS) { if ((r -= c.weight) < 0) return c.key; }
  return 'BLACK';
};
/** Deal the cards sitting in each slot for one spin. Red/black roll independently. */
type SlotCards = Record<Color, Card>;
const dealSlots = (): SlotCards => ({
  RED: Math.random() < 0.5 ? '+1' : '+2',
  BLACK: Math.random() < 0.5 ? '+1' : '+2',
  GREEN: Math.random() < 0.5 ? 'CLUSTER' : 'SKIP',
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
type Shots = Record<number, 'hit' | 'miss'>;
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

const boatsRemaining = (fleet: Placed[], shots: Shots): number =>
  fleet.filter((s) => !cellsFor(s).every((c) => shots[c] === 'hit')).length;
const sunkShips = (fleet: Placed[], shots: Shots): Placed[] =>
  fleet.filter((s) => cellsFor(s).every((c) => shots[c] === 'hit'));
const didSink = (fleet: Placed[], shotsAfter: Shots, idx: number): boolean => {
  const ship = fleet.find((s) => cellsFor(s).includes(idx));
  return !!ship && cellsFor(ship).every((c) => shotsAfter[c] === 'hit');
};
const stageFor = (minBoats: number): { shots: number; secs: number } =>
  minBoats <= 1 ? { shots: 1, secs: 5 } : minBoats === 2 ? { shots: 3, secs: 10 } : { shots: 5, secs: 15 };

/** 5×5 block centred on idx, clipped to the board. */
const clusterCells = (idx: number): number[] => {
  const r0 = Math.floor(idx / GRID), c0 = idx % GRID, half = Math.floor(CLUSTER_SIZE / 2);
  const out: number[] = [];
  for (let r = r0 - half; r <= r0 + half; r++)
    for (let c = c0 - half; c <= c0 + half; c++)
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) out.push(r * GRID + c);
  return out;
};

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
    <div className="flex items-center justify-center gap-[3px] h-9 py-1">
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
const SegWord = ({ word }: { word: string }) => (
  <span className="font-mono font-bold text-[#ff2222] text-2xl tracking-[0.15em] select-none"
    style={{ transform: 'skewX(-4deg)', textShadow: '0 0 6px rgba(255,34,34,0.85)' }}>{word}</span>
);

const Missile = ({ live }: { live: boolean }) => (
  <svg viewBox="0 0 24 8" className="h-3 w-9">
    <g fill={live ? '#7d7d7d' : '#4b4b4b'} opacity={live ? 1 : 0.45}>
      <polygon points="0,0 3,2 3,6 0,8" />
      <rect x="3" y="2" width="12" height="4" />
      <polygon points="15,0.5 23,4 15,7.5" />
    </g>
  </svg>
);

const ShipImg = ({ s }: { s: Placed }) => (
  <img src={FLEET.find((f) => f.key === s.key)!.src} alt={s.key}
    className="absolute object-fill"
    style={s.dir === 'v'
      ? { inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }
      : { left: '50%', top: '50%', width: `${100 / s.len}%`, height: `${s.len * 100}%`, transform: 'translate(-50%, -50%) rotate(90deg)', imageRendering: 'pixelated' }} />
);

/* ---------- action-card rack (outside edge of each grid) ---------- */
const Rack = ({ cards, playable, onPlay }: { cards: Card[]; playable: boolean; onPlay?: (i: number) => void }) => (
  <div className={`${raised} p-1 w-[58px] md:w-[74px] shrink-0 self-stretch`}>
    <div className="font-mono text-[9px] text-center text-black/70 pb-1 leading-tight">ACTION<br />CARDS</div>
    <div className="flex flex-col gap-1">
      {cards.map((c, i) => {
        const info = CARD_INFO[c];
        return (
          <button
            key={i}
            onClick={() => playable && onPlay?.(i)}
            disabled={!playable}
            title={`${info.label} — ${info.blurb}`}
            className={`${sunken} p-0.5 ${playable ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}`}
          >
            <div className={`${info.cls} text-white font-bold text-[10px] md:text-xs text-center py-1 leading-none border border-black/40`}>
              {info.label}
            </div>
          </button>
        );
      })}
      {cards.length === 0 && <div className="text-center text-[9px] text-black/35 font-mono py-2">empty</div>}
    </div>
  </div>
);

/* ---------- board ---------- */
const Board = ({ title, right, ships, showShips, sunk, shots, clickable, outlined, onCell, onShip, animating, pending, onPendingMove, crosshair }: {
  title: string; right: string; ships: Placed[]; showShips: boolean; sunk: Placed[]; shots: Shots;
  clickable: boolean; outlined: boolean;
  onCell?: (idx: number) => void; onShip?: (key: ShipKey) => void;
  animating?: Record<number, true>; pending?: Placed | null; onPendingMove?: (row: number, col: number) => void;
  crosshair?: boolean;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ dr: number; dc: number } | null>(null);
  const cellFromPointer = (e: React.PointerEvent) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      row: Math.floor(((e.clientY - rect.top) / rect.height) * GRID),
      col: Math.floor(((e.clientX - rect.left) / rect.width) * GRID),
    };
  };

  return (
    <div className={`${raised} p-1.5 ${outlined ? 'outline outline-[3px] outline-[#f2c320]' : ''}`}>
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
            {(showShips ? ships : sunk).map((s) => (
              <button key={s.key} onClick={() => onShip?.(s.key)}
                className={`absolute ${onShip ? 'pointer-events-auto cursor-pointer' : ''}`}
                style={{ left: `${s.col * 10}%`, top: `${s.row * 10}%`, width: `${(s.dir === 'h' ? s.len : 1) * 10}%`, height: `${(s.dir === 'v' ? s.len : 1) * 10}%` }}>
                <ShipImg s={s} />
              </button>
            ))}
            {pending && (
              <div
                className="absolute pointer-events-auto outline outline-[3px] outline-[#f2c320] cursor-grab active:cursor-grabbing"
                style={{
                  left: `${pending.col * 10}%`, top: `${pending.row * 10}%`,
                  width: `${(pending.dir === 'h' ? pending.len : 1) * 10}%`, height: `${(pending.dir === 'v' ? pending.len : 1) * 10}%`,
                  touchAction: 'none',
                }}
                onPointerDown={(e) => {
                  const c = cellFromPointer(e);
                  if (!c) return;
                  dragOffset.current = { dr: c.row - pending.row, dc: c.col - pending.col };
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!dragOffset.current) return;
                  const c = cellFromPointer(e);
                  if (c) onPendingMove?.(c.row - dragOffset.current.dr, c.col - dragOffset.current.dc);
                }}
                onPointerUp={() => { dragOffset.current = null; }}
                onPointerCancel={() => { dragOffset.current = null; }}
              >
                <ShipImg s={pending} />
              </div>
            )}
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {Object.entries(shots).map(([idx, kind]) => {
              const i = Number(idx);
              return (
                <div key={idx} className="absolute flex items-center justify-center"
                  style={{ left: `${(i % GRID) * 10}%`, top: `${Math.floor(i / GRID) * 10}%`, width: '10%', height: '10%' }}>
                  {kind === 'hit'
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
const TestGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [yourFleet, setYourFleet] = useState<Placed[]>([]);
  const [pending, setPending] = useState<Placed | null>(null);
  const [editMode, setEditMode] = useState(false);
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
  const [cards, setCards] = useState<{ you: Card[]; foe: Card[] }>({ you: [], foe: [] });
  const [wheelAngle, setWheelAngle] = useState(0);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [showForfeit, setShowForfeit] = useState(false);
  const [clusterArmed, setClusterArmed] = useState(false);   // one-time 5x5, no stacking
  const [skipFoeTurn, setSkipFoeTurn] = useState(false);     // Skip card, no stacking

  const endTurnAfterBonus = useRef(false);
  const foeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oppDoneRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foeShotsRef = useRef<Shots>({});
  useEffect(() => { foeShotsRef.current = foeShots; }, [foeShots]);

  const yourBoats = boatsRemaining(yourFleet, foeShots);
  const foeBoats = phase === 'battle' || phase === 'over' ? boatsRemaining(foeFleet, yourShots) : FLEET.length;

  const nextShip = useMemo(() => {
    const used = new Set([...yourFleet.map((s) => s.key), ...(pending ? [pending.key] : [])]);
    return FLEET.find((f) => !used.has(f.key)) ?? null;
  }, [yourFleet, pending]);

  const allLocked = yourFleet.length === FLEET.length && !pending;
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
    setPhase(to); setYourFleet([]); setPending(null); setEditMode(false); setWaitingDone(false);
    setFoeFleet([]); setYourShots({}); setFoeShots({}); setTurn('you'); setShotsLeft(5);
    setClock(SETUP_SECONDS); setWinner(null); setAnim({ you: {}, foe: {} });
    setBonus(null); setCards({ you: [], foe: [] });
    setShowBonusPopup(false); setShowForfeit(false); setClusterArmed(false); setSkipFoeTurn(false);
    endTurnAfterBonus.current = false;
  };
  const newMatch = () => resetTo('setup');

  const beginBattle = (locked: Placed[], pend: Placed | null) => {
    if (oppDoneRef.current) clearTimeout(oppDoneRef.current);
    const mine = autoPlace(pend ? [...locked, pend] : locked);
    setYourFleet(mine); setPending(null); setEditMode(false); setWaitingDone(false);
    setFoeFleet(autoPlace([]));
    const stage = stageFor(FLEET.length);
    setPhase('battle'); setTurn('you'); setShotsLeft(stage.shots); setClock(stage.secs);
    playSfx(SFX.start);
  };

  const startTurn = (who: 'you' | 'foe', yFleet: Placed[], fFleet: Placed[], yShots: Shots, fShots: Shots) => {
    const stage = stageFor(Math.min(boatsRemaining(yFleet, fShots), boatsRemaining(fFleet, yShots)));
    setTurn(who); setShotsLeft(stage.shots); setClock(stage.secs);
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
    if (phase === 'setup') { beginBattle(yourFleet, pending); return; }
    if (phase === 'battle') {
      if (turn === 'you') handOver(yourShots, foeShots);
      else startTurn('you', yourFleet, foeFleet, yourShots, foeShots);
    }
  }, [clock]); // eslint-disable-line react-hooks/exhaustive-deps

  /* stand-in opponent: fires once a second, decrementing the shared shot counter
     so the rocket row reflects THEIR remaining shots too */
  useEffect(() => {
    if (phase !== 'battle' || turn !== 'foe' || showForfeit || bonus) return;
    foeTimerRef.current = setInterval(() => {
      const prev = foeShotsRef.current;
      const open = Array.from({ length: GRID * GRID }, (_, i) => i).filter((i) => prev[i] === undefined);
      if (open.length === 0) return;
      const target = open[Math.floor(Math.random() * open.length)];
      const isHit = new Set(yourFleet.flatMap(cellsFor)).has(target);
      const next: Shots = { ...prev, [target]: isHit ? 'hit' : 'miss' };
      foeShotsRef.current = next;
      setFoeShots(next);
      const sank = isHit && didSink(yourFleet, next, target);
      if (isHit) {
        playExplosion('you', target);
        playSfx(sank ? SFX.sunk : SFX.hit);
      }
      // sinking one of your ships earns them a spin (resolved silently); a wrong
      // call on their end hands the card to you
      if (sank) {
        const dealt = dealSlots();
        const pick = COLORS[Math.floor(Math.random() * COLORS.length)].key;
        const spun = rollColor();
        setCards((c) => (spun === pick
          ? { ...c, foe: [...c.foe, dealt[spun]] }
          : { ...c, you: [...c.you, dealt[spun]] }));
      }
      setShotsLeft((sl) => {
        const left = sl - 1;
        if (boatsRemaining(yourFleet, next) === 0) { setWinner('foe'); setPhase('over'); return 0; }
        if (left <= 0) setTimeout(() => startTurn('you', yourFleet, foeFleet, yourShots, next), 700);
        return Math.max(0, left);
      });
    }, 1000);
    return () => { if (foeTimerRef.current) clearInterval(foeTimerRef.current); };
  }, [phase, turn, showForfeit, bonus]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- setup ---- */
  const tryMovePending = (row: number, col: number) => {
    if (!pending) return;
    const moved = clamp({ ...pending, row, col });
    if (!overlaps(moved, yourFleet)) setPending(moved);
  };
  const onYourCell = (idx: number) => {
    if (phase !== 'setup' || waitingDone) return;
    const row = Math.floor(idx / GRID), col = idx % GRID;
    if (pending) { tryMovePending(row, col); return; }
    if (!nextShip) return;
    const cand = clamp({ key: nextShip.key, len: nextShip.len, row, col, dir: 'v' });
    if (!overlaps(cand, yourFleet)) setPending(cand);
    else {
      const flat = clamp({ ...cand, dir: 'h' as const });
      if (!overlaps(flat, yourFleet)) setPending(flat);
    }
  };
  const pickUp = (key: ShipKey) => {
    if (phase !== 'setup' || waitingDone || pending) return;
    const ship = yourFleet.find((s) => s.key === key);
    if (!ship) return;
    setYourFleet(yourFleet.filter((s) => s.key !== key));
    setPending(ship);
  };
  const rotatePending = () => {
    if (!pending) return;
    const rotated = clamp({ ...pending, dir: pending.dir === 'v' ? 'h' : 'v' });
    if (!overlaps(rotated, yourFleet)) setPending(rotated);
  };
  const lockPending = () => {
    if (!pending) return;
    const next = [...yourFleet, pending];
    setYourFleet(next); setPending(null);
    if (next.length === FLEET.length) setEditMode(false);
  };
  const pressDone = () => {
    if (!allLocked || waitingDone) return;
    setWaitingDone(true);
    oppDoneRef.current = setTimeout(() => beginBattle(yourFleet, null), 2000 + Math.random() * 4000);
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
      const won = slots[result];
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
  const playCard = (i: number) => {
    if (!canPlayCards) return;
    const card = cards.you[i];
    if (!card) return;
    setCards((c) => ({ ...c, you: c.you.filter((_, k) => k !== i) })); // one-time use
    playSfx(SFX.selected);
    if (card === '+1') setShotsLeft((s) => s + 1);
    else if (card === '+2') setShotsLeft((s) => s + 2);
    else if (card === 'CLUSTER') setClusterArmed(true);   // flag, so it never stacks
    else if (card === 'SKIP') setSkipFoeTurn(true);
  };

  /* ---- firing ---- */
  const fireAt = (idx: number) => {
    if (phase !== 'battle' || turn !== 'you' || shotsLeft <= 0 || bonus || showForfeit) return;
    if (yourShots[idx] !== undefined) return;

    const area = clusterArmed ? clusterCells(idx) : [idx];
    const fresh = area.filter((i) => yourShots[i] === undefined);
    const foeCells = new Set(foeFleet.flatMap(cellsFor));
    const next: Shots = { ...yourShots };
    let anyHit = false;
    for (const i of fresh) {
      const hit = foeCells.has(i);
      next[i] = hit ? 'hit' : 'miss';
      if (hit) { anyHit = true; playExplosion('foe', i); }
    }
    setYourShots(next);
    if (clusterArmed) setClusterArmed(false);

    // one sound per volley: the heavier one wins
    const sankSomething = fresh.some((i) => next[i] === 'hit' && didSink(foeFleet, next, i));
    if (anyHit) playSfx(sankSomething ? SFX.sunk : SFX.hit);

    const left = shotsLeft - 1;
    setShotsLeft(left);
    if (boatsRemaining(foeFleet, next) === 0) { setWinner('you'); setPhase('over'); return; }

    // Sinking a ship earns the bonus spin (one per volley, even if a Cluster
    // takes down more than one).
    if (sankSomething) {
      endTurnAfterBonus.current = left <= 0;
      setSlots(dealSlots());                 // deal fresh cards into the slots
      setBonus({ who: 'you', stage: 'select', choice: null, result: null });
      setShowBonusPopup(true);
      playSfx(SFX.bonus);
      setTimeout(() => setShowBonusPopup(false), BONUS_POPUP_MS);
      return;
    }
    if (left <= 0) setTimeout(() => handOver(next, foeShots), 700);
  };

  const statusText =
    phase === 'idle' ? 'Press New match to begin.'
    : phase === 'setup' ? (
        waitingDone ? 'Board locked — waiting for opponent…'
        : pending ? `Position your ${FLEET.find((f) => f.key === pending.key)!.label} — press PLACE to lock it in.`
        : allLocked ? 'Fleet ready — EDIT to adjust, DONE to lock in.'
        : nextShip ? `Tap the grid to spawn your ${nextShip.label} (${nextShip.len} cells).`
        : 'Tap a boat to pick it up.'
      )
    : bonus?.who === 'you' ? (
        bonus.stage === 'select' ? 'Ship sunk — pick a colour to win its card!'
        : bonus.stage === 'spinning' ? `Spinning… you picked ${bonus.choice}.`
        : bonus.result === bonus.choice ? `${bonus.result}! You win ${slots[bonus.result!]}.`
        : `${bonus.result}. Wrong call — ${slots[bonus.result!]} goes to your opponent.`
      )
    : phase === 'battle' ? (
        turn === 'you'
          ? (clusterArmed ? 'CLUSTER armed — your next shot hits a 5×5 area!' : `Your turn — fire! ${shotsLeft} shot${shotsLeft === 1 ? '' : 's'} left.`)
          : `Enemy turn… ${shotsLeft} shot${shotsLeft === 1 ? '' : 's'} left.`
      )
    : winner === 'you' ? 'VICTORY — enemy fleet destroyed.' : 'DEFEAT — your fleet is gone.';

  // rocket row = the ACTIVE player's remaining shots (extra shots widen the row)
  const baseShots = stageFor(Math.min(yourBoats, foeBoats)).shots;
  const rocketSlots = Math.max(baseShots, shotsLeft);

  if (typeof window !== 'undefined') {
    (window as any).__BC = { phase, turn, shotsLeft, clock, yourBoats, foeBoats, foeFleet, winner, pending, yourFleet, waitingDone, editMode, bonus, cards, slots, clusterArmed, skipFoeTurn };
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
      `}</style>
      {showBonusPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <img src="/game/bonus-spin.png" alt="Bonus Spin!"
            className="w-[80vw] max-w-[560px] drop-shadow-[0_8px_0_rgba(0,0,0,0.35)]"
            style={{ animation: `bcBonusPop ${BONUS_POPUP_MS}ms ease-in-out forwards` }} />
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

      {/* Chrome bar */}
      <div className={`${raised} relative flex items-center justify-between px-4 py-3 mb-3`}>
        <button onClick={() => (inGame ? setShowForfeit(true) : navigate('/'))} className={btn98}>
          {inGame ? 'Forfeit' : 'Exit'}
        </button>
        <img src="/game/logo-battlechips.webp" alt="Battle Chips"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 md:h-16 w-auto pointer-events-none" />
        <button onClick={newMatch} className={btn98}>New match</button>
      </div>

      {/* Status strip */}
      <div className={`${raised} p-0.5 mb-3`}>
        <div className={`${sunken} bg-[#efefef] flex flex-wrap gap-2 items-center justify-between px-3 py-1.5`}>
          <span className="font-mono text-[13px] tracking-widest uppercase">
            {phase === 'idle' ? 'Standby' : phase === 'setup' ? 'Private setup' : phase === 'battle' ? 'Battle' : 'Game over'}
          </span>
          <span className="text-sm">{statusText}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_1fr] gap-4 items-start max-w-[1700px] mx-auto">
        {/* YOUR side */}
        <div className="flex gap-2">
          <Rack cards={cards.you} playable={canPlayCards} onPlay={playCard} />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Board
              title="Your fleet"
              right={phase === 'idle' ? 'standby' : phase === 'setup' ? `${yourFleet.length}/${FLEET.length} ships` : `boats left: ${yourBoats}`}
              ships={yourFleet} showShips sunk={[]} shots={foeShots}
              clickable={phase === 'setup' && !waitingDone}
              outlined={(phase === 'setup' && !waitingDone) || (phase === 'battle' && turn === 'you')}
              onCell={onYourCell}
              onShip={phase === 'setup' && !waitingDone && !pending ? pickUp : undefined}
              animating={anim.you}
              pending={phase === 'setup' ? pending : null}
              onPendingMove={tryMovePending}
            />
            {phase === 'setup' && !waitingDone && (
              <div className="flex items-center justify-center gap-2">
                {allLocked ? (
                  <>
                    <button onClick={() => setEditMode(true)} className={btn98} disabled={editMode}>EDIT</button>
                    <button onClick={pressDone} className={btn98}>DONE</button>
                  </>
                ) : (
                  <>
                    <button onClick={rotatePending} disabled={!pending} className={`${btn98} !px-3`} aria-label="Rotate left">◄</button>
                    <button onClick={lockPending} disabled={!pending} className={btn98}>PLACE</button>
                    <button onClick={rotatePending} disabled={!pending} className={`${btn98} !px-3`} aria-label="Rotate right">►</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* center column */}
        <div className="flex flex-col gap-4 order-first lg:order-none">
          <div className={`${raised} p-2 flex gap-2 justify-center`}>
            <div className={`${sunken} h-14 flex-1 flex items-center justify-center`} style={{ backgroundColor: '#1b1b1b' }}>
              {phase === 'over' ? <SegWord word="GAME" /> : <SegClock seconds={clock} on={phase === 'setup' || (phase === 'battle' && turn === 'you')} />}
            </div>
            <div className={`${sunken} h-14 flex-1 flex items-center justify-center`} style={{ backgroundColor: '#1b1b1b' }}>
              {phase === 'over' ? <SegWord word="OVER" /> : <SegClock seconds={clock} on={phase === 'battle' && turn === 'foe'} />}
            </div>
          </div>

          {/* rockets = shots the active player has left */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {Array.from({ length: rocketSlots }, (_, i) => (
              <Missile key={i} live={i < shotsLeft} />
            ))}
          </div>

          {/* colour slots — each shows the action card dealt into it for this spin */}
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
                  <div className="bg-[#c3c3c3] h-14 flex items-center justify-center">
                    {card
                      ? <span className={`${CARD_INFO[card].cls} text-white font-bold text-[11px] px-1.5 py-1 rounded-sm border border-black/40 leading-none`}>{CARD_INFO[card].label}</span>
                      : <span className="text-[#8a8a8a] font-bold text-lg">?</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`${raised} p-1`}>
            <div className="relative bg-[#bdbdbd] aspect-square overflow-hidden">
              <img src="/game/roulette-base.png" alt="" className="absolute inset-0 w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
              <img src="/game/roulette-wheel.png" alt="Roulette wheel"
                className={`absolute inset-[2.5%] w-[95%] h-[95%] ${bonus ? '' : 'animate-[spin_12s_linear_infinite]'}`}
                style={bonus
                  ? { imageRendering: 'pixelated', transform: `rotate(${wheelAngle}deg)`, transition: `transform ${SPIN_MS}ms cubic-bezier(0.17,0.67,0.12,0.99)` }
                  : { imageRendering: 'pixelated' }} />
            </div>
          </div>
        </div>

        {/* ENEMY side */}
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <Board
              title="Enemy waters"
              right={phase === 'battle' || phase === 'over' ? `boats left: ${foeBoats}` : 'awaiting battle'}
              ships={foeFleet} showShips={false}
              sunk={phase === 'battle' || phase === 'over' ? sunkShips(foeFleet, yourShots) : []}
              shots={yourShots}
              clickable={phase === 'battle' && turn === 'you' && shotsLeft > 0 && !bonus && !showForfeit}
              outlined={phase === 'battle' && turn === 'foe'}
              onCell={fireAt}
              animating={anim.foe}
              crosshair
            />
          </div>
          <Rack cards={cards.foe} playable={false} />
        </div>
      </div>
    </div>
  );
};

export default TestGame;
