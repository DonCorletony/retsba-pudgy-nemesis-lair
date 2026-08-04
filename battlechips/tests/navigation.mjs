/* PLAY opens the game screen without starting a match; Back returns home with
   no second helping of the opening, and the theme comes back. */
import { launch, open, P, done, themeState, settled, AUDIO_REGISTRY } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { init: [AUDIO_REGISTRY] });
const st = () => page.evaluate(() => ({
  phase: window.__BC.phase,
  fleet: window.__BC.yourFleet.length,
  clock: window.__BC.clock,
  left: [...document.querySelectorAll('button')].map((b) => b.textContent.trim())
    .find((t) => t === 'Forfeit' || t === 'Back' || t === 'Exit'),
  onTitle: !!document.querySelector('[alt="Battle Chips"]')?.closest('.min-h-screen'),
  // the transition veil is also a fixed black div — only count one we can see
  black: !![...document.querySelectorAll('div')].find((d) =>
    getComputedStyle(d).backgroundColor === 'rgb(0, 0, 0)' && d.className.includes('fixed')
    && +getComputedStyle(d).opacity > 0.01),
  studio: !!document.querySelector('[aria-label="Lucky Jack Games"]'),
}));

await page.waitForTimeout(900);
await page.mouse.click(800, 40);                       // skip the opening
await page.waitForTimeout(1200);
P('the theme is up on the title screen', (await page.evaluate(themeState))?.playing === true);

// PLAY is wallet-gated in the app; drive the same entry point it calls.
await page.evaluate(() => window.__BC.enterLobby());
await page.waitForTimeout(1600);        // long enough for the theme's fade-out to finish
const lobby = await st();
console.log('  after PLAY:', JSON.stringify(lobby));
P(`PLAY opens the game screen without starting a match (phase=${lobby.phase})`, lobby.phase === 'lobby');
P('no boats are placed', lobby.fleet === 0);
P(`the left button says Back, not Forfeit (${lobby.left})`, lobby.left === 'Back');
P('the theme fades out on the way in', (await page.evaluate(themeState))?.playing === false);
const c1 = lobby.clock;
await page.waitForTimeout(2500);
P(`the match clock isn't running here (${c1} -> ${(await st()).clock})`, (await st()).clock === c1);

// New match from the lobby still works.
await page.getByRole('button', { name: 'New match' }).click();
await page.waitForTimeout(800);
const setup = await st();
P(`New match starts one (phase=${setup.phase}, ${setup.fleet} boats)`, setup.phase === 'setup' && setup.fleet === 5);
P(`and the button becomes Forfeit again (${setup.left})`, setup.left === 'Forfeit');

// Forfeit -> Yes, Leave goes home.
await page.getByRole('button', { name: 'Forfeit' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Yes, Leave' }).click();
await settled(page);
await page.waitForTimeout(400);
const home = await st();
console.log('  back home:', JSON.stringify(home));
P(`it lands on the title screen (phase=${home.phase})`, home.phase === 'idle');
P('with no black overlay — the opening does not run again', home.black === false);
P('and no studio card', home.studio === false);
P('the buttons are there straight away', await page.getByRole('button', { name: 'SETTINGS' }).first().isVisible());
const back = await page.evaluate(themeState);
P(`the theme fades back in (playing=${back?.playing}, vol=${back?.vol})`, back?.playing === true && back.vol > 0);
await page.waitForTimeout(2500);
P(`and reaches level again (${(await page.evaluate(themeState)).vol})`, (await page.evaluate(themeState)).vol > 0.5);

// Back from the lobby, same story.
await page.evaluate(() => window.__BC.enterLobby());
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Back' }).click();
await settled(page);
await page.waitForTimeout(400);
const home2 = await st();
P(`Back returns home too (phase=${home2.phase})`, home2.phase === 'idle');
P('still no opening replay', home2.black === false && home2.studio === false);

await browser.close();
done();
