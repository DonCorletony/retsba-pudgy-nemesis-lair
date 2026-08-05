/* Which music plays on which screen, and how one hands over to the next.
   The battle pair's handover is checked against short stand-ins, since the real
   tracks are minutes long. */
import { launch, open, P, done, settled, AUDIO_REGISTRY } from './lib.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Every music element, keyed by track name. */
const MUSIC = () => Object.fromEntries((window.__mus || [])
  .filter((a) => /theme|ocean-ambience|battle-/.test(a.src || a.currentSrc))
  .map((a) => {
    const name = (a.src || a.currentSrc).split('/').pop().replace('.mp3', '');
    return [name, { playing: !a.paused, vol: +a.volume.toFixed(2), t: +a.currentTime.toFixed(1) }];
  }));
const audible = (m) => Object.entries(m).filter(([, v]) => v.playing && v.vol > 0.02).map(([k]) => k);

const clip = (name, src, secs) => {
  const out = path.join(os.tmpdir(), `bc-${name}.mp3`);
  if (!fs.existsSync(out)) {
    const ff = execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
    execFileSync(ff, ['-v', 'error', '-y', '-i', src, '-t', String(secs), '-c', 'copy', out]);
  }
  return fs.readFileSync(out);
};

const browser = await launch('allow');

/* ---- the arc: title -> sea -> battle -> sea ---- */
{
  const page = await open(browser, { init: [AUDIO_REGISTRY] });
  const now = () => page.evaluate(MUSIC);
  await page.waitForTimeout(900);
  await page.mouse.click(800, 40);
  await page.waitForTimeout(3500);
  P(`the theme plays on the title screen (${audible(await now())})`, audible(await now()).includes('theme'));

  // PLAY: the sea must start rising with the wave, not on arrival
  await page.evaluate(() => window.__BC.pressPlay());
  await page.waitForTimeout(500);
  const early = await page.evaluate(MUSIC);
  console.log('  0.5s after PLAY:', JSON.stringify(early));
  P('the sea starts on the press, while the screen is still dipping',
    early['ocean-ambience']?.playing === true);
  P('and it fades in rather than cutting in', (early['ocean-ambience']?.vol ?? 1) < 0.4);
  P('the theme is on its way out', (early.theme?.vol ?? 1) < 0.6);

  await settled(page);
  await page.waitForTimeout(3000);
  P(`on the game screen it is just the sea (${audible(await now())})`,
    audible(await now()).join() === 'ocean-ambience');

  // New match -> battle
  await page.getByRole('button', { name: 'New match' }).click();
  await page.waitForTimeout(600);
  const swap = await page.evaluate(MUSIC);
  console.log('  0.6s after New match:', JSON.stringify(swap));
  P('the sea starts fading out', (swap['ocean-ambience']?.vol ?? 1) < 0.6);
  P('battle 1 comes up', swap['battle-1']?.playing === true);
  await page.waitForTimeout(3500);
  P(`during a match it is battle 1 alone (${audible(await page.evaluate(MUSIC))})`,
    audible(await page.evaluate(MUSIC)).join() === 'battle-1');

  // forfeit back out -> the lobby, so the sea returns rather than the theme
  await page.getByRole('button', { name: 'Forfeit' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Yes, Leave' }).click();
  await settled(page);
  await page.waitForTimeout(3500);
  const home = await page.evaluate(MUSIC);
  console.log('  back home:', JSON.stringify(home));
  P(`leaving a match silences the battle music (${audible(home)})`, !audible(home).includes('battle-1'));
  P('and the sea is back, since forfeiting lands on the lobby',
    audible(home).includes('ocean-ambience'));

  // and stepping out of the lobby brings the theme back
  await page.getByRole('button', { name: 'Back' }).click();
  await settled(page);
  await page.waitForTimeout(3500);
  const title = await page.evaluate(MUSIC);
  console.log('  title:', JSON.stringify(title));
  P(`Back to the title screen brings the theme back (${audible(title)})`,
    audible(title).includes('theme'));
  await page.close();
}

/* ---- battle 1 hands to battle 2, and back again ---- */
{
  const b1 = clip('b1', 'public/game/sounds/battle-1.mp3', 14);
  const b2 = clip('b2', 'public/game/sounds/battle-2.mp3', 14);
  const page = await open(browser, {
    init: [AUDIO_REGISTRY],
    routes: {
      '**/battle-1.mp3': { type: 'audio/mpeg', data: b1 },
      '**/battle-2.mp3': { type: 'audio/mpeg', data: b2 },
    },
  });
  await page.waitForTimeout(900);
  await page.mouse.click(800, 40);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__BC.newMatch());
  const order = [];
  for (let i = 0; i < 42; i++) {
    await page.waitForTimeout(900);
    const a = audible(await page.evaluate(MUSIC)).filter((n) => n.startsWith('battle-'));
    if (a.length && order.at(-1) !== a[0]) order.push(a[0]);
  }
  console.log('  battle order:', order.join(' -> '));
  P('it starts on battle 1', order[0] === 'battle-1');
  P('battle 1 hands over to battle 2', order[1] === 'battle-2');
  P('and battle 2 goes back to battle 1', order[2] === 'battle-1');
  await page.close();
}

await browser.close();
done();
