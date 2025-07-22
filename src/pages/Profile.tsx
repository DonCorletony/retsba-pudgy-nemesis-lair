import React from 'react';
import NavBar from '../components/NavBar';
import FooterSection from '../components/FooterSection';

const Profile = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Profile</h1>
          <p className="text-center text-lg mb-8">Manage your RETSBA account</p>
          {/* Profile content will go here */}
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default Profile;