import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SECRET game lab (/testgame) — BATTLE CHIPS (battleship × roulette) prototype.
 * Win98 chrome per mockup. Current increment: real assets — animated ocean grids +
 * pixel-art fleet placement (5/4/3/3/2) replacing the placeholder mine setup.
 * Roulette column (timer/displays/bets/wheel) still placeholder pending rules.
 */

const GRID = 10;

const raised =
  'bg-[#c3c3c3] border-2 border-t-white border-l-white border-b-[#5c5c5c] border-r-[#5c5c5c] shadow-[inset_1px_1px_0_#e6e6e6,inset_-1px_-1px_0_#8a8a8a]';
const sunken =
  'bg-[#c3c3c3] border-2 border-t-[#5c5c5c] border-l-[#5c5c5c] border-b-white border-r-white shadow-[inset_-1px_-1px_0_#e6e6e6,inset_1px_1px_0_#8a8a8a]';
const btn98 =
  `${raised} px-5 py-1.5 font-bold text-black text-sm active:border-t-[#5c5c5c] active:border-l-[#5c5c5c] active:border-b-white active:border-r-white select-none`;

// Fleet in placement order. Sprites are drawn VERTICAL; horizontal renders rotate them.
const FLEET = [
  { key: 'carrier', label: 'Carrier', len: 5, src: '/game/ship-carrier.png' },
  { key: 'battleship', label: 'Battleship', len: 4, src: '/game/ship-battleship.png' },
  { key: 'cruiser', label: 'Cruiser', len: 3, src: '/game/ship-cruiser.png' },
  { key: 'submarine', label: 'Submarine', len: 3, src: '/game/ship-submarine.png' },
  { key: 'destroyer', label: 'Destroyer', len: 2, src: '/game/ship-destroyer.png' },
] as const;
type ShipKey = (typeof FLEET)[number]['key'];

interface Placed { key: ShipKey; len: number; row: number; col: number; dir: 'v' | 'h'; }
type Phase = 'setup-p1' | 'setup-p2' | 'ready';

const cellsFor = (s: Placed): number[] =>
  Array.from({ length: s.len }, (_, i) => (s.dir === 'v' ? (s.row + i) * GRID + s.col : s.row * GRID + s.col + i));

const fits = (s: Placed, others: Placed[]): boolean => {
  if (s.dir === 'v' ? s.row + s.len > GRID : s.col + s.len > GRID) return false;
  const taken = new Set(others.flatMap(cellsFor));
  return cellsFor(s).every((c) => !taken.has(c));
};

