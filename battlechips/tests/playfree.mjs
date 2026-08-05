/* PLAY FREE: a way into the game with no wallet attached. */
import {
  launch, open, P, done, settled, DESKTOP, MOBILE,
  AUDIO_REGISTRY, mockWalletScript, mockRpc, connectMockWallet,
} from './lib.mjs';

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';

const browser = await launch('allow');
const titleButtons = () => (window.__buttons = [...document.querySelectorAll('button')]
  .map((b) => b.textContent.trim())
  .filter((t) => /^(PLAY FREE|CONNECT WALLET|PLAY|FUND WALLET|SETTINGS)$/.test(t)));

/* --- disconnected --- */
for (const [name, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  console.log(`--- ${name}, no wallet ---`);
  const page = await open(browser, { viewport, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(900);
  await page.mouse.click(viewport.width / 2, 40);
  await page.waitForTimeout(1200);

  const order = await page.evaluate(titleButtons);
  console.log('  buttons:', JSON.stringify(order));
  P('PLAY FREE sits directly above CONNECT WALLET',
    order[0] === 'PLAY FREE' && order[1] === 'CONNECT WALLET');
  P('no FUND WALLET without a wallet to fund', !order.includes('FUND WALLET'));
  P('SETTINGS closes the list', order.slice(2).join() === 'SETTINGS');

  const sizes = await page.evaluate(() => {
    const box = (t) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t);
      const r = b.getBoundingClientRect();
      return [Math.round(r.width), Math.round(r.height)];
    };
    return ['PLAY FREE', 'CONNECT WALLET', 'SETTINGS'].map(box);
  });
  console.log('  sizes:', JSON.stringify(sizes));
  P('every title button is the same size', new Set(sizes.map(String)).size === 1);

  // it must actually get you in, with no wallet anywhere
  await page.getByRole('button', { name: 'PLAY FREE' }).click();
  await settled(page);
  await page.waitForTimeout(600);
  const st = await page.evaluate(() => ({ phase: window.__BC.phase, connected: !!window.ethereum }));
  P(`it opens the game screen (phase=${st.phase})`, st.phase === 'lobby');
  P('with no wallet involved', st.connected === false);
  P('and New match starts a real match',
    await page.getByRole('button', { name: 'New match' }).isVisible());
  await page.getByRole('button', { name: 'New match' }).click();
  await page.waitForTimeout(900);
  P('which deals a fleet', (await page.evaluate(() => window.__BC.yourFleet.length)) === 5);
  await page.close();
}

/* --- connected: PLAY replaces the pair --- */
{
  console.log('--- wallet connected ---');
  const page = await open(browser, { init: [AUDIO_REGISTRY, mockWalletScript()] });
  await page.route('**/rpc.mainnet.chain.robinhood.com/**', mockRpc({ [USDG]: 0n, [LUCKY]: 0n }));
  await page.waitForTimeout(900);
  await page.mouse.click(800, 40);
  await page.waitForTimeout(1200);
  await connectMockWallet(page);
  await page.waitForTimeout(1200);
  const order = await page.evaluate(titleButtons);
  console.log('  buttons:', JSON.stringify(order));
  P('PLAY FREE is gone once a wallet is on', !order.includes('PLAY FREE'));
  P('PLAY has taken its place', order[0] === 'PLAY');
  P('and CONNECT WALLET is gone too', !order.includes('CONNECT WALLET'));
  P('FUND WALLET appears now there is a wallet', order.includes('FUND WALLET'));
  await page.close();
}

await browser.close();
done();
