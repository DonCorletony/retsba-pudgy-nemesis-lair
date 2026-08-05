/* The entrance to a house battle: splash, black, PREPARING GAME, then a match. */
import {
  launch, open, P, done, AUDIO_REGISTRY, DESKTOP, mockWalletScript, mockRpc, connectMockWallet,
} from './lib.mjs';

const PLAY_SPY = `window.__played = [];
  const op = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    window.__played.push((this.src || this.currentSrc || '').split('/').pop());
    return op.apply(this, arguments);
  };`;

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';

const browser = await launch('allow');

/* --- free play --- */
{
  const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY, PLAY_SPY] });
  await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
  await page.getByRole('button', { name: 'FREE PLAY' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Play the House' }).click();

  await page.waitForTimeout(1000);           // deep in the dip
  const mid = await page.evaluate(() => ({
    veil: +getComputedStyle(document.querySelector('[aria-hidden].fixed.z-\\[100\\]')).opacity,
    card: document.body.innerText.includes('PREPARING GAME'),
    wheel: [...document.querySelectorAll('div')].some((d) => getComputedStyle(d).animationName === 'bcPinwheel'),
    sounds: window.__played.filter((s) => /wave-crash|ocean/.test(s)),
  }));
  console.log('  at 1s:', JSON.stringify(mid));
  P('the screen is black', mid.veil === 1);
  P('PREPARING GAME is up', mid.card);
  P('with a pinwheel actually turning', mid.wheel);
  P('the splash played on the way in', mid.sounds.some((s) => /wave-crash/.test(s)));
  P('and the gulls are on (ocean ambience)', mid.sounds.some((s) => /ocean/.test(s)));

  await page.waitForTimeout(3000);           // ~4s in: still burning
  P('it holds for the burn', await page.evaluate(() => document.body.innerText.includes('PREPARING GAME')));

  await page.waitForTimeout(2500);           // ~6.5s: revealed
  const after = await page.evaluate(() => ({
    veil: +getComputedStyle(document.querySelector('[aria-hidden].fixed.z-\\[100\\]')).opacity,
    card: document.body.innerText.includes('PREPARING GAME'),
    phase: window.__BC.phase, clock: window.__BC.clock,
    fleet: window.__BC.yourFleet.length,
  }));
  console.log('  after:', JSON.stringify(after));
  P('the black has lifted and the card is gone', after.veil === 0 && !after.card);
  P(`a match is under way (phase=${after.phase})`, after.phase === 'setup');
  P('with the fleet dealt', after.fleet === 5);
  P(`and the burn never ate the setup clock (${after.clock}s)`, after.clock >= 28);
  await page.close();
}

/* --- paid play reaches the same entrance --- */
{
  const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY, mockWalletScript()] });
  await page.route('**/rpc.mainnet.chain.robinhood.com/**', mockRpc({ [USDG]: 50n * 10n ** 6n, [LUCKY]: 0n }));
  await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
  await connectMockWallet(page); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'PAID PLAY' }).click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Play the House' }).click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: '$USDG', exact: true }).click();
  await page.getByRole('button', { name: '$25', exact: true }).click();
  await page.getByRole('button', { name: 'Battle!' }).click();
  await page.waitForTimeout(1000);
  const mid = await page.evaluate(() => ({
    card: document.body.innerText.includes('PREPARING GAME'),
    soon: document.body.innerText.includes('still being wired up'),
  }));
  P('a paid house Battle! goes through the same entrance', mid.card && !mid.soon);
  await page.waitForTimeout(5500);
  P('and lands in a running match', (await page.evaluate(() => window.__BC.phase)) === 'setup');
  await page.close();
}

await browser.close();
done();
