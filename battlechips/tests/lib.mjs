import { chromium } from 'playwright';

export const BASE = process.env.BASE ?? 'http://127.0.0.1:4192';
export const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const DESKTOP = { width: 1600, height: 1000 };
export const MOBILE = { width: 390, height: 844 };

let failures = 0;
export const P = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures++; };
export const done = () => { if (failures) { console.log(`\n*** ${failures} failing ***`); process.exitCode = 1; } };

/** `policy`: 'block' mimics a first-time visitor, 'allow' a site the browser trusts. */
export const launch = (policy = 'allow') => chromium.launch({
  executablePath: CHROME,
  args: [`--autoplay-policy=${policy === 'block' ? 'document-user-activation-required' : 'no-user-gesture-required'}`],
});

/** Audio built with `new Audio()` never enters the DOM, so keep a registry. */
export const AUDIO_REGISTRY = `window.__mus = []; const OA = window.Audio;
  window.Audio = function (...a) { const el = new OA(...a); window.__mus.push(el); return el; };
  window.Audio.prototype = OA.prototype;`;

export const open = async (browser, { viewport = DESKTOP, init = [], routes = {} } = {}) => {
  const page = await browser.newPage({ viewport });
  for (const s of init) await page.addInitScript(s);
  for (const [glob, body] of Object.entries(routes))
    await page.route(glob, (r) => r.fulfill({ contentType: body.type, body: body.data }));
  page.on('pageerror', (e) => { if (!/Failed to fetch|WebSocket/.test(e.message)) console.log('  PAGEERROR', e.message); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  return page;
};

/** The theme's state, or null before it exists. */
export const themeState = () => (window.__mus || [])
  .filter((a) => /theme/.test(a.src || a.currentSrc))
  .map((a) => ({ playing: !a.paused, vol: +a.volume.toFixed(3), t: +a.currentTime.toFixed(1), dur: Math.round(a.duration || 0) }))[0] ?? null;

/** Opacity of the block holding the title-screen buttons. */
export const controlsOpacity = () => {
  const b = [...document.querySelectorAll('button')].find((x) => /SETTINGS/.test(x.textContent));
  return b ? +getComputedStyle(b.parentElement).opacity : null;
};

/** Wait out any screen dip, so clicks aren't swallowed by the veil. */
export const settled = async (page, timeout = 4000) => {
  for (let i = 0; i < timeout / 100; i++) {
    const busy = await page.evaluate(() => {
      const v = document.querySelector('[aria-hidden].fixed.z-\\[100\\]');
      return v ? getComputedStyle(v).pointerEvents !== 'none' : false;
    });
    if (!busy) return;
    await page.waitForTimeout(100);
  }
};

/* ---------- mock wallet ----------
   The connected states — the corner pill, its balance menu, PLAY replacing
   CONNECT WALLET — are otherwise untestable, since no real wallet exists here.
   This announces an EIP-6963 provider, which the config's auto-discovery picks
   up, and answers the handful of RPC calls wagmi makes of a wallet. */
export const MOCK_ADDRESS = '0x1111111111111111111111111111111111111111';
export const ROBINHOOD_HEX = '0x1237'; // 4663

export const mockWalletScript = (address = MOCK_ADDRESS) => `
(() => {
  const accounts = ['${address}'];
  const listeners = {};
  const provider = {
    on: (e, f) => { (listeners[e] ||= []).push(f); },
    removeListener: (e, f) => { listeners[e] = (listeners[e] || []).filter((x) => x !== f); },
    request: async ({ method, params }) => {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':          return accounts;
        case 'eth_chainId':           return '${ROBINHOOD_HEX}';
        case 'net_version':           return String(parseInt('${ROBINHOOD_HEX}', 16));
        case 'wallet_switchEthereumChain':
        case 'wallet_addEthereumChain': return null;
        case 'eth_blockNumber':       return '0x1';
        case 'eth_sendTransaction': {
          if (window.__rejectTx) { const e = new Error('User rejected'); e.code = 4001; throw e; }
          (window.__sentTxs ||= []).push(params[0]);
          return '0x' + '11'.repeat(32);
        }
        default:                      return null;
      }
    },
  };
  window.ethereum = provider;
  const detail = Object.freeze({
    info: { uuid: '00000000-0000-0000-0000-000000000001', name: 'Mock Wallet',
            icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E',
            rdns: 'app.battlechips.mock' },
    provider,
  });
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
})();`;

/** Answer Robinhood RPC reads with fixed balances, keyed by token address. */
export const mockRpc = (balances) => async (route) => {
  const body = JSON.parse(route.request().postData() || '{}');
  const calls = Array.isArray(body) ? body : [body];
  const reply = calls.map((c) => {
    let result = '0x';
    if (c.method === 'eth_chainId') result = ROBINHOOD_HEX;
    else if (c.method === 'eth_blockNumber') result = '0x1';
    else if (c.method === 'eth_call') {
      const to = (c.params?.[0]?.to || '').toLowerCase();
      const raw = balances[to] ?? 0n;
      result = '0x' + raw.toString(16).padStart(64, '0');
    } else if (c.method === 'eth_getTransactionReceipt') {
      const hash = c.params?.[0];
      result = {
        transactionHash: hash, transactionIndex: '0x0',
        blockHash: '0x' + '22'.repeat(32), blockNumber: '0x1',
        from: '0x' + '00'.repeat(20), to: '0x' + '00'.repeat(20),
        cumulativeGasUsed: '0x5208', gasUsed: '0x5208', effectiveGasPrice: '0x1',
        contractAddress: null, logs: [], logsBloom: '0x' + '0'.repeat(512),
        status: '0x1', type: '0x2',
      };
    }
    return { jsonrpc: '2.0', id: c.id, result };
  });
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(Array.isArray(body) ? reply : reply[0]),
  });
};

/** Click through RainbowKit to the announced mock wallet. */
export const connectMockWallet = async (page, address = MOCK_ADDRESS) => {
  const pill = page.locator(`button[title="${address}"]`);
  // eth_accounts answers without a prompt, so wagmi treats the mock as already
  // authorised and may have reconnected before we got here.
  if (await pill.count()) return;
  await page.getByRole('button', { name: 'CONNECT WALLET' }).first().click({ timeout: 10000 })
    .catch(() => {});
  // With only one discovered wallet RainbowKit sometimes goes straight through,
  // so the picker entry is optional rather than required.
  await page.getByRole('button', { name: 'Mock Wallet', exact: true }).first()
    .click({ timeout: 4000 }).catch(() => {});
  // The pill shows a shortened address, so wait on the title attribute instead.
  await pill.waitFor({ timeout: 20000 });
};
