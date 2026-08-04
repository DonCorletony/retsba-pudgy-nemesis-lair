import { chromium } from 'playwright';

export const BASE = process.env.BASE ?? 'http://127.0.0.1:4192';
export const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const DESKTOP = { width: 1600, height: 1000 };
export const MOBILE = { width: 390, height: 844 };

let failures = 0;
export const P = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures++; };
export const done = () => { if (failures) { console.log(`\n*** ${failures} failing ***`); process.exitCode = 1; } };

/** `policy`: 'block' mimics a first-time visitor, 'allow' a site the browser trusts. */
export const launch = (policy = 'allow') => chromium.launch({
  executablePath: CHROME,
  args: [`--autoplay-policy=${policy === 'block' ? 'document-user-activation-required' : 'no-user-gesture-required'}`],
});

/** Audio built with `new Audio()` never enters the DOM, so keep a registry. */
export const AUDIO_REGISTRY = `window.__mus = []; const OA = window.Audio;
  window.Audio = function (...a) { const el = new OA(...a); window.__mus.push(el); return el; };
  window.Audio.prototype = OA.prototype;`;

export const open = async (browser, { viewport = DESKTOP, init = [], routes = {} } = {}) => {
  const page = await browser.newPage({ viewport });
  for (const s of init) await page.addInitScript(s);
  for (const [glob, body] of Object.entries(routes))
    await page.route(glob, (r) => r.fulfill({ contentType: body.type, body: body.data }));
  page.on('pageerror', (e) => { if (!/Failed to fetch|WebSocket/.test(e.message)) console.log('  PAGEERROR', e.message); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  return page;
};

/** The theme's state, or null before it exists. */
export const themeState = () => (window.__mus || [])
  .filter((a) => /theme/.test(a.src || a.currentSrc))
  .map((a) => ({ playing: !a.paused, vol: +a.volume.toFixed(3), t: +a.currentTime.toFixed(1), dur: Math.round(a.duration || 0) }))[0] ?? null;

/** Opacity of the block holding the title-screen buttons. */
export const controlsOpacity = () => {
  const b = [...document.querySelectorAll('button')].find((x) => /SETTINGS/.test(x.textContent));
  return b ? +getComputedStyle(b.parentElement).opacity : null;
};

/** Wait out any screen dip, so clicks aren't swallowed by the veil. */
export const settled = async (page, timeout = 4000) => {
  for (let i = 0; i < timeout / 100; i++) {
    const busy = await page.evaluate(() => {
      const v = document.querySelector('[aria-hidden].fixed.z-\\[100\\]');
      return v ? getComputedStyle(v).pointerEvents !== 'none' : false;
    });
    if (!busy) return;
    await page.waitForTimeout(100);
  }
};
