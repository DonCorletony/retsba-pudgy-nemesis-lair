import React from 'react';

/**
 * SECRET game test page — reachable only by URL (/testgame), deliberately not
 * linked from the NavBar, footer, or anywhere else. This is the sandbox where
 * the RETSBA game gets built and iterated before it becomes a real feature.
 * No footer diorama on purpose: keep the lab clean for the game viewport.
 */
const TestGame = () => {
  return (
    <div className="min-h-screen flex flex-col bg-retsba dark:bg-black text-ink dark:text-white">
      <div className="flex-1 pt-28 md:pt-32 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-outline text-5xl md:text-7xl text-center uppercase mb-3">
            Testgame
          </h1>
          <p className="font-body text-center text-ink/60 dark:text-white/60 text-sm mb-10">
            Top-secret RETSBA lab. If you found this, no you didn&apos;t.
          </p>

          {/* Game viewport — the game mounts here. 16:9 on desktop, taller on mobile. */}
          <div
            id="game-root"
            className="mx-auto w-full max-w-4xl aspect-[3/4] md:aspect-video rounded-2xl border-[3px] border-ink dark:border-white/20 bg-black shadow-[0_10px_0_rgba(0,0,0,0.30)] flex items-center justify-center overflow-hidden"
          >
            <p className="font-display text-white/40 text-2xl uppercase">Game goes here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestGame;
