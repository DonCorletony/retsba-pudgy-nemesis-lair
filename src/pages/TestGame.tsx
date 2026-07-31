import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SECRET game lab (/testgame) — BATTLE CHIPS (battleship × roulette).
 *
 * Setup sequence (per spec):
 * - Tap the grid to spawn the next boat where you tapped; it shows OUTLINED IN
 *   YELLOW and can be moved freely (tap a cell OR drag it) until locked.
 * - Under your grid: [◄] [PLACE] [►] — arrows rotate the pending boat 90°,
 *   PLACE locks it. Next grid tap spawns the next boat.
 * - When all 5 are locked the controls become [EDIT] [DONE]. EDIT lets you pick
 *   a boat back up (PLACE/arrows return); DONE locks your board and waits for
 *   the opponent's DONE or the setup timer, whichever comes first (the local
 *   dummy opponent "presses DONE" a few seconds later).
 * - Setup timer expiry still auto-places whatever is missing and begins battle.
 *
 * Battle rules unchanged: 5 shots/15s → 3/10s (either side at 2 boats) → 1/5s
 * (1 boat); explosion gif on hits → persistent icon; yellow outline = whose turn.
 */

const GRID = 10;
const SETUP_SECONDS = 30;
const EXPLOSION_MS = 2100;

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

/** Clamp an anchor so the ship stays on the board for its orientation. */
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

const stageFor = (minBoats: number): { shots: number; secs: number } =>
  minBoats <= 1 ? { shots: 1, secs: 5 } : minBoats === 2 ? { shots: 3, secs: 10 } : { shots: 5, secs: 15 };

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

/* ---------- missiles (shots left) ---------- */
const Missile = ({ live }: { live: boolean }) => (
  <svg viewBox="0 0 24 8" className="h-3 w-9">
    <g fill={live ? '#7d7d7d' : '#4b4b4b'} opacity={live ? 1 : 0.45}>
      <polygon points="0,0 3,2 3,6 0,8" />
      <rect x="3" y="2" width="12" height="4" />
      <polygon points="15,0.5 23,4 15,7.5" />
    </g>
  </svg>
);

/* ---------- ship sprite ---------- */
const ShipImg = ({ s }: { s: Placed }) => (
  <img src={FLEET.find((f) => f.key === s.key)!.src} alt={s.key}
    className="absolute object-fill"
    style={s.dir === 'v'
      ? { inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }
      : { left: '50%', top: '50%', width: `${100 / s.len}%`, height: `${s.len * 100}%`, transform: 'translate(-50%, -50%) rotate(90deg)', imageRendering: 'pixelated' }} />
);

