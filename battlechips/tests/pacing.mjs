/* Outcomes get room to land before the game moves on. */
import { launch, open, P, done, settled, AUDIO_REGISTRY, DESKTOP } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await page.getByRole('button', { name: 'FREE PLAY' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Play the House' }).click();
await settled(page, 9000); await page.waitForTimeout(600);   // PREPARING GAME burns ~5s

/** Time from `go` until `until` reads true. */
const timeTo = (go, until) => page.evaluate(async ([go, until]) => {
  const start = new Function('return ' + go)();
  const ready = new Function('return ' + until)();
  const t0 = performance.now();
  start();
  for (let i = 0; i < 400; i++) {
    if (ready()) return Math.round(performance.now() - t0);
    await new Promise((r) => setTimeout(r, 25));
  }
  return -1;
}, [go.toString(), until.toString()]);

/** A fresh match, sat in battle with the foe's fleet on the board. */
const freshMatch = async () => {
  if (await page.getByRole('button', { name: 'Forfeit' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Forfeit' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Yes, Leave' }).click();
    await settled(page); await page.waitForTimeout(500);
  }
  await page.getByRole('button', { name: 'New match' }).click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__BC.testBattle());
  await page.waitForTimeout(500);
  const ready = await page.evaluate(() => window.__BC.foeFleet.length);
  if (!ready) throw new Error('foe fleet never arrived');
};

await freshMatch();

// --- sinking: the wheel waits for the explosion ---
const sink = await timeTo(() => window.__BC.testSinkFire(), () => !!window.__BC.bonus);
console.log('  sink -> wheel:', sink, 'ms');
P(`the wheel waits for the boat to finish burning (${sink}ms)`, sink >= 1900);

// --- the last shot of a turn, fired for real through the board ---
await freshMatch();
/** The enemy grid is the one whose cells are live. */
const fireAt = (n) => page.evaluate((k) => {
  const live = [...document.querySelectorAll('button')].filter(
    (b) => b.parentElement?.className.includes('grid-cols-10') && !b.disabled);
  live[k].click();
}, n);
const shots = await page.evaluate(() => window.__BC.shotsLeft);
console.log('  shots this turn:', shots);
for (let n = 0; n < shots - 1; n++) { await fireAt(0); await page.waitForTimeout(600); }
const beat = await timeTo(
  () => {
    const live = [...document.querySelectorAll('button')].filter(
      (b) => b.parentElement?.className.includes('grid-cols-10') && !b.disabled);
    live[0].click();
  },
  () => window.__BC.turn === 'foe');
console.log('  last shot -> handover:', beat, 'ms');
P(`the last shot of a turn is left to land (${beat}ms)`, beat >= 900);
P('and the turn does change hands after it', beat > 0);

await browser.close();
done();
