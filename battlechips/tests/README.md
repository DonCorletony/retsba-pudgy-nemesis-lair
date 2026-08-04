# Browser checks

These run against the **built** output, not the dev server — several of the
things they check (asset paths, the audio files, minified behaviour) only look
right after a build.

```sh
npm run build
npx http-server dist -p 4192        # or: python3 -m http.server 4192 --directory dist
node tests/intro.mjs
node tests/audio.mjs
node tests/music.mjs
node tests/title.mjs
```

`BASE` overrides the URL (default `http://127.0.0.1:4192`), `CHROME` the
browser binary.

A note on writing more of these. `page.evaluate()` and `page.waitForFunction()`
hand the page a **user gesture**, which silently unlocks audio and invalidates
any autoplay assertion made after one. Anything testing autoplay has to measure
from an `addInitScript` probe and only read the result out at the end.
