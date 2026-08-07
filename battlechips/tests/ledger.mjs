/* Deposits: transfer to the bank, hand the hash to the ledger, get credited. */
import {
  launch, open, P, done, AUDIO_REGISTRY, DESKTOP, mockWalletScript, mockRpc, connectMockWallet,
} from './lib.mjs';

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';
const BANK = '0xed4328e20e72a87b2564c54a803fa21d9bebd28f';
const FN = '**/functions/v1/bc-ledger';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY, mockWalletScript()] });
await page.route('**/rpc.mainnet.chain.robinhood.com/**',
  mockRpc({ [USDG]: 1000n * 10n ** 6n, [LUCKY]: 0n }));

/* a scripted ledger: balance reads and deposit credits, all captured */
let balance = 40, calls = [];
await page.route(FN, async (route) => {
  const body = JSON.parse(route.request().postData());
  calls.push(body);
  if (body.action === 'balance') {
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ balances: { USDG: balance } }) });
  }
  if (body.action === 'deposit') {
    balance += 25;
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ credited: 25, token: 'USDG' }) });
  }
});

await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await connectMockWallet(page); await page.waitForTimeout(1200);
const btn = (n) => page.getByRole('button', { name: n, exact: true });
await btn('PAID PLAY').click(); await page.waitForTimeout(250);
await btn('Play the House').click(); await page.waitForTimeout(800);
await btn('$USDG').click(); await page.waitForTimeout(600);

P('the wager window shows the game account balance',
  await page.getByText(/In your account:/).isVisible()
  && await page.evaluate(() => document.body.innerText.includes('40 $USDG')));

await btn('$25').click();
await page.getByRole('button', { name: /Deposit this amount/ }).click();
await page.waitForTimeout(1500);
const tx = await page.evaluate(() => (window.__sentTxs ?? [])[0]);
P('the deposit is a transfer to the bank for $25',
  tx && tx.to.toLowerCase() === USDG
  && tx.data.toLowerCase() === '0xa9059cbb' + BANK.slice(2).padStart(64, '0')
    + (25n * 10n ** 6n).toString(16).padStart(64, '0'));
const depositCall = calls.find((c) => c.action === 'deposit');
P('the confirmed hash goes to the ledger', depositCall?.tx_hash === '0x' + '11'.repeat(32));
P('and the refreshed account shows the credit',
  await page.evaluate(() => document.body.innerText.includes('65 $USDG')));

/* --- a credit that can't land queues and retries --- */
await page.unroute(FN);
let downCalls = 0;
await page.route(FN, async (route) => {
  const body = JSON.parse(route.request().postData());
  if (body.action === 'deposit') { downCalls++; return route.abort(); }
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ balances: { USDG: balance } }) });
});
await page.getByRole('button', { name: /Deposit this amount/ }).click();
await page.waitForTimeout(1800);
P('a failed credit says so honestly',
  await page.getByText(/crediting is delayed/).isVisible());
P('and the hash is queued for retry',
  (await page.evaluate(() => JSON.parse(localStorage.getItem('battlechips.pendingDeposits') ?? '[]'))).length === 1);

/* the queue drains next time the window opens against a working ledger */
await page.unroute(FN);
const retried = [];
await page.route(FN, async (route) => {
  const body = JSON.parse(route.request().postData());
  if (body.action === 'deposit') retried.push(body.tx_hash);
  return route.fulfill({ contentType: 'application/json',
    body: JSON.stringify(body.action === 'deposit' ? { credited: 25 } : { balances: { USDG: balance } }) });
});
await btn('Back').click(); await page.waitForTimeout(200);
await btn('Play the House').click(); await page.waitForTimeout(1200);
P('reopening the window retries the queued credit', retried.length === 1);
P('and clears the queue',
  (await page.evaluate(() => JSON.parse(localStorage.getItem('battlechips.pendingDeposits') ?? '[]'))).length === 0);

await browser.close();
done();
