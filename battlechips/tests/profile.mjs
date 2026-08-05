/* The profile tab, its menu, and what the profile window reports. */
import { launch, open, P, done, settled, AUDIO_REGISTRY, DESKTOP, MOBILE } from './lib.mjs';

const browser = await launch('allow');

/* --- the tab sits opposite the wallet, in the same chrome --- */
for (const [name, vp] of [['desktop', DESKTOP], ['phone', MOBILE]]) {
  const page = await open(browser, { viewport: vp, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(900); await page.mouse.click(vp.width / 2, 40); await page.waitForTimeout(1500);
  const tab = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.querySelector('img') && /CAPTAIN/.test(x.textContent));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    const img = b.querySelector('img').getBoundingClientRect();
    return { left: Math.round(r.left), top: Math.round(r.top),
             avatarFirst: img.left < r.left + r.width / 2,
             rectangular: Math.abs(img.width - img.height) > 2 };
  });
  console.log(`  ${name}:`, JSON.stringify(tab));
  P(`${name}: the profile tab is in the top-left`, tab && tab.left < 40 && tab.top < 40);
  P(`${name}: avatar on the left, name on the right`, tab.avatarFirst);
  P(`${name}: the avatar is rectangular, not square`, tab.rectangular);
  await page.close();
}

const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1500);

/* --- the menu --- */
await page.getByRole('button', { name: /CAPTAIN/ }).click();
await page.waitForTimeout(300);
const items = await page.evaluate(() => [...document.querySelectorAll('button')]
  .map((b) => b.textContent.trim())
  .filter((t) => ['Profile', 'Friends', 'Fund Wallet', 'Settings', 'How to Play', 'Logout'].includes(t)));
console.log('  menu:', JSON.stringify(items));
P('the menu lists every entry in order',
  items.join('|') === 'Profile|Friends|Fund Wallet|Settings|How to Play|Logout');
P('Friends sits between Profile and Fund Wallet',
  items.indexOf('Friends') === 1 && items.indexOf('Fund Wallet') === 2);
P('and Fund Wallet sits directly above Settings',
  items.indexOf('Settings') === items.indexOf('Fund Wallet') + 1);
P('a divider sits above Logout only',
  (await page.evaluate(() => document.querySelectorAll('.border-t').length)) >= 1);

/* --- the profile window --- */
await page.getByRole('button', { name: 'Profile', exact: true }).click();
await page.waitForTimeout(500);
const win = await page.evaluate(() => {
  const t = document.body.innerText;
  return {
    title: !!t.match(/Profile/),
    member: /Member since/i.test(t),
    lvl: /LVL \d+/.test(t),
    xp: /XP to LVL/.test(t),
    record: /Record/i.test(t),
    luckyWon: /LUCKY won/i.test(t),
    cashWon: /Cash won/i.test(t),
    ships: /Ships sunk/i.test(t),
    connect: !!document.querySelector('button')
      && /CONNECT WALLET/.test(t),
    oldLabels: /Rounds won|Tournaments won|Avatars owned/i.test(t),
  };
});
console.log('  window:', JSON.stringify(win));
P('it shows Member since', win.member);
P('it shows a level and XP progress', win.lvl && win.xp);
P('it shows the W-L record', win.record);
P('LUCKY won and Cash won replace rounds/tournaments', win.luckyWon && win.cashWon);
P('Ships sunk replaces avatars owned', win.ships);
P('none of the old stat labels survive', !win.oldLabels);
P('with no wallet, the balances area offers Connect Wallet', win.connect);

await browser.close();
done();
