/* Hover and click chirps on the chrome buttons, and that they answer to the
   SOUND EFFECTS slider rather than MUSIC. */
import { launch, open, P, done, settled, AUDIO_REGISTRY } from './lib.mjs';

const TAP = `
  window.__ui = [];
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const src = (this.currentSrc || this.src || '').split('/').pop();
    if (/^ui-|wave-crash/.test(src)) window.__ui.push({ src, vol: +this.volume.toFixed(2) });
    return orig.call(this);
  };`;

const browser = await launch('allow');
const page = await open(browser, { init: [AUDIO_REGISTRY, TAP] });
await page.waitForTimeout(900);
await page.mouse.click(800, 40);                     // skip the opening
await page.waitForTimeout(1200);

const drain = () => page.evaluate(() => { const u = window.__ui; window.__ui = []; return u; });
const btn = (name) => page.getByRole('button', { name, exact: true }).locator('visible=true').first();

/** Hover it, then click it, and report which chirps fired. */
const exercise = async (name, locator) => {
  const el = locator ?? btn(name);
  await settled(page);                  // a screen dip would swallow the click
  await page.mouse.move(2, 2);          // leave first, or mouseenter won't fire again
  await page.waitForTimeout(120);
  await drain();
  await el.hover();
  await page.waitForTimeout(200);
  const hovered = (await drain()).map((x) => x.src);
  await el.click();
  await page.waitForTimeout(250);
  const clicked = (await drain()).map((x) => x.src);
  P(`${name}: hover chirps`, hovered.includes('ui-hover.wav'));
  P(`${name}: click chirps`, clicked.includes('ui-click.wav'));
};

await exercise('CONNECT WALLET');                     // opens RainbowKit; close it again
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await exercise('SETTINGS');
await page.waitForTimeout(400);

// SFX slider is the second range in the dialog; MUSIC is the first.
const setRange = (nth, pct) => page.locator('input[type="range"]').nth(nth).evaluate((el, v) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, pct);
await setRange(1, 30);
await drain();
await btn('DONE').hover();
await page.waitForTimeout(200);
const atThirty = await drain();
P(`the chirps ride the SOUND EFFECTS slider (${atThirty[0]?.vol} at 30%)`, Math.abs((atThirty[0]?.vol ?? -1) - 0.3) < 0.03);
await setRange(1, 80);
await exercise('DONE');
await page.waitForTimeout(400);

await page.evaluate(() => window.__BC.enterLobby());
await page.waitForTimeout(1200);
await exercise('Back');
await page.waitForTimeout(900);

await page.evaluate(() => window.__BC.enterLobby());
await page.waitForTimeout(900);
await exercise('New match');
await page.waitForTimeout(900);
await exercise('Forfeit');
await page.waitForTimeout(400);
await exercise('No, Stay');
await page.waitForTimeout(400);
await btn('Forfeit').click();
await page.waitForTimeout(400);
await exercise('Yes, Leave');
await page.waitForTimeout(1200);

// PLAY has a sound of its own on top of the click.
await settled(page);
await drain();
await page.evaluate(() => window.__BC.pressPlay());
await page.waitForTimeout(400);
const onPlay = (await drain()).map((x) => x.src);
P(`PLAY breaks a wave (${onPlay.join(', ') || 'nothing'})`, onPlay.includes('wave-crash.wav'));
await settled(page);
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Back' }).click();
await settled(page);
await page.waitForTimeout(600);

// The corner wallet pill only exists once connected; the title one stands in
// for it — same component, same props.
await drain();
await btn('CONNECT WALLET').hover();
await page.waitForTimeout(200);
P('the wallet control chirps on hover', (await drain()).some((x) => x.src === 'ui-hover.wav'));

// Master mute covers them, as it does everything.
await page.locator('button[aria-label="Mute"]').click();
await page.waitForTimeout(300);
await drain();
await btn('SETTINGS').hover();
await page.waitForTimeout(250);
P('muted, they stay quiet', (await drain()).length === 0);

await browser.close();
done();
