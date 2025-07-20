
import React from 'react';
import NavBar from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import HowToBuySection from '../components/HowToBuySection';
import { UnifiedTradingInterface } from '../components/UnifiedTradingInterface';
import FooterSection from '../components/FooterSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <NavBar />
      <HeroSection />
      <div className="py-20 px-4">
        <UnifiedTradingInterface />
      </div>
      <AboutSection />
      <HowToBuySection />
      <FooterSection />
    </div>
  );
};

export default Index;
