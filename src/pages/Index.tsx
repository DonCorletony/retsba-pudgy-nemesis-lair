
import React from 'react';
import HeroSection from '../components/HeroSection';
import MerchSection from '../components/MerchSection';
import CollectionsSection from '../components/CollectionsSection';
import HowToBuySection from '../components/HowToBuySection';
import FooterSection from '../components/FooterSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-retsba text-ink dark:text-white overflow-hidden">
      <HeroSection />

      {/* Placeholder slot — content coming soon */}
      <section className="bg-retsba py-28 md:py-40 text-center">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-ink dark:text-white text-6xl md:text-8xl uppercase leading-none">
            Under Construction
          </h2>
          <div className="mx-auto mt-6 h-1.5 w-24 rounded-full bg-ink dark:bg-white" />
        </div>
      </section>

      <MerchSection />
      <CollectionsSection />

      {/* Buy Now → footer share one region with a diagonal top edge.
          EXPERIMENT: background is the TOTAL DOMINION earth photo (with a scrim
          for text legibility) instead of flat black. */}
      <div
        className="relative text-white overflow-hidden"
        style={{ clipPath: 'polygon(0 0, 100% 100px, 100% 100%, 0 100%)' }}
      >
        <img
          src="/art/feature-dominion.png"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/40" />
        <div className="relative z-10">
          <HowToBuySection />
          <FooterSection />
        </div>
      </div>
    </div>
  );
};

export default Index;