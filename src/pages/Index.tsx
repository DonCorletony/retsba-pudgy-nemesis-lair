
import React from 'react';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import GallerySection from '../components/GallerySection';
import HowToBuySection from '../components/HowToBuySection';
import FooterSection from '../components/FooterSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <HowToBuySection />
      <FooterSection />
    </div>
  );
};

export default Index;