
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

      {/* Brand-statement banner — mirrors the Pudgy "home for warmth" banner:
          a contained, rounded card sitting just under the marquee. */}
      <section className="bg-retsba pt-12 md:pt-16 pb-9 md:pb-12">
        <div className="container mx-auto px-4">
          <img
            src="/Site pieces/banner thing.png"
            alt="Evil. On Chain. — Retsba, the archnemesis of the Pudgy Penguins and premiere villain of the Abstract blockchain. The world is his. We're just living in it."
            className="w-full h-auto rounded-[28px] shadow-[0_10px_0_rgba(0,0,0,0.30)]"
          />
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