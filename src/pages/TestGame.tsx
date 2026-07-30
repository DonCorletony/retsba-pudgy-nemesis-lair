import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SECRET game lab (/testgame) — Battleship-with-roulette prototype.
 * Windows 98-inspired UI per the provided mockup: gray chrome, beveled panels,
 * two 10x10 mine boards flanking a roulette column (RED/GREEN/BLACK + wheel area).
 *
 * Implemented so far: private pass-and-play mine setup (15 per player), New match,
 * Exit. Roulette displays/bets/battle phase are placeholders pending game rules.
 */

const GRID = 10;
const MINES_PER_PLAYER = 15;

// Win98 bevel helpers. Double bevel approximated with border + inset shadows.
const raised =
  'bg-[#c3c3c3] border-2 border-t-white border-l-white border-b-[#5c5c5c] border-r-[#5c5c5c] shadow-[inset_1px_1px_0_#e6e6e6,inset_-1px_-1px_0_#8a8a8a]';
const sunken =
  'bg-[#c3c3c3] border-2 border-t-[#5c5c5c] border-l-[#5c5c5c] border-b-white border-r-white shadow-[inset_-1px_-1px_0_#e6e6e6,inset_1px_1px_0_#8a8a8a]';
const btn98 =
  `${raised} px-5 py-1.5 font-bold text-black text-sm active:border-t-[#5c5c5c] active:border-l-[#5c5c5c] active:border-b-white active:border-r-white select-none`;

type Phase = 'setup-p1' | 'setup-p2' | 'ready';
type Cells = boolean[]; // GRID*GRID mine flags

const emptyCells = (): Cells => Array(GRID * GRID).fill(false);

// Hoisted (NOT defined inside TestGame): an inline component would get a new identity
// every render, remounting all 100 cells on each click.
const Board = ({ player, cells, count, active, onToggle }: {
  player: 1 | 2;
  cells: Cells;
  count: number;
  active: boolean;
  onToggle: (player: 1 | 2, idx: number) => void;
}) => (
  <div className={`${raised} p-1.5`}>
    <div className="flex items-center justify-between px-2 py-1.5 font-mono text-[13px] text-black">
      <span>Player {player} mines</span>
      <span>{count}/{MINES_PER_PLAYER} mines</span>
    </div>
    <div className={`${sunken} p-1`}>
      <div className="grid grid-cols-10 bg-white">
        {cells.map((mined, i) => (
          <button
            key={i}
            onClick={() => onToggle(player, i)}
            disabled={!active}
            className={`aspect-square border border-[#b5b5b5] bg-white ${active ? 'hover:bg-[#eaeaea] cursor-pointer' : 'cursor-default'} flex items-center justify-center`}
          >
            {mined && active && <span className="block w-1/2 h-1/2 rounded-full bg-black" />}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const TestGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('setup-p1');
  const [p1, setP1] = useState<Cells>(emptyCells);
  const [p2, setP2] = useState<Cells>(emptyCells);

  const p1Count = useMemo(() => p1.filter(Boolean).length, [p1]);
  const p2Count = useMemo(() => p2.filter(Boolean).length, [p2]);

  const newMatch = () => { setP1(emptyCells()); setP2(emptyCells()); setPhase('setup-p1'); };

  const toggleMine = (player: 1 | 2, idx: number) => {
    if (player === 1 && phase !== 'setup-p1') return;
    if (player === 2 && phase !== 'setup-p2') return;
    const [cells, setCells, count] = player === 1 ? [p1, setP1, p1Count] : [p2, setP2, p2Count];
    const placing = !cells[idx];
    if (placing && count >= MINES_PER_PLAYER) return;
    const next = [...cells];
    next[idx] = placing;
    setCells(next);
    // Auto-advance when the last mine goes down.
    const newCount = count + (placing ? 1 : -1);
    if (newCount === MINES_PER_PLAYER) setPhase(player === 1 ? 'setup-p2' : 'ready');
  };

  const statusText =
    phase === 'setup-p1' ? `Player 1: place ${MINES_PER_PLAYER - p1Count} more mines.`
    : phase === 'setup-p2' ? `Player 2: place ${MINES_PER_PLAYER - p2Count} more mines.`
    : 'Setup complete. Battle phase coming soon.';

  // Private setup: a board's mines are only visible while that player is placing.
  const showMines = (player: 1 | 2) =>
    (player === 1 && phase === 'setup-p1') || (player === 2 && phase === 'setup-p2');

  return (
    <div className="min-h-screen bg-[#b8b8b8] p-3 md:p-4 font-sans text-black">
      {/* Chrome bar */}
      <div className={`${raised} flex items-center justify-between px-4 py-3 mb-3`}>
        <button onClick={() => navigate('/')} className={btn98}>Exit</button>
        <button onClick={newMatch} className={btn98}>New match</button>
      </div>

      {/* Status strip */}
      <div className={`${raised} p-0.5 mb-3`}>
        <div className={`${sunken} bg-[#efefef] flex items-center justify-between px-3 py-2`}>
          <span className="font-mono text-[13px] tracking-widest uppercase">Private setup</span>
          <span className="text-sm">{statusText}</span>
        </div>
      </div>

      {/* Boards + roulette column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_1fr] gap-4 items-start max-w-[1700px] mx-auto">
        <Board player={1} cells={p1} count={p1Count} active={showMines(1)} onToggle={toggleMine} />

        <div className="flex flex-col gap-4 order-first lg:order-none">
          {/* Twin dark displays — purpose TBD with rules (spin result / turn) */}
          <div className={`${raised} p-2 flex gap-2 justify-center`}>
            <div className={`${sunken} bg-[#2a2a2a] h-14 flex-1`} />
            <div className={`${sunken} bg-[#2a2a2a] h-14 flex-1`} />
          </div>

          {/* Roulette bet boxes — static until rules are wired */}
          <div className="grid grid-cols-3 gap-2">
            {([['RED', 'bg-red-600', 'border-red-600'], ['GREEN', 'bg-green-700', 'border-green-700'], ['BLACK', 'bg-black', 'border-black']] as const).map(([label, bg, border]) => (
              <div key={label} className={`border-[3px] ${border}`}>
                <div className={`${bg} text-white text-center font-bold text-xs py-0.5`}>{label}</div>
                <div className="bg-[#c3c3c3] h-14" />
              </div>
            ))}
          </div>

          {/* Big center panel — roulette wheel / action area TBD */}
          <div className={`${raised} p-1`}>
            <div className="bg-[#bdbdbd] aspect-square" />
          </div>
        </div>

        <Board player={2} cells={p2} count={p2Count} active={showMines(2)} onToggle={toggleMine} />
      </div>
    </div>
  );
};

export default TestGame;
