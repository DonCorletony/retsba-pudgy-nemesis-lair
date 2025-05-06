
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
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <a 
              href="https://www.x.com/retsbaxyz" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-stroke text-white text-xl hover:text-black transition-colors"
            >
              X
            </a>
            <a 
              href="https://www.t.me/retsbaonabstract" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-stroke text-white text-xl hover:text-black transition-colors"
            >
              Telegram
            </a>
            <a 
              href="https://memedepot.com/d/retsba" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-stroke text-white text-xl hover:text-black transition-colors"
            >
              Memedepot
            </a>
            <a 
              href="https://dexscreener.com/abstract/0x26e7f241fc81bb168f9f81401184cde74dcc8f31" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-stroke text-white text-xl hover:text-black transition-colors"
            >
              Dexscreener
            </a>
          </div>
        </div>
        
        <div className="mt-8 border-t border-black pt-8 text-center">
          <p className="text-stroke text-white text-xl">
            © {new Date().getFullYear()} RETSBA. Evil. On chain.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
