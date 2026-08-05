/* FREE PLAY: a way into the game with no wallet attached. */
import {
  launch, open, P, done, settled, DESKTOP, MOBILE,
  AUDIO_REGISTRY, mockWalletScript, mockRpc, connectMockWallet,
} from './lib.mjs';

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';

const browser = await launch('allow');
const titleButtons = () => (window.__buttons = [...document.querySelectorAll('button')]
  .map((b) => b.textContent.trim())
  .filter((t) => /^(FREE PLAY|PAID PLAY|CONNECT WALLET|FUND WALLET|SETTINGS)$/.test(t)));

/* --- disconnected --- */
for (const [name, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  console.log(`--- ${name}, no wallet ---`);
  const page = await open(browser, { viewport, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(900);
  await page.mouse.click(viewport.width / 2, 40);
  await page.waitForTimeout(1200);

  const order = await page.evaluate(titleButtons);
  console.log('  buttons:', JSON.stringify(order));
  P('FREE PLAY sits directly above CONNECT WALLET',
    order[0] === 'FREE PLAY' && order[1] === 'CONNECT WALLET');
  P('PAID PLAY needs a wallet, so it is absent', !order.includes('PAID PLAY'));
  P('no FUND WALLET without a wallet to fund', !order.includes('FUND WALLET'));
  P('SETTINGS closes the list', order.slice(2).join() === 'SETTINGS');

  const sizes = await page.evaluate(() => {
    const box = (t) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t);
      const r = b.getBoundingClientRect();
      return [Math.round(r.width), Math.round(r.height)];
    };
    return ['FREE PLAY', 'CONNECT WALLET', 'SETTINGS'].map(box);
  });
  console.log('  sizes:', JSON.stringify(sizes));
  P('every title button is the same size', new Set(sizes.map(String)).size === 1);

  // it must actually get you in, with no wallet anywhere
  await page.getByRole('button', { name: 'FREE PLAY' }).click();
  await page.waitForTimeout(300);
  P('a window offers Play Online, Play the House and Back',
    await page.getByRole('button', { name: 'Play Online' }).isVisible()
    && await page.getByRole('button', { name: 'Play the House' }).isVisible()
    && await page.getByRole('button', { name: 'Back', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Play the House' }).click();
  await settled(page, 9000);
  await page.waitForTimeout(600);   // PREPARING GAME burns ~5s
  const st = await page.evaluate(() => ({ phase: window.__BC.phase, connected: !!window.ethereum }));
  P(`the house battle begins on its own (phase=${st.phase})`, st.phase === 'setup');
  P('with no wallet involved', st.connected === false);
  P('a fleet is already dealt', (await page.evaluate(() => window.__BC.yourFleet.length)) === 5);
  P('and no New match button interrupts a running game',
    !(await page.getByRole('button', { name: 'New match' }).isVisible().catch(() => false)));
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
  P('FREE PLAY stays once a wallet is on', order[0] === 'FREE PLAY');
  P('and PAID PLAY appears beneath it', order[1] === 'PAID PLAY');
  P('and CONNECT WALLET is gone too', !order.includes('CONNECT WALLET'));
  P('FUND WALLET appears now there is a wallet', order.includes('FUND WALLET'));
  await page.close();
}

await browser.close();
done();
