import React from 'react';
import NavBar from '../components/NavBar';
import FooterSection from '../components/FooterSection';

const PFP = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-8">Profile Picture Converter</h1>
        <p className="text-center text-white/70">Coming soon...</p>
      </div>
      <FooterSection />
    </div>
  );
};

export default PFP;
