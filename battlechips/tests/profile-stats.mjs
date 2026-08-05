/* What a match does to the profile — including the forfeit rule. */
import { launch, open, P, done, AUDIO_REGISTRY, DESKTOP } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);

const run = (fn, arg) => page.evaluate(([src, a]) => {
  const m = window.__PROFILE;
  return new Function('m', 'a', `return (${src})(m, a)`)(m, a);
}, [fn.toString(), arg]);

const base = await run((m) => m.newProfile('2026-07-01'));
P('a fresh profile starts empty', base.wins === 0 && base.losses === 0 && base.shipsSunk === 0 && base.xp === 0);
P('and stamps the month it was made',
  (await run((m) => m.memberSinceLabel('2026-07-01'))) === 'July 2026');

const won = await run((m) => m.applyMatch(m.newProfile('2026-07-01'), { won: true, sinks: 5 }));
console.log('  after a win with 5 sinks:', JSON.stringify({ w: won.wins, l: won.losses, s: won.shipsSunk, xp: won.xp }));
P('a win counts once', won.wins === 1 && won.losses === 0);
P('its sinks are banked', won.shipsSunk === 5);
P('and it pays win XP plus per-sink XP', won.xp === 120 + 5 * 15);

const lost = await run((m) => m.applyMatch(m.newProfile('2026-07-01'), { won: false, sinks: 3 }));
P('a loss counts as a loss but still banks its sinks', lost.losses === 1 && lost.shipsSunk === 3);

const quit = await run((m) => m.applyMatch(m.newProfile('2026-07-01'), { won: false, sinks: 4, forfeited: true }));
console.log('  after forfeiting with 4 sinks:', JSON.stringify({ l: quit.losses, s: quit.shipsSunk, xp: quit.xp }));
P('a forfeit counts as a loss', quit.losses === 1);
P('but its ships sunk are thrown away', quit.shipsSunk === 0);
P('and it earns no sink XP', quit.xp === 40);

const paid = await run((m) => m.applyMatch(m.newProfile('2026-07-01'), { won: true, sinks: 0, luckyWon: 500, cashWon: 2.5 }));
P('winnings accumulate', paid.luckyWon === 500 && paid.cashWon === 2.5);
const paid2 = await run((m) => m.applyMatch(
  m.applyMatch(m.newProfile('2026-07-01'), { won: true, sinks: 0, luckyWon: 500, cashWon: 2.5 }),
  { won: false, sinks: 0 }));
P('and a loss never subtracts from them', paid2.luckyWon === 500 && paid2.cashWon === 2.5);

const rate = await run((m) => m.winRate({ ...m.newProfile('2026-07-01'), wins: 22, losses: 54 }));
P(`the win rate reads 28.9% at 22-54 (${rate.toFixed(1)})`, Math.abs(rate - 28.947) < 0.01);
P('and is 0 before anything is played', (await run((m) => m.winRate(m.newProfile('2026-07-01')))) === 0);

const lv = await run((m) => m.levelProgress(0));
P('a new player is level 1 with a full bar to climb', lv.level === 1 && lv.into === 0 && lv.fraction === 0);
const lv2 = await run((m) => m.levelProgress(100));
P('100 XP reaches level 2', lv2.level === 2);
const climb = await run((m) => [1, 2, 3, 10].map((l) => m.xpForLevel(l)));
console.log('  XP to reach levels 1,2,3,10:', JSON.stringify(climb));
P('each level costs more than the last',
  climb[1] - climb[0] < climb[2] - climb[1] && climb[3] > climb[2]);

await browser.close();
done();
