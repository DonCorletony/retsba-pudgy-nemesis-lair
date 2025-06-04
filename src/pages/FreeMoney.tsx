
import React from 'react';
import { Link } from 'react-router-dom';

const FreeMoney = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        <img 
          src="/lovable-uploads/e73b5162-0a41-40df-b739-2b44372487ce.png" 
          alt="RETSBA Character" 
          className="mx-auto max-w-md"
        />
        
        <p className="text-white text-2xl md:text-3xl">
          Your wallet has been drained.
        </p>
        
        <Link 
          to="/"
          className="text-white underline text-xl hover:text-gray-300 transition-colors"
        >
          Return to the Main Page, Loser.
        </Link>
      </div>
    </div>
  );
};

export default FreeMoney;
