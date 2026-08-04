/* The title theme: in after the studio card, out when a match starts, and a
   fade around the loop seam. The seam is checked against a 20-second stand-in,
   since the real track is half an hour long. */
import { launch, open, P, done, themeState, AUDIO_REGISTRY } from './lib.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CLIP = path.join(os.tmpdir(), 'bc-theme-20s.mp3');
if (!fs.existsSync(CLIP)) {
  try {
    const ff = execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
    execFileSync(ff, ['-v', 'error', '-y', '-i', 'public/game/sounds/theme.mp3', '-t', '20', '-c', 'copy', CLIP]);
  } catch { console.log('  (no ffmpeg — skipping the loop-seam check)'); }
}

console.log('--- sound allowed ---');
let browser = await launch('allow');
let page = await open(browser, { init: [AUDIO_REGISTRY] });
const seen = {};
let last = 0;
for (const ms of [3000, 5000, 7000, 9500]) {
  await page.waitForTimeout(ms - last); last = ms;
  seen[ms] = await page.evaluate(themeState);
  console.log(`  t=${ms}ms`.padEnd(12), JSON.stringify(seen[ms]));
}
P('silent while the studio card is up', seen[3000] === null || seen[3000].playing === false || seen[3000].vol === 0);
P('running just after the card clears', seen[5000]?.playing === true);
P(`fades in rather than cutting in (${seen[5000]?.vol} -> ${seen[7000]?.vol})`, seen[5000].vol < seen[7000].vol);
P(`settles at the MUSIC level, 0.6 (${seen[9500]?.vol})`, Math.abs(seen[9500].vol - 0.6) < 0.02);
P(`it is the whole track (${Math.round(seen[9500].dur / 60)} min)`, seen[9500].dur > 1800);

const setSlider = (page, pct) => page.locator('input[type="range"]').first().evaluate((el, v) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, pct);
await page.getByRole('button', { name: 'SETTINGS' }).first().click();
await page.waitForTimeout(400);
await setSlider(page, 20);
await page.waitForTimeout(400);
const slid = await page.evaluate(themeState);
P(`the MUSIC slider drives it (${slid.vol} at 20%)`, Math.abs(slid.vol - 0.2) < 0.03);
await setSlider(page, 60);
await page.getByRole('button', { name: 'DONE' }).first().click();
await page.waitForTimeout(400);

await page.locator('button[aria-label="Mute"]').click();
await page.waitForTimeout(400);
const muted = await page.evaluate(themeState);
P(`the master toggle silences the music too (${muted.vol})`, muted.vol === 0);
P('and leaves it running, so it resumes in place', muted.playing === true);
await page.locator('button[aria-label="Unmute"]').click();
await page.waitForTimeout(400);
P(`unmuting brings it straight back (${(await page.evaluate(themeState)).vol})`, (await page.evaluate(themeState)).vol > 0.5);

await page.evaluate(() => window.__BC.newMatch());
await page.waitForTimeout(1600);
P('starting a match fades it out', (await page.evaluate(themeState)).playing === false);
await page.close();

if (fs.existsSync(CLIP)) {
  console.log('--- the loop, on a 20s stand-in ---');
  const p2 = await open(browser, {
    init: [AUDIO_REGISTRY],
    routes: { '**/theme.mp3': { type: 'audio/mpeg', data: fs.readFileSync(CLIP) } },
  });
  const trail = [];
  for (let i = 0; i < 28; i++) { await p2.waitForTimeout(900); const s = await p2.evaluate(themeState); if (s) trail.push(s); }
  console.log('  ' + trail.map((x) => `${x.t}@${x.vol}`).join(' '));
  const dur = trail.at(-1).dur;
  const tail = trail.filter((x) => x.t > dur - 5).map((x) => x.vol);
  P(`it fades down as the track runs out (low of ${Math.min(...tail)})`, Math.min(...tail) < 0.15);
  P('it wraps to the top rather than stopping', trail.findIndex((x, i) => i > 3 && x.t < trail[i - 1].t) > 0);
  P('it is still playing after the wrap', trail.at(-1).playing === true);
  P(`and fades back up (${trail.at(-1).vol})`, trail.at(-1).vol > 0.3);
  await p2.close();
}
await browser.close();

console.log('--- sound blocked (a fresh visitor, untouched) ---');
browser = await launch('block');
const p3 = await open(browser, { init: [AUDIO_REGISTRY] });
await p3.waitForTimeout(7000);
const blocked = await p3.evaluate(themeState);
console.log('  t=7s:', JSON.stringify(blocked));
P('the theme is refused, like everything else', blocked === null || blocked.playing === false);
await p3.mouse.click(800, 40);
await p3.waitForTimeout(3000);
const freed = await p3.evaluate(themeState);
console.log('  after one click:', JSON.stringify(freed));
P('one click starts it', freed?.playing === true);
P(`and it fades up from there (${freed?.vol})`, freed.vol > 0 && freed.vol <= 0.62);
await browser.close();
done();
