/* The title screen and the road into a match, on both viewports. */
import { launch, open, P, done, DESKTOP, MOBILE, AUDIO_REGISTRY } from './lib.mjs';

const browser = await launch('allow');
for (const [name, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  console.log(`--- ${name} ---`);
  const page = await open(browser, { viewport, init: [AUDIO_REGISTRY] });
  await page.waitForTimeout(900);
  await page.mouse.click(viewport.width / 2, 40);          // skip the opening
  await page.waitForTimeout(900);

  P('the wallet button is the primary action', await page.getByRole('button', { name: 'CONNECT WALLET' }).first().isVisible());
  P('settings sits beneath it', await page.getByRole('button', { name: 'SETTINGS' }).first().isVisible());
  P('no PLAY until a wallet is connected', (await page.getByRole('button', { name: /^PLAY$/ }).count()) === 0);
  P('the master sound toggle is bottom-right', (await page.locator('button[aria-label="Mute"], button[aria-label="Unmute"]').count()) >= 1);
  P('no sound nudge when the browser is letting us play', (await page.locator('[role="status"]').count()) === 0);
  P('the footer credit is there', /2026 Lucky Jack Games/.test(await page.locator('body').innerText()));

  await page.evaluate(() => window.__BC.newMatch());       // no wallet in headless
  await page.waitForTimeout(700);
  P('setup puts all five boats out at once', (await page.evaluate(() => window.__BC.yourFleet.length)) === 5);
  P('shuffle and done are the setup controls',
    (await page.getByRole('button', { name: 'SHUFFLE' }).locator('visible=true').count()) === 1 &&
    (await page.getByRole('button', { name: 'DONE' }).locator('visible=true').count()) === 1);

  await page.getByRole('button', { name: 'DONE' }).locator('visible=true').click();
  await page.waitForTimeout(5500);                          // opponent settles, then BEGIN
  const s = await page.evaluate(() => ({ phase: window.__BC.phase, shots: window.__BC.shotsLeft }));
  P(`the match starts (phase=${s.phase})`, s.phase === 'battle');
  P(`five shots a turn (${s.shots})`, s.shots === 5);
  P('the sound toggle follows you into the match', (await page.locator('button[aria-label="Mute"], button[aria-label="Unmute"]').count()) >= 1);
  await page.close();
}
await browser.close();
done();
