/* Forfeiting leaves the match, not the game. */
import { launch, open, P, done, settled, AUDIO_REGISTRY, DESKTOP } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
await page.getByRole('button', { name: 'FREE PLAY' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Play the House' }).click();
await settled(page); await page.waitForTimeout(600);

await page.getByRole('button', { name: 'New match' }).click();
await page.waitForTimeout(1200);
P('a match is running', (await page.evaluate(() => window.__BC.phase)) === 'setup');
P('and the bar offers Forfeit', await page.getByRole('button', { name: 'Forfeit' }).isVisible());

await page.getByRole('button', { name: 'Forfeit' }).click();
await page.waitForTimeout(500);
P('No, Stay keeps you in it', await page.getByRole('button', { name: 'No, Stay' }).isVisible());
await page.getByRole('button', { name: 'No, Stay' }).click();
await page.waitForTimeout(400);
P('and the match is still on', (await page.evaluate(() => window.__BC.phase)) === 'setup');

await page.getByRole('button', { name: 'Forfeit' }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Yes, Leave' }).click();
await settled(page); await page.waitForTimeout(800);

const phase = await page.evaluate(() => window.__BC.phase);
console.log('  after forfeiting:', phase);
P(`it lands on the lobby, not the title screen (${phase})`, phase === 'lobby');
P('New match is there to start another', await page.getByRole('button', { name: 'New match' }).isVisible());
P('the bar offers Back again, not Forfeit', await page.getByRole('button', { name: 'Back' }).isVisible());
P('and the fleet is cleared', (await page.evaluate(() => window.__BC.yourFleet.length)) === 0);

await page.getByRole('button', { name: 'New match' }).click();
await page.waitForTimeout(1200);
P('starting another works', (await page.evaluate(() => window.__BC.yourFleet.length)) === 5);

await page.getByRole('button', { name: 'Forfeit' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Yes, Leave' }).click();
await settled(page); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Back' }).click();
await settled(page); await page.waitForTimeout(800);
P('Back still reaches the title screen', (await page.evaluate(() => window.__BC.phase)) === 'idle');

await browser.close();
done();
