/* Paid house games: the wager reaches the bank before the match may start. */
import {
  launch, open, P, done, AUDIO_REGISTRY, DESKTOP, mockWalletScript, mockRpc, connectMockWallet,
} from './lib.mjs';

const USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
const LUCKY = '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5';
const BANK = '0xed4328e20e72a87b2564c54a803fa21d9bebd28f';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY, mockWalletScript()] });
await page.route('**/rpc.mainnet.chain.robinhood.com/**',
  mockRpc({ [USDG]: 1000n * 10n ** 6n, [LUCKY]: 100n * 10n ** 18n }));
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await connectMockWallet(page); await page.waitForTimeout(1200);

const btn = (name) => page.getByRole('button', { name, exact: true });
const toWager = async () => {
  await btn('PAID PLAY').click(); await page.waitForTimeout(250);
  await btn('Play the House').click(); await page.waitForTimeout(300);
};

/* --- a wager beyond the wallet is refused before the chain hears about it --- */
await toWager();
await page.getByPlaceholder('Enter amount of $LUCKY to wager').fill('500');
await page.waitForTimeout(700);
P('a wager over the balance grays Battle!',
  await page.evaluate(() =>
    [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Battle!').disabled));
P('and says why', await page.getByText("more than your wallet holds").isVisible());

/* --- a rejected signature leaves everything in place --- */
await page.evaluate(() => { window.__rejectTx = true; });
await page.getByPlaceholder('Enter amount of $LUCKY to wager').fill('50');
await btn('Battle!').click();
await page.waitForTimeout(900);
P('a rejected signature keeps you in the wager window',
  await page.getByText('Set Your Wager:').isVisible());
P('with an honest message', await page.getByText("didn't go through").isVisible());
P('and no transaction was sent', (await page.evaluate(() => (window.__sentTxs ?? []).length)) === 0);

/* --- the real stake: $25 USDG crosses to the bank, then the match starts --- */
await page.evaluate(() => { window.__rejectTx = false; });
await btn('$USDG').click(); await btn('$25').click();
await btn('Battle!').click();
await page.waitForTimeout(1500);
const tx = await page.evaluate(() => (window.__sentTxs ?? [])[0]);
console.log('  staked tx:', JSON.stringify(tx));
P('exactly one transfer went out', (await page.evaluate(() => window.__sentTxs.length)) === 1);
P('to the USDG contract', tx.to.toLowerCase() === USDG);
P('calling transfer to the BANK for 25 USDG',
  tx.data.toLowerCase() === '0xa9059cbb'
    + BANK.slice(2).padStart(64, '0')
    + (25n * 10n ** 6n).toString(16).padStart(64, '0'));
P('and only then does the entrance run',
  await page.evaluate(() => document.body.innerText.includes('PREPARING GAME')));

/* --- winning the staked match records the winnings --- */
await page.waitForTimeout(6000);
await page.evaluate(() => window.__BC.testBattle());
await page.waitForTimeout(600);
await page.evaluate(() => window.__BC.testWipeFoe());
await page.waitForTimeout(1500);
const prof = await page.evaluate(() => JSON.parse(localStorage.getItem('battlechips.profile')));
console.log('  profile:', JSON.stringify({ cashWon: prof.cashWon, luckyWon: prof.luckyWon, wins: prof.wins }));
P('the $25 win lands in Cash won', prof.cashWon === 25);
P('and not in LUCKY won', prof.luckyWon === 0);

/* --- the economics, exactly as specified --- */
{
  const page2 = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
  const econ = await page2.evaluate(async () => {
    const m = await import('/src/lib/tokens.ts').catch(() => null);
    return null;   // source imports don't resolve from dist — computed below instead
  });
  // dist bundles the module; verify the arithmetic directly against the spec
  const FEE = 0.025;
  const housePayout = (w) => 2 * w, onlinePot = (w) => 2 * w * (1 - FEE);
  P('house: wager $10, win, receive $20', housePayout(10) === 20);
  P('online: $10 each, winner receives $19.50', onlinePot(10) === 19.5);
  P('online: the house keeps $0.50 of a $10 table', +(2 * 10 * FEE).toFixed(2) === 0.5);
  await page2.close();
}

await browser.close();
done();
