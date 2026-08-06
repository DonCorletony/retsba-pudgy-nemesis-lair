/* Two captains, one wire: queue, match, battle, forfeit, rematch. */
import { launch, open, P, done, AUDIO_REGISTRY, DESKTOP } from './lib.mjs';

const LOCAL = `window.__BC_LOCAL_PVP = true;`;
const browser = await launch('allow');
/* BroadcastChannel only spans pages in the SAME browser context, and
   browser.newPage() mints a fresh context each time — so every captain in this
   suite comes from one shared context. */
const ctx = await browser.newContext({ viewport: DESKTOP });
const shared = { newPage: () => ctx.newPage() };

const boot = async () => {
  const page = await open(shared, { viewport: DESKTOP, init: [AUDIO_REGISTRY, LOCAL] });
  await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
  return page;
};
const queueFree = async (page) => {
  await page.getByRole('button', { name: 'FREE PLAY' }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Play Online' }).click();
};
const phaseOf = (page) => page.evaluate(() => window.__BC.phase);
const until = async (page, fn, ms = 8000) => {
  for (let i = 0; i < ms / 150; i++) {
    if (await page.evaluate(fn)) return true;
    await page.waitForTimeout(150);
  }
  return false;
};

/* --- queue alone, then cancel --- */
const A = await boot();
await queueFree(A);
await A.waitForTimeout(900);
P('queueing shows FINDING OPPONENT at black',
  await A.evaluate(() => document.body.innerText.includes('FINDING OPPONENT')));
await A.getByRole('button', { name: 'Cancel' }).click();
await A.waitForTimeout(1200);
P('Cancel backs out to the title screen',
  (await phaseOf(A)) === 'idle'
  && !(await A.evaluate(() => document.body.innerText.includes('FINDING OPPONENT'))));

/* --- two captains match --- */
const B = await boot();
await queueFree(A);
await B.waitForTimeout(300);
await queueFree(B);
P('both land in setup together',
  await until(A, () => window.__BC.phase === 'setup')
  && await until(B, () => window.__BC.phase === 'setup'));

/* --- fleets cross, battle begins, one starter --- */
await A.evaluate(() => window.__BC.testBattle());
await B.evaluate(() => window.__BC.testBattle());
P('both reach battle once fleets have crossed',
  await until(A, () => window.__BC.phase === 'battle')
  && await until(B, () => window.__BC.phase === 'battle'));
const turns = [await A.evaluate(() => window.__BC.turn), await B.evaluate(() => window.__BC.turn)];
console.log('  turns:', JSON.stringify(turns));
P('exactly one captain opens', turns.filter((t) => t === 'you').length === 1);
P('the boards carry each other\'s real fleets',
  await A.evaluate(() => window.__BC.foeFleet.length === 5)
  && await B.evaluate(() => window.__BC.foeFleet.length === 5));

/* --- a volley crosses the wire --- */
const [shooter, target] = turns[0] === 'you' ? [A, B] : [B, A];
await shooter.evaluate(() => {
  const live = [...document.querySelectorAll('button')].filter(
    (b) => b.parentElement?.className.includes('grid-cols-10') && !b.disabled);
  live[0].click();
});
P('the shot lands on the other screen',
  await until(target, () => Object.keys(window.__BC.foeShots).length === 1));
const idxA = await shooter.evaluate(() => Object.keys(window.__BC.yourShots)[0]);
const idxB = await target.evaluate(() => Object.keys(window.__BC.foeShots)[0]);
P(`on the same cell (${idxA} / ${idxB})`, idxA === idxB);

/* --- a wipe ends it on both screens, deterministically --- */
await shooter.evaluate(() => window.__BC.testWipeFoe());
P('the winner sees the win',
  await until(shooter, () => window.__BC.phase === 'over' && window.__BC.winner === 'you'));
P('the loser sees the loss',
  await until(target, () => window.__BC.phase === 'over' && window.__BC.winner === 'foe'));

/* --- both clients attest the result, and the attestations agree --- */
const rA = await shooter.evaluate(() => (window.__BC_REPORTS ?? []).at(-1));
const rB = await target.evaluate(() => (window.__BC_REPORTS ?? []).at(-1));
console.log('  reports:', JSON.stringify({ a: rA, b: rB }));
P('both clients filed a report', !!rA && !!rB);
P('on the same match', rA.match_id === rB.match_id);
P('naming the same winner', rA.winner === rB.winner && rA.winner === rA.reporter);
P('with matching outcomes (win / loss)', rA.outcome === 'win' && rB.outcome === 'loss');

/* --- rematch: both press, both restart, the opener alternates --- */
P('Rematch sits beside New match on both screens',
  await shooter.getByRole('button', { name: 'Rematch' }).isVisible()
  && await target.getByRole('button', { name: 'Rematch' }).isVisible());
await shooter.getByRole('button', { name: 'Rematch' }).click();
await shooter.waitForTimeout(300);
P('one press alone waits on the other captain', (await phaseOf(shooter)) === 'over');
await target.getByRole('button', { name: 'Rematch' }).click();
P('both pressed: a fresh match starts on both screens',
  await until(shooter, () => window.__BC.phase === 'setup')
  && await until(target, () => window.__BC.phase === 'setup'));
await shooter.evaluate(() => window.__BC.testBattle());
await target.evaluate(() => window.__BC.testBattle());
await until(shooter, () => window.__BC.phase === 'battle');
const rturns = [await shooter.evaluate(() => window.__BC.turn), await target.evaluate(() => window.__BC.turn)];
P('and the opener alternated', rturns[0] === 'foe' && rturns[1] === 'you');

/* --- forfeit hands the win across, and leaving grays the rematch --- */
await target.getByRole('button', { name: 'Forfeit' }).click();
await target.waitForTimeout(300);
await target.getByRole('button', { name: 'Yes, Leave' }).click();
P('the other captain wins by forfeit',
  await until(shooter, () => window.__BC.phase === 'over' && window.__BC.winner === 'you'));
const fA = await shooter.evaluate(() => (window.__BC_REPORTS ?? []).at(-1));
const fB = await target.evaluate(() => (window.__BC_REPORTS ?? []).at(-1));
console.log('  forfeit reports:', JSON.stringify({ winner: fA?.outcome, loser: fB?.outcome, ids: [fA?.match_id, fB?.match_id] }));
P('the rematch was attested as its own match', fA.match_id.endsWith('-r1') && fA.match_id === fB.match_id);
P('forfeit attested from both sides', fA.outcome === 'forfeit-win' && fB.outcome === 'loss'
  && fA.winner === fA.reporter && fB.winner === fA.reporter);
P('and their Rematch grays once the opponent is gone',
  await until(shooter, () =>
    [...document.querySelectorAll('button')].find((b) => /^Rematch/.test(b.textContent.trim()))?.disabled === true));

await A.close(); await B.close();

/* --- paid queues only pair on the same wager --- */
{
  const mk = async () => {
    const { mockWalletScript, mockRpc, connectMockWallet } = await import('./lib.mjs');
    const page = await open(shared, {
      viewport: DESKTOP,
      init: [AUDIO_REGISTRY, LOCAL, mockWalletScript()],
    });
    await page.route('**/rpc.mainnet.chain.robinhood.com/**',
      mockRpc({ '0x5fc5360d0400a0fd4f2af552add042d716f1d168': 1000n * 10n ** 6n,
                '0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5': 0n }));
    await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);
    await connectMockWallet(page); await page.waitForTimeout(1000);
    return page;
  };
  const queuePaid = async (page, preset) => {
    await page.getByRole('button', { name: 'PAID PLAY' }).click();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Play Online' }).click();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: '$USDG', exact: true }).click();
    await page.getByRole('button', { name: preset, exact: true }).click();
    await page.getByRole('button', { name: 'Battle!' }).click();
  };
  const C = await mk(); const D = await mk();
  await queuePaid(C, '$25');
  await queuePaid(D, '$50');
  await C.waitForTimeout(2500);
  P('a $25 table and a $50 table never pair',
    (await phaseOf(C)) === 'idle' && (await phaseOf(D)) === 'idle'
    && await C.evaluate(() => document.body.innerText.includes('FINDING OPPONENT')));
  await D.getByRole('button', { name: 'Cancel' }).click();
  await D.waitForTimeout(1200);
  await queuePaid(D, '$25');
  P('matching wagers pair',
    await until(C, () => window.__BC.phase === 'setup')
    && await until(D, () => window.__BC.phase === 'setup'));
  await C.close(); await D.close();
}

await browser.close();
done();
