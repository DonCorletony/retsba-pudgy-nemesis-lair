/* Wallet Details opens our own window, not RainbowKit's dark sheet. */
import {
  launch, open, P, done, AUDIO_REGISTRY, DESKTOP, mockWalletScript, mockRpc, connectMockWallet,
} from './lib.mjs';

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY, mockWalletScript()] });
await page.route('**/rpc.mainnet.chain.robinhood.com/**', mockRpc({ [USDG]: 0n, [LUCKY]: 0n }));
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await connectMockWallet(page); await page.waitForTimeout(1400);

await page.getByRole('button', { name: /0x/ }).first().click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'WALLET DETAILS' }).click();
await page.waitForTimeout(700);

const win = await page.evaluate(() => {
  const bar = [...document.querySelectorAll('div')].find(
    (d) => d.className.includes('bg-[#000080]') && /^Wallet/.test(d.textContent));
  if (!bar) return null;
  const panel = bar.parentElement;
  const cs = getComputedStyle(panel);
  const titleCs = getComputedStyle(bar);
  return {
    titleBar: titleCs.backgroundColor,
    body: cs.backgroundColor,
    radius: cs.borderRadius,
    buttons: [...panel.querySelectorAll('button')].map((b) => b.textContent.trim()),
  };
});
console.log('  window:', JSON.stringify(win));
P('a window opens with a navy title bar', win && win.titleBar === 'rgb(0, 0, 128)');
P('its body is Win98 grey', win.body === 'rgb(192, 192, 192)');
P('with square corners, not rounded', win.radius === '0px');
P('Copy Address and Disconnect are both there',
  win.buttons.includes('Copy Address') && win.buttons.includes('Disconnect'));

const dark = await page.evaluate(() => !!document.querySelector('w3m-modal, wcm-modal, [data-rk] [role="dialog"]'));
P('the third-party modal never opens', !dark);

await browser.close();
done();
