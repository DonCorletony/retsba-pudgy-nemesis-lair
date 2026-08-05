/* No reserved strip down the right-hand edge, and the opening is black all the
   way out — including the parts of the window a fixed element cannot paint. */
import { launch, open, P, done, AUDIO_REGISTRY, DESKTOP, MOBILE } from './lib.mjs';

const browser = await launch('allow');

for (const [name, viewport] of [['desktop', DESKTOP], ['phone', MOBILE], ['short', { width: 1280, height: 620 }]]) {
  const page = await open(browser, { viewport, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(1500);

  const opening = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
    theme: document.querySelector('meta[name="theme-color"]')?.content,
    marked: document.documentElement.classList.contains('bc-opening'),
  }));
  console.log(`  ${name.padEnd(8)} opening:`, JSON.stringify(opening));
  P(`${name}: the canvas is black under the opening`,
    opening.marked && opening.html === 'rgb(0, 0, 0)' && opening.body === 'rgb(0, 0, 0)');
  P(`${name}: and the browser chrome with it`, opening.theme === '#000000');

  await page.mouse.click(viewport.width / 2, 40);
  await page.waitForTimeout(1600);
  const after = await page.evaluate(() => ({
    marked: document.documentElement.classList.contains('bc-opening'),
    theme: document.querySelector('meta[name="theme-color"]')?.content,
    gutter: window.innerWidth - document.documentElement.clientWidth,
    reserved: getComputedStyle(document.documentElement).scrollbarGutter,
  }));
  console.log(`  ${name.padEnd(8)} title:  `, JSON.stringify(after));
  P(`${name}: the opening releases the canvas`, !after.marked);
  P(`${name}: theme-color goes back to the sky (${after.theme})`, after.theme === '#71b6e6');
  P(`${name}: no gutter is held open (${after.reserved})`, after.reserved === 'auto');

  // the wallpaper must reach the window's right edge, with no band beside it
  const edge = await page.evaluate(() => {
    const root = document.querySelector('.min-h-screen').getBoundingClientRect();
    return { right: Math.round(root.right), win: window.innerWidth };
  });
  P(`${name}: the page reaches the right edge (${edge.right}/${edge.win})`, edge.right >= edge.win);
  await page.close();
}

/* The gutter was holding modals still; Radix has to cover that itself now. */
{
  const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1500);
  const before = await page.evaluate(() => document.documentElement.clientWidth);
  await page.getByRole('button', { name: 'SETTINGS' }).click();
  await page.waitForTimeout(700);
  const open_ = await page.evaluate(() => {
    const dlg = [...document.querySelectorAll('div')]
      .find((d) => d.className.includes('z-[80]'))?.firstElementChild;
    const r = dlg.getBoundingClientRect();
    return { mid: Math.round(r.left + r.width / 2), win: Math.round(window.innerWidth / 2),
             client: document.documentElement.clientWidth };
  });
  console.log('  settings dialog:', JSON.stringify(open_));
  P(`the dialog is centred (${open_.mid} vs ${open_.win})`, Math.abs(open_.mid - open_.win) <= 1);
  P('opening it does not resize the page', open_.client === before);
  await page.close();
}

await browser.close();
done();
