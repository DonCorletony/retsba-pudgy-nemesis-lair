/* The funding window: on-demand load, Win98 chrome, and the catalog of what you
   can pay with and what you get. No wallet exists here, so this covers the shell
   and the wiring — a real quote or swap can only be checked against the live
   Relay API with a funded wallet. */
import { launch, open, P, done, settled, DESKTOP, MOBILE, AUDIO_REGISTRY } from './lib.mjs';

const browser = await launch('allow');

/* --- it isn't downloaded until you ask for it --- */
{
  const page = await open(browser, { init: [AUDIO_REGISTRY] });
  const chunks = [];
  page.on('request', (r) => { if (/SwapPortal|relay|solana/i.test(r.url())) chunks.push(r.url()); });
  await page.waitForTimeout(900);
  await page.mouse.click(800, 40);
  await page.waitForTimeout(1200);
  P('the swap chunk is not fetched just to show the title screen', chunks.length === 0);

  const order = await page.evaluate(() => [...document.querySelectorAll('button')]
    .map((b) => b.textContent.trim()).filter((t) => /CONNECT WALLET|^PLAY$|FUND ACCOUNT|SETTINGS/.test(t)));
  console.log('  title buttons:', JSON.stringify(order));
  P('FUND ACCOUNT sits between the primary button and SETTINGS',
    order.indexOf('FUND ACCOUNT') === 1 && order.indexOf('SETTINGS') === 2);

  await page.getByRole('button', { name: 'FUND ACCOUNT' }).click();
  await page.waitForTimeout(2500);
  P('opening it fetches the chunk', chunks.some((u) => /SwapPortal/.test(u)));
  await page.close();
}

/* --- the window itself --- */
for (const [name, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  console.log(`--- ${name} ---`);
  const page = await open(browser, { viewport, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(900);
  await page.mouse.click(viewport.width / 2, 40);
  await page.waitForTimeout(1200);
  await settled(page);
  await page.getByRole('button', { name: 'FUND ACCOUNT' }).click();
  await page.waitForTimeout(2500);

  const win = page.getByText('Fund your account', { exact: true });
  P('the window opens', await win.isVisible());
  P('it is dressed as a Win98 window (navy title bar)', await page.evaluate(() => {
    const bar = [...document.querySelectorAll('div')].find((d) => d.textContent.trim() === 'Fund your account');
    return bar ? getComputedStyle(bar).backgroundColor === 'rgb(0, 0, 128)' : false;
  }));

  // pay-from catalog
  await page.getByRole('button', { name: 'Ethereum' }).click();
  await page.waitForTimeout(300);
  const chains = await page.evaluate(() => [...document.querySelectorAll('ul button')].map((b) => b.textContent.trim()));
  console.log('  chains:', JSON.stringify(chains));
  const want = ['Ethereum', 'Base', 'BNB Chain', 'Avalanche', 'Solana', 'Abstract', 'MegaETH', 'Monad', 'Robinhood'];
  P(`all nine retsba origins are offered (${chains.length})`, want.every((w) => chains.includes(w)));
  await page.keyboard.press('Escape').catch(() => {});
  await page.mouse.click(5, 5);
  await page.waitForTimeout(300);

  // destinations
  await page.getByRole('button', { name: /USDG — Global Dollar/ }).click();
  await page.waitForTimeout(300);
  const dests = await page.evaluate(() => [...document.querySelectorAll('ul button')].map((b) => b.textContent.trim()));
  console.log('  destinations:', JSON.stringify(dests));
  P('exactly two destinations', dests.length === 2);
  P('USDG and LUCKY, nothing else', dests.some((d) => /^USDG/.test(d)) && dests.some((d) => /^LUCKY/.test(d)));
  await page.mouse.click(5, 5);
  await page.waitForTimeout(300);

  P('it says the tokens land on Robinhood Chain',
    /RECEIVE ON ROBINHOOD CHAIN/i.test(await page.locator('body').innerText()));
  P('with no wallet, the action is to connect one',
    await page.getByRole('button', { name: 'CONNECT WALLET' }).last().isVisible());

  await page.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await page.waitForTimeout(500);
  P('CLOSE dismisses it', !(await page.getByText('Fund your account', { exact: true }).isVisible().catch(() => false)));
  await page.close();
}

/* --- Solana asks where to send, since it can't receive on Robinhood --- */
{
  const page = await open(browser, { init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(900);
  await page.mouse.click(800, 40);
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'FUND ACCOUNT' }).click();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Ethereum' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Solana', exact: true }).click();
  await page.waitForTimeout(500);
  const body = await page.locator('body').innerText();
  P('picking Solana asks for a destination address', /SEND TO \(ROBINHOOD ADDRESS\)/i.test(body));
  P('and explains why', /Paying from Solana/i.test(body));
  const tokens = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /^SOL$/.test(x.textContent.trim()));
    return !!b;
  });
  P('its token list switches to SOL', tokens);
  await page.getByRole('button', { name: 'SEND TO', exact: false }).count().catch(() => {});
  const input = page.locator('input[placeholder="0x…"]');
  await input.fill('nonsense');
  await page.waitForTimeout(300);
  P('a bad address is called out', /doesn't look like a 0x address/i.test(await page.locator('body').innerText()));
  await page.close();
}

await browser.close();
done();
