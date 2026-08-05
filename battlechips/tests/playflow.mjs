/* The road in: FREE PLAY / PAID PLAY -> pick an opponent -> (paid) set a wager. */
import {
  launch, open, P, done, AUDIO_REGISTRY, DESKTOP, mockWalletScript, mockRpc, connectMockWallet,
} from './lib.mjs';

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY, mockWalletScript()] });
await page.route('**/rpc.mainnet.chain.robinhood.com/**', mockRpc({ [USDG]: 0n, [LUCKY]: 0n }));
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await connectMockWallet(page); await page.waitForTimeout(1200);

const btn = (name) => page.getByRole('button', { name, exact: true });
const battleEnabled = () => page.evaluate(() =>
  ![...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Battle!').disabled);

/* --- connected title: FREE PLAY over PAID PLAY --- */
const order = await page.evaluate(() => [...document.querySelectorAll('button')]
  .map((b) => b.textContent.trim()).filter((t) => /^(FREE PLAY|PAID PLAY)$/.test(t)));
P('FREE PLAY sits above PAID PLAY', order.join('|') === 'FREE PLAY|PAID PLAY');

/* --- paid -> mode select -> wager --- */
await btn('PAID PLAY').click(); await page.waitForTimeout(300);
P('Paid Play opens the opponent window',
  await btn('Play Online').isVisible() && await btn('Play the House').isVisible());
await btn('Play the House').click(); await page.waitForTimeout(300);

P('the wager window says Set Your Wager',
  await page.getByText('Set Your Wager:').isVisible());
P('the switch offers $LUCKY and $USDG',
  await btn('$LUCKY').isVisible() && await btn('$USDG').isVisible());
P('LUCKY is the live side to start, so the text box shows',
  await page.getByPlaceholder('Enter amount of $LUCKY to wager').isVisible());
P('Battle! starts grayed out', !(await battleEnabled()));

await page.getByPlaceholder('Enter amount of $LUCKY to wager').fill('250');
P('typing a LUCKY amount arms Battle!', await battleEnabled());

/* --- flip to USDG: presets replace the box --- */
await btn('$USDG').click(); await page.waitForTimeout(200);
P('USDG swaps the box for the five presets',
  !(await page.getByPlaceholder('Enter amount of $LUCKY to wager').isVisible().catch(() => false))
  && await btn('$5').isVisible() && await btn('$10').isVisible()
  && await btn('$25').isVisible() && await btn('$50').isVisible() && await btn('$100').isVisible());
P('switching sides disarms Battle! until a preset is picked', !(await battleEnabled()));
await btn('$25').click();
P('picking $25 arms it again', await battleEnabled());

/* --- Battle! ends at the honest stub for now --- */
await btn('Battle!').click(); await page.waitForTimeout(300);
P('Battle! lands on the coming-soon window',
  await page.getByText(/still being wired up/).isVisible());
await btn('OK').click(); await page.waitForTimeout(200);

/* --- Back walks the flow in reverse --- */
await btn('Back').click(); await page.waitForTimeout(200);
P('Back from the wager returns to the opponent choice', await btn('Play Online').isVisible());
await btn('Back').click(); await page.waitForTimeout(200);
P('Back again closes the window', !(await btn('Play Online').isVisible().catch(() => false)));

/* --- free play online: also the stub, for now --- */
await btn('FREE PLAY').click(); await page.waitForTimeout(300);
await btn('Play Online').click(); await page.waitForTimeout(300);
P('free Play Online lands on the coming-soon window too',
  await page.getByText(/still being wired up/).isVisible());

await browser.close();
done();