const Board = ({ player, ships, active, onCellClick, onShipClick }: {
  player: 1 | 2;
  ships: Placed[];
  active: boolean;
  onCellClick: (player: 1 | 2, idx: number) => void;
  onShipClick: (player: 1 | 2, key: ShipKey) => void;
}) => (
  <div className={`${raised} p-1.5 ${active ? 'outline outline-[3px] outline-[#f2c320]' : ''}`}>
    <div className="flex items-center justify-between px-2 py-1.5 font-mono text-[13px] text-black">
      <span>Player {player} fleet</span>
      <span>{ships.length}/{FLEET.length} ships</span>
    </div>
    <div className={`${sunken} p-1`}>
      <div
        className="relative"
        style={{ backgroundImage: "url('/game/ocean.gif')", backgroundSize: 'cover', imageRendering: 'pixelated' }}
      >
        <div className="grid grid-cols-10">
          {Array.from({ length: GRID * GRID }, (_, i) => (
            <button
              key={i}
              onClick={() => onCellClick(player, i)}
              disabled={!active}
              className={`aspect-square border border-white/60 bg-transparent ${active ? 'hover:bg-white/25 cursor-pointer' : 'cursor-default'}`}
            />
          ))}
        </div>
        {/* Fleet overlay — only the placing player sees their ships (private setup). */}
        {active && (
          <div className="absolute inset-0 pointer-events-none">
            {ships.map((s) => (
              <button
                key={s.key}
                onClick={() => onShipClick(player, s.key)}
                title={`Remove ${s.key}`}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${s.col * 10}%`,
                  top: `${s.row * 10}%`,
                  width: `${(s.dir === 'h' ? s.len : 1) * 10}%`,
                  height: `${(s.dir === 'v' ? s.len : 1) * 10}%`,
                }}
              >
                <img
                  src={FLEET.find((f) => f.key === s.key)!.src}
                  alt={s.key}
                  className="absolute object-fill"
                  style={
                    s.dir === 'v'
                      ? { inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }
                      : {
                          left: '50%', top: '50%',
                          width: `${100 / s.len}%`, height: `${s.len * 100}%`,
                          transform: 'translate(-50%, -50%) rotate(90deg)',
                          imageRendering: 'pixelated',
                        }
                  }
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const TestGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('setup-p1');
  const [fleet1, setFleet1] = useState<Placed[]>([]);
  const [fleet2, setFleet2] = useState<Placed[]>([]);
  const [dir, setDir] = useState<'v' | 'h'>('v');

  const newMatch = () => { setFleet1([]); setFleet2([]); setDir('v'); setPhase('setup-p1'); };

  const activePlayer: 1 | 2 | null = phase === 'setup-p1' ? 1 : phase === 'setup-p2' ? 2 : null;
  const fleetOf = (p: 1 | 2) => (p === 1 ? fleet1 : fleet2);

  // Next unplaced ship (fleet order) for the active player.
  const nextShip = useMemo(() => {
    if (!activePlayer) return null;
    const placed = new Set(fleetOf(activePlayer).map((s) => s.key));
    return FLEET.find((f) => !placed.has(f.key)) ?? null;
  }, [phase, fleet1, fleet2]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellClick = (player: 1 | 2, idx: number) => {
    if (player !== activePlayer || !nextShip) return;
    const candidate: Placed = { key: nextShip.key, len: nextShip.len, row: Math.floor(idx / GRID), col: idx % GRID, dir };
    const current = fleetOf(player);
    if (!fits(candidate, current)) return; // out of bounds / overlap — ignored
    const next = [...current, candidate];
    (player === 1 ? setFleet1 : setFleet2)(next);
    if (next.length === FLEET.length) setPhase(player === 1 ? 'setup-p2' : 'ready');
  };

  const handleShipClick = (player: 1 | 2, key: ShipKey) => {
    if (player !== activePlayer) return;
    (player === 1 ? setFleet1 : setFleet2)(fleetOf(player).filter((s) => s.key !== key));
  };

  const statusText =
    phase === 'ready'
      ? 'Setup complete. Battle phase coming soon.'
      : `Player ${activePlayer}: place your ${nextShip?.label} (${nextShip?.len} cells).`;

  return (
    <div className="min-h-screen bg-[#b8b8b8] p-3 md:p-4 font-sans text-black">
      {/* Chrome bar */}
      <div className={`${raised} flex items-center justify-between px-4 py-3 mb-3`}>
        <button onClick={() => navigate('/')} className={btn98}>Exit</button>
        <button onClick={newMatch} className={btn98}>New match</button>
      </div>

      {/* Status strip */}
      <div className={`${raised} p-0.5 mb-3`}>
        <div className={`${sunken} bg-[#efefef] flex flex-wrap gap-2 items-center justify-between px-3 py-1.5`}>
          <span className="font-mono text-[13px] tracking-widest uppercase">Private setup</span>
          <span className="flex items-center gap-3">
            <span className="text-sm">{statusText}</span>
            {activePlayer && (
              <button onClick={() => setDir(dir === 'v' ? 'h' : 'v')} className={`${btn98} !px-3 !py-0.5 text-xs`}>
                Rotate: {dir === 'v' ? 'Vertical' : 'Horizontal'}
              </button>
            )}
          </span>
        </div>
      </div>

      {/* Boards + roulette column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_1fr] gap-4 items-start max-w-[1700px] mx-auto">
        <Board player={1} ships={fleet1} active={activePlayer === 1} onCellClick={handleCellClick} onShipClick={handleShipClick} />

        <div className="flex flex-col gap-4 order-first lg:order-none">
          <div className={`${raised} p-2 flex gap-2 justify-center`}>
            <div className={`${sunken} bg-[#2a2a2a] h-14 flex-1`} />
            <div className={`${sunken} bg-[#2a2a2a] h-14 flex-1`} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([['RED', 'bg-red-600', 'border-red-600'], ['GREEN', 'bg-green-700', 'border-green-700'], ['BLACK', 'bg-black', 'border-black']] as const).map(([label, bg, border]) => (
              <div key={label} className={`border-[3px] ${border}`}>
                <div className={`${bg} text-white text-center font-bold text-xs py-0.5`}>{label}</div>
                <div className="bg-[#c3c3c3] h-14" />
              </div>
            ))}
          </div>
          <div className={`${raised} p-1`}>
            <div className="bg-[#bdbdbd] aspect-square" />
          </div>
        </div>

        <Board player={2} ships={fleet2} active={activePlayer === 2} onCellClick={handleCellClick} onShipClick={handleShipClick} />
      </div>
    </div>
  );
};

export default TestGame;
