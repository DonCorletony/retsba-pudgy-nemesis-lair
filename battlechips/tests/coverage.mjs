/* The opening's black and the transition veil have to cover the whole screen,
   including on mobile where the browser's toolbars resize the viewport out from
   under a fixed element mid-animation. */
import { launch, open, P, done, AUDIO_REGISTRY } from './lib.mjs';

const browser = await launch('allow');

/** Does the black overlay's box actually reach past every edge of the viewport?
 *  Measured as a rect rather than by hit-testing: both overlays are
 *  pointer-events:none, and elementFromPoint skips those entirely. */
const coverage = (page, z) => page.evaluate((zClass) => {
  const el = [...document.querySelectorAll('div')].find(
    (d) => d.className.includes(zClass) && getComputedStyle(d).backgroundColor === 'rgb(0, 0, 0)');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    over: { top: Math.round(-r.top), left: Math.round(-r.left),
            bottom: Math.round(r.bottom - window.innerHeight), right: Math.round(r.right - window.innerWidth) },
    opacity: +getComputedStyle(el).opacity.slice(0, 4),
  };
}, z);
const reaches = (c) => !!c && c.over.top >= 0 && c.over.left >= 0 && c.over.bottom >= 0 && c.over.right >= 0;

for (const [name, viewport] of [
  ['tall phone', { width: 390, height: 844 }],
  ['short phone', { width: 360, height: 560 }],   // toolbars eating the viewport
  ['desktop', { width: 1600, height: 1000 }],
]) {
  const page = await open(browser, { viewport, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(1500);                 // studio card, fully black behind it
  const intro = await coverage(page, 'z-[90]');
  console.log(`  ${name.padEnd(12)} ${viewport.width}x${viewport.height} opening overscan:`, JSON.stringify(intro?.over));
  P(`${name}: the opening's black reaches past every edge`, reaches(intro));
  P(`${name}: and it is actually opaque there (${intro?.opacity})`, intro?.opacity === 1);

  // Belt and braces: nothing behind the overlay to leak if an edge is missed.
  const under = await page.evaluate(() => {
    const root = document.querySelector('.min-h-screen');
    const cs = getComputedStyle(root);
    return { image: cs.backgroundImage, colour: cs.backgroundColor };
  });
  P(`${name}: the screen under the opening is black, not wallpaper (${under.image})`,
    under.image === 'none' && under.colour === 'rgb(0, 0, 0)');

  // The overscan must not make the page scrollable sideways.
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth, win: window.innerWidth,
  }));
  P(`${name}: no sideways scroll from the overscan (${overflow.doc} vs ${overflow.win})`,
    overflow.doc <= overflow.win + 1);

  // skipping ends the opening: the wallpaper must come back underneath
  await page.mouse.click(viewport.width / 2, 40);
  await page.waitForTimeout(1400);
  const back = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.min-h-screen')).backgroundImage);
  P(`${name}: the wallpaper returns once the opening is done`, /title-bg/.test(back));

  // and the same coverage for the transition veil, mid-dip
  await page.evaluate(() => window.__BC.pressPlay());
  await page.waitForTimeout(900);                  // at the bottom of the dip
  const veil = await coverage(page, 'z-[100]');
  console.log(`  ${' '.repeat(12)} ${' '.repeat(String(viewport.width).length + 6)}veil overscan:`, JSON.stringify(veil?.over));
  P(`${name}: the transition veil reaches past every edge`, reaches(veil));
  P(`${name}: and it is opaque mid-dip (${veil?.opacity})`, veil?.opacity === 1);
  await page.close();
}

/* The page itself must not be white behind the art — mobile chrome borrows it. */
{
  const page = await open(browser, { viewport: { width: 390, height: 844 } });
  const bg = await page.evaluate(() => [
    getComputedStyle(document.documentElement).backgroundColor,
    getComputedStyle(document.body).backgroundColor,
  ]);
  console.log('  document background:', JSON.stringify(bg));
  P('html and body are the wallpaper sky, not white', bg.every((c) => c === 'rgb(113, 182, 230)'));
  const theme = await page.evaluate(() =>
    document.querySelector('meta[name="theme-color"]')?.content);
  P(`theme-color matches it (${theme})`, theme === '#71b6e6');
  await page.close();
}

await browser.close();
done();
