/* The connected wallet: where the pill sits, and what its menu shows. */
import {
  launch, open, P, done, AUDIO_REGISTRY,
  mockWalletScript, mockRpc, connectMockWallet, MOCK_ADDRESS,
} from './lib.mjs';

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';
// 1,234.56 USDG (6dp) and 42.5 LUCKY (18dp)
const BALANCES = { [USDG]: 1234560000n, [LUCKY]: 42500000000000000000n };

const browser = await launch('allow');
const page = await open(browser, { init: [AUDIO_REGISTRY, mockWalletScript()] });
await page.route('**/rpc.mainnet.chain.robinhood.com/**', mockRpc(BALANCES));
await page.waitForTimeout(900);
await page.mouse.click(800, 40);
await page.waitForTimeout(1200);

await connectMockWallet(page);
await page.waitForTimeout(1500);

const pill = page.locator('button[title="' + MOCK_ADDRESS + '"]');
P('a wallet pill appears once connected', await pill.isVisible());

const box = await pill.evaluate((el) => {
  const r = el.getBoundingClientRect();
  const outer = el.closest('.fixed') || el.parentElement.parentElement;
  return { top: Math.round(r.top), right: Math.round(window.innerWidth - r.right),
           position: getComputedStyle(outer).position };
});
console.log('  pill box:', JSON.stringify(box), 'viewport 1600x1000');
P(`the pill is pinned to the top of the window (${box.top}px down)`, box.top < 40);
P(`and to the right (${box.right}px in from the edge)`, box.right < 40);
P(`its box really is fixed, not dropped into flow (${box.position})`, box.position === 'fixed');

P('PLAY has taken the place of CONNECT WALLET',
  (await page.getByRole('button', { name: 'PLAY', exact: true }).count()) === 1 &&
  (await page.getByRole('button', { name: 'CONNECT WALLET' }).count()) === 0);
P('FUND WALLET is still there', await page.getByRole('button', { name: 'FUND WALLET' }).isVisible());

const sizes = await page.evaluate(() => {
  const box = (t) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return [Math.round(r.width), Math.round(r.height)];
  };
  return { play: box('PLAY'), fund: box('FUND WALLET'), settings: box('SETTINGS') };
});
console.log('  title buttons:', JSON.stringify(sizes));
P('PLAY, FUND WALLET and SETTINGS are all the same size',
  String(sizes.play) === String(sizes.fund) && String(sizes.fund) === String(sizes.settings));

// the balance menu
await pill.click();
await page.waitForTimeout(1500);
const menu = await page.evaluate(() => {
  const head = [...document.querySelectorAll('div')].find((d) => d.textContent.trim() === 'On Robinhood Chain');
  const panel = head?.parentElement;
  return panel ? { text: panel.innerText.replace(/\n+/g, ' | '),
                   right: Math.round(window.innerWidth - panel.getBoundingClientRect().right) } : null;
});
console.log('  menu:', JSON.stringify(menu));
P('clicking the pill opens a menu', !!menu);
P('headed by what chain these are on', /On Robinhood Chain/.test(menu?.text ?? ''));
P('showing the USDG balance (1,234.56)', /USDG \| 1,234\.56/.test(menu?.text ?? ''));
P('showing the LUCKY balance (42.5)', /LUCKY \| 42\.5/.test(menu?.text ?? ''));
P('with a disconnect underneath', /DISCONNECT/.test(menu?.text ?? ''));
P('the menu hangs off the right edge with the pill', (menu?.right ?? 99) < 40);

await page.getByRole('button', { name: 'DISCONNECT' }).click();
await page.waitForTimeout(1500);
P('disconnect really disconnects',
  (await page.getByRole('button', { name: 'CONNECT WALLET' }).count()) >= 1);

await page.screenshot({ path: '/tmp/wallet-menu.png' });
await browser.close();
done();