/* ---------- board ---------- */
const Board = ({ title, right, ships, showShips, sunk, shots, clickable, outlined, onCell, onShip, animating, pending, onPendingMove }: {
  title: string;
  right: string;
  ships: Placed[];
  showShips: boolean;
  sunk: Placed[];
  shots: Shots;
  clickable: boolean;
  outlined: boolean;
  onCell?: (idx: number) => void;
  onShip?: (key: ShipKey) => void;
  animating?: Record<number, true>;
  pending?: Placed | null;             // yellow-outlined boat being positioned
  onPendingMove?: (row: number, col: number) => void;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ dr: number; dc: number } | null>(null);

  const cellFromPointer = (e: React.PointerEvent): { row: number; col: number } | null => {
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
                className={`aspect-square border border-white/60 bg-transparent ${clickable && shots[i] === undefined ? 'hover:bg-white/25 cursor-pointer' : 'cursor-default'}`} />
            ))}
          </div>

          {/* locked / revealed ships */}
          <div className="absolute inset-0 pointer-events-none">
            {(showShips ? ships : sunk).map((s) => (
              <button key={s.key} onClick={() => onShip?.(s.key)}
                className={`absolute ${onShip ? 'pointer-events-auto cursor-pointer' : ''}`}
                style={{ left: `${s.col * 10}%`, top: `${s.row * 10}%`, width: `${(s.dir === 'h' ? s.len : 1) * 10}%`, height: `${(s.dir === 'v' ? s.len : 1) * 10}%` }}>
                <ShipImg s={s} />
              </button>
            ))}
            {/* pending ship — yellow outline, draggable (tap a cell also moves it) */}
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

          {/* shot markers */}
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
  const [yourFleet, setYourFleet] = useState<Placed[]>([]);        // LOCKED boats
  const [pending, setPending] = useState<Placed | null>(null);     // boat being positioned
  const [editMode, setEditMode] = useState(false);
  const [waitingDone, setWaitingDone] = useState(false);
  const [foeFleet, setFoeFleet] = useState<Placed[]>([]);
  const [yourShots, setYourShots] = useState<Shots>({});
  const [foeShots, setFoeShots] = useState<Shots>({});
  const [turn, setTurn] = useState<'you' | 'foe'>('you');
  const [shotsLeft, setShotsLeft] = useState(5);
  const [clock, setClock] = useState(SETUP_SECONDS);
  const [winner, setWinner] = useState<'you' | 'foe' | null>(null);
  const [anim, setAnim] = useState<{ you: Record<number, true>; foe: Record<number, true> }>({ you: {}, foe: {} });
  const foeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oppDoneRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yourBoats = boatsRemaining(yourFleet, foeShots);
  const foeBoats = phase === 'battle' || phase === 'over' ? boatsRemaining(foeFleet, yourShots) : FLEET.length;

  const nextShip = useMemo(() => {
    const used = new Set([...yourFleet.map((s) => s.key), ...(pending ? [pending.key] : [])]);
    return FLEET.find((f) => !used.has(f.key)) ?? null;
  }, [yourFleet, pending]);

  const allLocked = yourFleet.length === FLEET.length && !pending;

  const playExplosion = (board: 'you' | 'foe', idx: number) => {
    setAnim((prev) => ({ ...prev, [board]: { ...prev[board], [idx]: true as const } }));
    setTimeout(() => {
      setAnim((prev) => {
        const cells = { ...prev[board] };
        delete cells[idx];
        return { ...prev, [board]: cells };
      });
    }, EXPLOSION_MS);
  };

  const newMatch = () => {
    if (oppDoneRef.current) clearTimeout(oppDoneRef.current);
    setPhase('setup'); setYourFleet([]); setPending(null); setEditMode(false); setWaitingDone(false);
    setFoeFleet([]); setYourShots({}); setFoeShots({}); setTurn('you'); setShotsLeft(5);
    setClock(SETUP_SECONDS); setWinner(null); setAnim({ you: {}, foe: {} });
  };

  const beginBattle = (locked: Placed[], pend: Placed | null) => {
    if (oppDoneRef.current) clearTimeout(oppDoneRef.current);
    const mine = autoPlace(pend ? [...locked, pend] : locked);
    setYourFleet(mine); setPending(null); setEditMode(false); setWaitingDone(false);
    setFoeFleet(autoPlace([]));
    const stage = stageFor(FLEET.length);
    setPhase('battle'); setTurn('you'); setShotsLeft(stage.shots); setClock(stage.secs);
  };

  const startTurn = (who: 'you' | 'foe', yFleet: Placed[], fFleet: Placed[], yShots: Shots, fShots: Shots) => {
    const stage = stageFor(Math.min(boatsRemaining(yFleet, fShots), boatsRemaining(fFleet, yShots)));
    setTurn(who); setShotsLeft(stage.shots); setClock(stage.secs);
  };

  /* master clock */
  useEffect(() => {
    if (phase === 'idle' || phase === 'over') return;
    const id = setInterval(() => setClock((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [phase, turn]);

  /* clock expiry */
  useEffect(() => {
    if (clock > 0 || phase === 'idle' || phase === 'over') return;
    if (phase === 'setup') { beginBattle(yourFleet, pending); return; }
    if (phase === 'battle') startTurn(turn === 'you' ? 'foe' : 'you', yourFleet, foeFleet, yourShots, foeShots);
  }, [clock]); // eslint-disable-line react-hooks/exhaustive-deps

  /* dummy opponent fire */
  useEffect(() => {
    if (phase !== 'battle' || turn !== 'foe') return;
    let remaining = shotsLeft;
    foeTimerRef.current = setInterval(() => {
      setFoeShots((prev) => {
        const open = Array.from({ length: GRID * GRID }, (_, i) => i).filter((i) => prev[i] === undefined);
        if (open.length === 0 || remaining <= 0) return prev;
        const target = open[Math.floor(Math.random() * open.length)];
        const isHit = new Set(yourFleet.flatMap(cellsFor)).has(target);
        const next = { ...prev, [target]: isHit ? 'hit' as const : 'miss' as const };
        if (isHit) playExplosion('you', target);
        remaining -= 1;
        if (boatsRemaining(yourFleet, next) === 0) {
          setWinner('foe'); setPhase('over');
        } else if (remaining <= 0) {
          setTimeout(() => startTurn('you', yourFleet, foeFleet, yourShots, next), 700);
        }
        return next;
      });
    }, 1000);
    return () => { if (foeTimerRef.current) clearInterval(foeTimerRef.current); };
  }, [phase, turn]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- setup interactions ---- */
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
    // Local stand-in for the opponent's DONE (2–6s), capped by the setup clock.
    oppDoneRef.current = setTimeout(() => beginBattle(yourFleet, null), 2000 + Math.random() * 4000);
  };

  /* ---- firing ---- */
  const fireAt = (idx: number) => {
    if (phase !== 'battle' || turn !== 'you' || shotsLeft <= 0 || yourShots[idx] !== undefined) return;
    const isHit = new Set(foeFleet.flatMap(cellsFor)).has(idx);
    const next = { ...yourShots, [idx]: isHit ? 'hit' as const : 'miss' as const };
    setYourShots(next);
    if (isHit) playExplosion('foe', idx);
    const left = shotsLeft - 1;
    setShotsLeft(left);
    if (boatsRemaining(foeFleet, next) === 0) { setWinner('you'); setPhase('over'); return; }
    if (left <= 0) setTimeout(() => startTurn('foe', yourFleet, foeFleet, next, foeShots), 700);
  };

  const statusText =
    phase === 'idle' ? 'Press New match to begin.'
    : phase === 'setup' ? (
        waitingDone ? 'Board locked — waiting for opponent…'
        : pending ? `Position your ${FLEET.find((f) => f.key === pending.key)!.label} — press PLACE to lock it in.`
        : allLocked ? 'Fleet ready — EDIT to adjust, DONE to lock in.'
        : editMode || yourFleet.length > 0 && !nextShip ? 'Tap a boat to pick it up.'
        : nextShip ? `Tap the grid to spawn your ${nextShip.label} (${nextShip.len} cells).`
        : 'Tap a boat to pick it up.'
      )
    : phase === 'battle' ? (turn === 'you' ? `Your turn — fire! ${shotsLeft} shot${shotsLeft === 1 ? '' : 's'} left.` : 'Enemy turn…')
    : winner === 'you' ? 'VICTORY — enemy fleet destroyed.' : 'DEFEAT — your fleet is gone.';

  const maxShots = stageFor(Math.min(yourBoats, foeBoats)).shots;

  if (typeof window !== 'undefined') {
    (window as any).__BC = { phase, turn, shotsLeft, clock, yourBoats, foeBoats, foeFleet, winner, pending, yourFleet, waitingDone, editMode };
  }

  return (
    <div className="min-h-screen bg-[#b8b8b8] p-3 md:p-4 font-sans text-black">
      {/* Chrome bar */}
      <div className={`${raised} relative flex items-center justify-between px-4 py-3 mb-3`}>
        <button onClick={() => navigate('/')} className={btn98}>Exit</button>
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
        {/* YOUR side: board + placement controls beneath */}
        <div className="flex flex-col gap-2">
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

        {/* center column */}
        <div className="flex flex-col gap-4 order-first lg:order-none">
          <div className={`${raised} p-2 flex gap-2 justify-center`}>
            <div className={`${sunken} h-14 flex-1 flex items-center justify-center`} style={{ backgroundColor: '#1b1b1b' }}>
              <SegClock seconds={clock} on={phase === 'setup' || (phase === 'battle' && turn === 'you')} />
            </div>
            <div className={`${sunken} h-14 flex-1 flex items-center justify-center`} style={{ backgroundColor: '#1b1b1b' }}>
              <SegClock seconds={clock} on={phase === 'battle' && turn === 'foe'} />
            </div>
          </div>

          <div className="flex justify-center gap-1.5">
            {Array.from({ length: maxShots }, (_, i) => (
              <Missile key={i} live={turn === 'you' ? i < shotsLeft : true} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {([['RED', 'bg-red-600', 'border-red-600'], ['GREEN', 'bg-green-700', 'border-green-700'], ['BLACK', 'bg-black', 'border-black']] as const).map(([label, bg, border]) => (
              <div key={label} className={`border-[3px] ${border}`}>
                <div className={`${bg} text-white text-center font-bold text-xs py-0.5`}>{label}</div>
                <div className="bg-[#c3c3c3] h-14" />
              </div>
            ))}
          </div>

          {/* Roulette: static base, spinning wheel (bet-triggered spins come with rules) */}
          <div className={`${raised} p-1`}>
            <div className="relative bg-[#bdbdbd] aspect-square overflow-hidden">
              <img src="/game/roulette-base.png" alt="" className="absolute inset-0 w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
              <img src="/game/roulette-wheel.png" alt="Roulette wheel"
                className="absolute inset-[2.5%] w-[95%] h-[95%] animate-[spin_12s_linear_infinite]"
                style={{ imageRendering: 'pixelated' }} />
            </div>
          </div>
        </div>

        {/* ENEMY board */}
        <Board
          title="Enemy waters"
          right={phase === 'battle' || phase === 'over' ? `boats left: ${foeBoats}` : 'awaiting battle'}
          ships={foeFleet} showShips={false}
          sunk={phase === 'battle' || phase === 'over' ? sunkShips(foeFleet, yourShots) : []}
          shots={yourShots}
          clickable={phase === 'battle' && turn === 'you' && shotsLeft > 0}
          outlined={phase === 'battle' && turn === 'foe'}
          onCell={fireAt}
          animating={anim.foe}
        />
      </div>
    </div>
  );
};

export default TestGame;
