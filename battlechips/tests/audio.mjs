/* Autoplay. There is no way to make a browser play unprompted — this pins down
   what we do instead: try anyway, and hold the cue for the first gesture.

   Careful: page.evaluate()/waitForFunction() give the page a user gesture, so
   anything measured after one proves nothing. The probe below installs itself
   before load and is only read out at the end. */
import { launch, open, P, done } from './lib.mjs';

const INSTRUMENT = `
  window.__audio = { attempts: [], played: [], t0: performance.now() };
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const src = (this.currentSrc || this.src || '').split('/').pop();
    const t = Math.round(performance.now() - window.__audio.t0);
    window.__audio.attempts.push({ src, t });
    return orig.call(this).then((r) => { window.__audio.played.push({ src, t }); return r; },
                                (e) => { window.__audio.attempts.at(-1).err = e.name; throw e; });
  };`;

/* Every way a page might try to slip past the block, measured without a
   gesture anywhere. All of them are refused; this is here so the claim stays
   checked rather than remembered. */
const BYPASS_PROBE = `
window.__probe = {};
addEventListener('DOMContentLoaded', async () => {
  const out = window.__probe;
  const attempt = async (name, setup) => {
    const a = new Audio('/game/sounds/chime.wav');
    setup(a);
    try { await a.play(); out[name] = 'allowed'; } catch (e) { out[name] = e.name; }
  };
  await attempt('full volume', (a) => { a.volume = 1; });
  await attempt('volume 0, raised later', (a) => { a.volume = 0; setTimeout(() => { a.volume = 1; }, 60); });
  await attempt('muted, unmuted later', (a) => { a.muted = true; setTimeout(() => { a.muted = false; }, 60); });
  out.done = true;
});`;

// both wordings are in the DOM, one hidden per breakpoint — target the container
const nudge = (page) => page.locator('[role="status"]');
const revealed = async (page) => { await page.waitForTimeout(1100); return page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /SETTINGS/.test(x.textContent));
  return b ? +getComputedStyle(b.parentElement).opacity === 1 : false; }); };

for (const policy of ['block', 'allow']) {
  console.log(`\n--- browser ${policy === 'block' ? 'refuses autoplay (a fresh visitor)' : 'permits it (a site it trusts)'} ---`);
  const browser = await launch(policy);

  // 1. Land and touch nothing.
  const page = await open(browser, { init: [INSTRUMENT] });
  await page.waitForTimeout(2600);
  const passive = await page.evaluate(() => window.__audio);
  console.log('  untouched:', JSON.stringify({ attempts: passive.attempts, played: passive.played.length }));
  if (policy === 'allow') {
    P('the chime plays on its own, no click needed', passive.played.some((p) => /chime/.test(p.src)));
    P('and no nudge is shown', (await nudge(page).count()) === 0);
  } else {
    P('the chime is refused', passive.attempts.some((a) => a.err === 'NotAllowedError'));
    P('nothing sounded', passive.played.length === 0);
    P('a nudge appears', await nudge(page).isVisible());
  }
  await page.close();

  // 2. Click while the studio card is still up.
  const p2 = await open(browser, { init: [INSTRUMENT] });
  await p2.waitForTimeout(1200);
  await p2.mouse.click(800, 40);
  await p2.waitForTimeout(700);
  const after = await p2.evaluate(() => window.__audio);
  console.log('  clicked at 1.2s:', JSON.stringify(after.played));
  if (policy === 'block') {
    P('the held chime fires on that first click', after.played.some((p) => /chime/.test(p.src)));
    P('the nudge goes away', (await nudge(p2).count()) === 0);
    P('and that click buys sound only — it does not skip the opening', !(await revealed(p2)));
    await p2.mouse.click(800, 40);
    P('a second click skips', await revealed(p2));
  } else {
    P('with sound already allowed, one click skips straight away', await revealed(p2));
  }
  await p2.close();

  // 3. A click long after the card has gone must not fire a stale cue.
  const p3 = await open(browser, { init: [INSTRUMENT] });
  await p3.waitForTimeout(5000);
  await p3.mouse.click(800, 40);
  await p3.waitForTimeout(700);
  const late = await p3.evaluate(() => window.__audio);
  if (policy === 'block') P('no stale chime once its card is long gone',
    !late.played.some((p) => /chime/.test(p.src)));
  await p3.close();

  // 4. The bypasses that don't exist.
  if (policy === 'block') {
    const p4 = await open(browser, { init: [BYPASS_PROBE] });
    await p4.waitForTimeout(2000);
    const probe = await p4.evaluate(() => window.__probe);
    console.log('  bypass attempts:', JSON.stringify(probe));
    P('playing at full volume is refused', probe['full volume'] === 'NotAllowedError');
    P('starting at volume 0 and raising it is refused too', probe['volume 0, raised later'] === 'NotAllowedError');
    P('so is starting muted and unmuting', probe['muted, unmuted later'] === 'NotAllowedError');
    await p4.close();
  }
  await browser.close();
}
done();
