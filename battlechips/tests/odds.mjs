/* The wheel must pay 9/19 red, 9/19 black, 1/19 green — exactly. */
import { launch, open, P, done, AUDIO_REGISTRY, DESKTOP } from './lib.mjs';

const browser = await launch('allow');
const page = await open(browser, { viewport: DESKTOP, init: [AUDIO_REGISTRY] });
await page.waitForTimeout(900); await page.mouse.click(800, 40); await page.waitForTimeout(1400);

const weights = await page.evaluate(() =>
  Object.fromEntries(window.__BC.COLORS.map((c) => [c.key, c.weight])));
console.log('  declared weights:', JSON.stringify(weights));
P('red and black carry equal weight', weights.RED === weights.BLACK);
P('and the ratio is 18 : 18 : 2 (= 9/19, 9/19, 1/19)',
  weights.RED === 18 && weights.BLACK === 18 && weights.GREEN === 2);

const N = 400000;
const seen = await page.evaluate((n) => {
  const c = { RED: 0, BLACK: 0, GREEN: 0 };
  for (let i = 0; i < n; i++) c[window.__BC.rollColor()]++;
  return c;
}, N);
const want = { RED: 9 / 19, BLACK: 9 / 19, GREEN: 1 / 19 };
for (const k of ['RED', 'BLACK', 'GREEN']) {
  const got = seen[k] / N, drift = Math.abs(got - want[k]);
  console.log(`  ${k.padEnd(5)} ${(got * 100).toFixed(3)}%  want ${(want[k] * 100).toFixed(3)}%  drift ${(drift * 100).toFixed(3)}pp`);
  P(`${k} lands at 9/19-scale odds over ${N} spins`, drift < 0.004);
}
P('red and black come out level', Math.abs(seen.RED - seen.BLACK) / N < 0.005);

await browser.close();
done();
