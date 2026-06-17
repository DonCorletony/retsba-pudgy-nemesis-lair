import React from 'react';
import HeroSlideshow from './HeroSlideshow';
import Marquee from './Marquee';

const HeroSection = () => {
  return (
    // Full-bleed ad runs to the very top (nav floats over it); marquee sits flush beneath.
    <section className="bg-white">
      <HeroSlideshow />
      <Marquee />
    </section>
  );
};

export default HeroSection;
