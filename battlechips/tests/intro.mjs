/* The opening sequence: studio card, black, wordmark, hand-off to the title. */
import { launch, open, P, done, AUDIO_REGISTRY } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { init: [AUDIO_REGISTRY] });
const t0 = Date.now();

const shot = () => page.evaluate(() => {
  const op = (el) => (el ? +getComputedStyle(el).opacity : null);
  const studio = document.querySelector('[aria-label="Lucky Jack Games"]');
  const band = studio ? [...studio.querySelectorAll('*')].find((e) => getComputedStyle(e).animationName === 'bcShine') : null;
  const logos = [...document.querySelectorAll('img')].filter((x) => /logo-battlechips/.test(x.src));
  const black = [...document.querySelectorAll('div')].find((d) =>
    getComputedStyle(d).backgroundColor === 'rgb(0, 0, 0)' && d.className.includes('fixed'));
  const controls = [...document.querySelectorAll('button')].find((x) => /SETTINGS/.test(x.textContent))?.parentElement;
  const vis = logos.filter((l) => op(l) > 0.05);
  return {
    studio: op(studio),
    studioW: studio ? Math.round(studio.getBoundingClientRect().width) : null,
    masked: studio ? /svg/.test(getComputedStyle(studio.children[0]).webkitMaskImage || '') : null,
    sheen: !!band,
    logos: vis.length,
    logoOpacity: vis.length ? op(vis[0]) : null,
    logoTrans: vis.length ? getComputedStyle(vis[0]).transitionProperty : null,
    logoY: vis.length ? Math.round(vis[0].getBoundingClientRect().top + vis[0].getBoundingClientRect().height / 2) : null,
    black: op(black),
    controls: op(controls),
    btns: (() => {
      const all = [...document.querySelectorAll('button')];
      const s = all.find((x) => /SETTINGS/.test(x.textContent)), c = all.find((x) => /CONNECT WALLET/.test(x.textContent));
      const box = (e) => [Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)];
      return s && c ? { settings: box(s), wallet: box(c) } : null;
    })(),
  };
});

const tl = [];
for (let i = 0; i < 36; i++) { tl.push({ t: Date.now() - t0, ...(await shot()) }); await page.waitForTimeout(380); }
const at = (ms) => tl.reduce((a, b) => (Math.abs(b.t - ms) < Math.abs(a.t - ms) ? b : a));
const card = at(1500), gap = at(5500), cut = at(7500), onBlack = at(8600), moving = at(10600), rest = at(14000);
for (const t of [1500, 5500, 7500, 8600, 10600, 14000]) console.log(`  t=${t}`.padEnd(10), JSON.stringify(at(t)));
console.log('---');

P('the studio card is drawn from pixels, not a web font', card.masked === true);
P('a glare band sweeps it', card.sheen === true);
P(`the card is modest in size (${card.studioW}px across 1600)`, card.studioW <= 400);
P('no wordmark while the card is up', card.logos === 0);
P('three seconds of black in between', gap.studio < 0.05 && gap.logos === 0 && gap.black === 1);
P('the wordmark then appears, still on black', onBlack.logos === 1 && onBlack.black === 1);
P(`the wordmark fades in rather than cutting (transition: ${cut.logoTrans ?? onBlack.logoTrans})`,
  /opacity/.test(cut.logoTrans ?? onBlack.logoTrans ?? ''));
P(`and is fully opaque the instant it shows (${cut.logoOpacity ?? onBlack.logoOpacity})`,
  (cut.logoOpacity ?? onBlack.logoOpacity) === 1);
P('exactly one wordmark mid-reveal — the intro copy, not two', moving.logos === 1);
P('exactly one at rest', rest.logos === 1);
P(`it travels upward into place (${onBlack.logoY} -> ${rest.logoY})`, rest.logoY < onBlack.logoY - 20);
P(`the black is gone at rest (${rest.black})`, rest.black === null || rest.black === 0);
P(`controls hidden before the reveal (${onBlack.controls})`, onBlack.controls === 0);
P(`they fade in alongside the move (${moving.controls?.toFixed(2)})`, moving.controls > 0 && moving.controls < 1);
P(`and are fully in at rest (${rest.controls})`, rest.controls === 1);
P(`SETTINGS and CONNECT WALLET are the same size (${JSON.stringify(rest.btns)})`,
  rest.btns && String(rest.btns.settings) === String(rest.btns.wallet));

await browser.close();
done();
