/* Miss every shot in your turn and the opponent spins; and the other way round. */
import { launch, open, P, done, settled, AUDIO_REGISTRY, DESKTOP } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await page.getByRole('button', { name: 'FREE PLAY' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Play the House' }).click();
await settled(page, 9000); await page.waitForTimeout(600);
await page.evaluate(() => window.__BC.testBattle());
await page.waitForTimeout(600);

const fireAt = (idx) => page.evaluate((i) => {
  const grid = [...document.querySelectorAll('button')].filter(
    (b) => b.parentElement?.className.includes('grid-cols-10') && !b.disabled);
  // grid buttons are cells 0..99 in order, minus already-shot ones — index the
  // full board through the enabled list's data
  const all = [...document.querySelectorAll('button')].filter(
    (b) => b.parentElement?.className.includes('grid-cols-10'));
  all[i].click();
}, idx);
const st = () => page.evaluate(() => ({
  turn: window.__BC.turn, bonus: window.__BC.bonus, shots: window.__BC.shotsLeft,
  spin: !!window.__BC.bonus,
}));
const until = async (fn, ms = 15000) => {
  for (let i = 0; i < ms / 200; i++) {
    if (await page.evaluate(fn)) return true;
    await page.waitForTimeout(200);
  }
  return false;
};

/* --- five straight misses gift the foe a spin, then their turn --- */
const empty = await page.evaluate(() => {
  const taken = new Set(window.__BC.foeCells());
  return Array.from({ length: 100 }, (_, i) => i).filter((i) => !taken.has(i)).slice(0, 5);
});
console.log('  firing at open water:', JSON.stringify(empty));
for (const c of empty) { await fireAt(c); await page.waitForTimeout(350); }
P('the foe is granted a spin for the whiff',
  await until(() => window.__BC.bonus?.who === 'foe'));
P('their turn only starts after the wheel',
  (await st()).turn === 'you');
P('and it does start once the spin has played',
  await until(() => window.__BC.turn === 'foe', 20000));

/* --- their turn runs; when it ends without a hit, YOU spin --- */
// The AI fires at random into a 5-boat board, so it can hit. Whichever way the
// turn ends, the game must keep moving: either your gift spin or your turn.
P('the game moves on after their volley',
  await until(() => window.__BC.turn === 'you' || window.__BC.bonus?.who === 'you', 30000));
const after = await st();
console.log('  after their turn:', JSON.stringify({ turn: after.turn, bonus: after.bonus?.who ?? null }));
if (after.bonus?.who === 'you') {
  console.log('  (they whiffed — resolving the gift spin)');
  await page.getByRole('button', { name: /RED/ }).first().click();
  await until(() => !window.__BC.bonus, 20000);
}

/* --- a turn WITH a hit gifts nothing --- */
await until(() => window.__BC.turn === 'you', 30000);
const plan = await page.evaluate(() => {
  const taken = new Set(window.__BC.foeCells());
  const shot = new Set(Object.keys(window.__BC.yourShots).map(Number));
  const open = Array.from({ length: 100 }, (_, i) => i).filter((i) => !shot.has(i));
  const hit = open.find((i) => taken.has(i));
  const misses = open.filter((i) => !taken.has(i)).slice(0, 4);
  return { hit, misses, shots: window.__BC.shotsLeft };
});
console.log('  one hit then misses:', JSON.stringify(plan));
await fireAt(plan.hit); await page.waitForTimeout(2600);        // hit beat is long
for (const c of plan.misses.slice(0, plan.shots - 1)) { await fireAt(c); await page.waitForTimeout(350); }
// if the hit sank something a real spin appears — resolve it and accept the turn
const gifted = await page.evaluate(() => window.__BC.bonus?.who ?? null);
P('a turn containing a hit never gifts the foe a spin', gifted !== 'foe');

await browser.close();
done();
