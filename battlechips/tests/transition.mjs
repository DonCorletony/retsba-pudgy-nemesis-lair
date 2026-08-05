/* Moving between the title screen and the game dips through black. */
import { launch, open, P, done, AUDIO_REGISTRY } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { init: [AUDIO_REGISTRY] });

/** The dip overlay's opacity, plus which screen is behind it. */
const look = () => page.evaluate(() => {
  const veil = document.querySelector('[aria-hidden].fixed.z-\\[100\\]');
  return {
    veil: veil ? +(+getComputedStyle(veil).opacity).toFixed(2) : null,
    phase: window.__BC.phase,
    blocking: veil ? getComputedStyle(veil).pointerEvents !== 'none' : null,
  };
});
/** Sample the dip densely enough to see its shape. */
const trace = async (ms = 1900, step = 100) => {
  const out = [];
  for (let i = 0; i < ms / step; i++) { out.push(await look()); await page.waitForTimeout(step); }
  return out;
};

await page.waitForTimeout(900);
await page.mouse.click(800, 40);                       // skip the opening
await page.waitForTimeout(1200);
P('nothing over the title screen at rest', (await look()).veil === 0);

// --- into the game
const t0 = Date.now();
await page.evaluate(() => window.__BC.pressPlay());
const into = await trace(3200);
console.log('  PLAY  ', into.map((x) => `${x.veil}${x.phase[0]}`).join(' '));
P('it goes fully black on the way in', into.some((x) => x.veil === 1));
P('it never cuts — there are part-way frames', into.some((x) => x.veil > 0.05 && x.veil < 0.95));
const firstLobby = into.findIndex((x) => x.phase === 'lobby');
P(`the screen swaps while it is black (veil was ${into[firstLobby]?.veil} at the swap)`, into[firstLobby]?.veil === 1);
P('it lifts again by the end', into.at(-1).veil === 0);
P('and stops blocking clicks once lifted', into.at(-1).blocking === false);
const blackIn = into.filter((x) => x.veil > 0.9).length * 100;
P(`going in holds on black about two seconds (${blackIn}ms fully opaque, ${Date.now() - t0}ms end to end)`,
  blackIn >= 1400 && blackIn <= 2400);

// --- and back out
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Back' }).click();
const out = await trace();
console.log('  Back  ', out.map((x) => `${x.veil}${x.phase[0]}`).join(' '));
P('Back dips through black too', out.some((x) => x.veil === 1));
const blackOut = out.filter((x) => x.veil > 0.9).length * 100;
P(`but coming back is the shorter dip (${blackOut}ms vs ${blackIn}ms going in)`,
  blackOut >= 400 && blackOut < blackIn - 500);
P('with part-way frames of its own', out.some((x) => x.veil > 0.05 && x.veil < 0.95));
P('landing on the title screen', out.at(-1).phase === 'idle');
P('with the veil lifted', out.at(-1).veil === 0);

// --- forfeit's exit takes the same route
await page.evaluate(() => window.__BC.pressPlay());
await page.waitForTimeout(1900);
await page.getByRole('button', { name: 'New match' }).click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Forfeit' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Yes, Leave' }).click();
const quit = await trace(2400);
console.log('  Leave ', quit.map((x) => `${x.veil}${x.phase[0]}`).join(' '));
P('leaving a match dips as well', quit.some((x) => x.veil === 1));
P('and ends up on the lobby', quit.at(-1).phase === 'lobby' && quit.at(-1).veil === 0);

// --- New match, inside the game screen, should stay instant
await page.waitForTimeout(600);
await page.evaluate(() => window.__BC.pressPlay());
await page.waitForTimeout(1900);
await page.getByRole('button', { name: 'New match' }).click();
const inner = await trace(700);
console.log('  New   ', inner.map((x) => `${x.veil}${x.phase[0]}`).join(' '));
P('New match does not dip — it is not a screen change', inner.every((x) => x.veil === 0));

// --- a second press mid-dip must not stack another one
await page.getByRole('button', { name: 'Forfeit' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Yes, Leave' }).click();
await page.waitForTimeout(1900);
await page.evaluate(() => { window.__BC.pressPlay(); window.__BC.pressPlay(); window.__BC.pressPlay(); });
await page.waitForTimeout(2600);
const settled = await look();
P(`hammering it still settles cleanly (phase=${settled.phase}, veil=${settled.veil})`,
  settled.phase === 'lobby' && settled.veil === 0 && settled.blocking === false);

await browser.close();
done();
