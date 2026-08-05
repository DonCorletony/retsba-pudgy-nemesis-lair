/* Card effects: which sprite plays where, which sound goes with it, and what
   the bonus wheel's outlines say once it lands. */
import { launch, open, P, done, settled, AUDIO_REGISTRY, DESKTOP } from './lib.mjs';

/* playSfx reuses pooled elements, so watching `new Audio` misses them — record
   every play() call at the prototype instead. */
const PLAY_SPY = `window.__played = [];
  const op = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    window.__played.push((this.src || this.currentSrc || '').split('/').pop());
    return op.apply(this, arguments);
  };`;

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY, PLAY_SPY] });
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await page.getByRole('button', { name: 'FREE PLAY' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Play the House' }).click();
await settled(page); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'New match' }).click();
await page.waitForTimeout(1200);

/* --- the sprites are all reachable --- */
for (const f of ['explosion-blue', 'lightning', 'whirlpool']) {
  const r = await page.evaluate(async (n) => {
    const res = await fetch(`/game/${n}.gif`); return { ok: res.ok, type: res.headers.get('content-type') };
  }, f);
  P(`${f}.gif is served (${r.type})`, r.ok && /gif/.test(r.type));
}
for (const s of ['bonus-correct.wav', 'bonus-wrong.wav', 'thunder.wav', 'whirlpool.wav', 'shield-hit.flac']) {
  const ok = await page.evaluate(async (n) => (await fetch(`/game/sounds/${n}`)).ok, s);
  P(`${s} is served`, ok);
}

/* --- the two cards' shapes --- */
const shapes = await page.evaluate(() => ({
  thunder: window.__BC.cardInfo.THUNDERSTORM.blurb,
  whirl: window.__BC.cardInfo.WHIRLPOOL.blurb,
  whirlLabel: window.__BC.cardInfo.WHIRLPOOL.label,
}));
console.log('  card text:', JSON.stringify(shapes));
P('Thunderstorm now says five strikes', /Five/.test(shapes.thunder));
P('Whirlpool now says 2×2', /2×2/.test(shapes.whirl) && shapes.whirlLabel === '2×2');

/* --- firing them --- */
const fx = async (card) => {
  const seen = await page.evaluate(async (type) => {
    const sprites = new Set(), sounds = [];
    const obs = new MutationObserver(() => {
      document.querySelectorAll('img[src*=".gif"]').forEach((i) =>
        sprites.add(i.getAttribute('src').split('?')[0]));
    });
    obs.observe(document.body, { subtree: true, childList: true });
    const mark = window.__played.length;   // only count what this card plays
    window.__BC.forceCard(type);
    await new Promise((r) => setTimeout(r, 1400));
    obs.disconnect();
    sounds.push(...window.__played.slice(mark));
    const cells = window.__BC.animCells();
    return { sprites: [...sprites], sounds, cells };
  }, card);
  return seen;
};

const t = await fx('THUNDERSTORM');
console.log('  thunderstorm:', JSON.stringify(t));
P('lightning plays, not fire', t.sprites.some((s) => /lightning/.test(s)) && !t.sprites.some((s) => /explosion\.gif/.test(s)));
P(`it strikes five spaces (${t.cells.length})`, t.cells.length === 5);
P('every space gets a bolt', t.cells.every((c) => c.kind === 'bolt'));
P(`thunder plays once per strike (${t.sounds.filter((s) => /thunder/.test(s)).length})`,
  t.sounds.filter((s) => /thunder/.test(s)).length === 5);

const w = await fx('WHIRLPOOL');
console.log('  whirlpool:', JSON.stringify(w));
P('the whirlpool sprite plays', w.sprites.some((s) => /whirlpool/.test(s)));
P(`three whirls, one per strike (${w.cells.length})`, w.cells.length === 3);
P('each covers its whole 2×2', w.cells.every((c) => c.kind === 'whirl' && c.span === 2));
P(`swish plays once per whirl (${w.sounds.filter((s) => /whirlpool/.test(s)).length})`,
  w.sounds.filter((s) => /whirlpool/.test(s)).length === 3);

await browser.close();
done();
