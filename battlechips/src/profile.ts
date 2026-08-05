/* ---------- player profile ----------
   Everything the profile window shows, kept in localStorage so it survives a
   reload and a trip back to the title screen. Pure functions, no React: the
   game records events, the window reads the totals.

   A match's sinks are counted as they happen but only banked when the match
   ends on its own terms — forfeiting throws that tally away, so a match you
   walked out of never adds to Ships Sunk. */

export interface Profile {
  username: string;
  /** ISO date, stamped the first time the profile is created. */
  memberSince: string;
  avatar: string;
  xp: number;
  wins: number;
  losses: number;
  /** Winnings only — what was actually taken, never netted against losses. */
  luckyWon: number;
  cashWon: number;
  shipsSunk: number;
}

export const PROFILE_KEY = 'battlechips.profile';
const DEFAULT_AVATAR = '/game/ship-destroyer.png';

export const newProfile = (today: string): Profile => ({
  username: 'CAPTAIN',
  memberSince: today,
  avatar: DEFAULT_AVATAR,
  xp: 0,
  wins: 0,
  losses: 0,
  luckyWon: 0,
  cashWon: 0,
  shipsSunk: 0,
});

/* ---------- levels ----------
   Each level costs a little more than the last, so early ones come quickly and
   later ones read as an achievement. Level 1 starts at 0 XP. */
export const xpForLevel = (level: number): number => {
  // cost of reaching `level` from the one below it
  let total = 0;
  for (let l = 2; l <= level; l++) total += 100 + 50 * (l - 2);
  return total;
};

export const levelFor = (xp: number): number => {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
};

/** Where the bar sits: XP into this level, and what the next one costs. */
export const levelProgress = (xp: number) => {
  const level = levelFor(xp);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  return {
    level,
    into: xp - floor,
    span: ceiling - floor,
    toNext: ceiling - xp,
    ceiling,
    fraction: (xp - floor) / (ceiling - floor),
  };
};

/* ---------- what a match is worth ---------- */
export const XP_WIN = 120;
export const XP_LOSS = 40;
export const XP_PER_SINK = 15;

export interface MatchResult {
  won: boolean;
  /** Sinks landed this match. Ignored when `forfeited`. */
  sinks: number;
  /** A match you walked out of: it counts as a loss, but its sinks do not. */
  forfeited?: boolean;
  luckyWon?: number;
  cashWon?: number;
}

export const applyMatch = (p: Profile, r: MatchResult): Profile => {
  const sinks = r.forfeited ? 0 : r.sinks;
  return {
    ...p,
    wins: p.wins + (r.won ? 1 : 0),
    losses: p.losses + (r.won ? 0 : 1),
    shipsSunk: p.shipsSunk + sinks,
    xp: p.xp + (r.won ? XP_WIN : XP_LOSS) + sinks * XP_PER_SINK,
    luckyWon: p.luckyWon + (r.luckyWon ?? 0),
    cashWon: p.cashWon + (r.cashWon ?? 0),
  };
};

/** Win rate as a percentage, 0 when nothing has been played. */
export const winRate = (p: Profile): number => {
  const played = p.wins + p.losses;
  return played ? (p.wins / played) * 100 : 0;
};

/* ---------- storage ---------- */
export const loadProfile = (today = new Date().toISOString().slice(0, 10)): Profile => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...newProfile(today), ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    /* corrupt or unavailable storage just means a fresh profile */
  }
  return newProfile(today);
};

export const saveProfile = (p: Profile): void => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* a profile that can't be written is not worth breaking a match over */
  }
};

/** "July 2026" — the form the profile window shows. */
export const memberSinceLabel = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
