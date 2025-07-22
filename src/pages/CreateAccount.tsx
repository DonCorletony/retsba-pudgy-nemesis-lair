import React from 'react';
import NavBar from '../components/NavBar';
import FooterSection from '../components/FooterSection';

const CreateAccount = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Create Account</h1>
          <p className="text-center text-lg mb-8">Join the RETSBA community</p>
          {/* Account creation form will go here */}
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default CreateAccount;