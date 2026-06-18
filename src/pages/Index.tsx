
import React from 'react';
import HeroSection from '../components/HeroSection';
import MerchSection from '../components/MerchSection';
import CollectionsSection from '../components/CollectionsSection';
import HowToBuySection from '../components/HowToBuySection';
import FooterDiorama from '../components/FooterDiorama';

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

      {/* Buy Now → footer share one region with a diagonal top edge over the
          TOTAL DOMINION earth photo. The same treatment wraps every subpage's
          footer via <FooterDiorama />. */}
      <FooterDiorama>
        <HowToBuySection />
      </FooterDiorama>
    </div>
  );
};

export default Index;