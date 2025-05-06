
import React from 'react';

const FooterSection = () => {
  return (
    <footer className="bg-retsba py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            <img 
              src="/lovable-uploads/c194c553-4308-4953-85e4-fc967b5dbacd.png" 
              alt="RETSBA" 
              className="h-16"
            />
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-stroke text-white text-lg hover:text-black transition-colors">Twitter</a>
            <a href="#" className="text-stroke text-white text-lg hover:text-black transition-colors">Telegram</a>
            <a href="#" className="text-stroke text-white text-lg hover:text-black transition-colors">Discord</a>
            <a href="#" className="text-stroke text-white text-lg hover:text-black transition-colors">Medium</a>
          </div>
        </div>
        
        <div className="mt-8 border-t border-black pt-8 text-center">
          <p className="text-stroke text-white text-lg">
            © {new Date().getFullYear()} RETSBA. The Ultimate Villain of the Abstract Blockchain.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
