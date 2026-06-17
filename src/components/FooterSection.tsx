import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const FooterSection = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="py-12">
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
              className="font-display text-white text-3xl uppercase hover:-translate-y-0.5 hover:text-white/70 transition-all"
            >
              X
            </a>
            <a 
              href="https://www.t.me/retsbaonabstract" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-display text-white text-3xl uppercase hover:-translate-y-0.5 hover:text-white/70 transition-all"
            >
              Telegram
            </a>
            <a 
              href="https://giphy.com/channel/Retsba" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-display text-white text-3xl uppercase hover:-translate-y-0.5 hover:text-white/70 transition-all"
            >
              Giphy
            </a>
            <a 
              href="https://memedepot.com/d/retsba" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-display text-white text-3xl uppercase hover:-translate-y-0.5 hover:text-white/70 transition-all"
            >
              Memes
            </a>
            <a 
              href="https://dexscreener.com/abstract/0x26e7f241fc81bb168f9f81401184cde74dcc8f31" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-display text-white text-3xl uppercase hover:-translate-y-0.5 hover:text-white/70 transition-all"
            >
              Dexscreener
            </a>
          </div>
        </div>
        
        <div className="mt-8 border-t border-white/20 pt-8 text-center">
          <p className="font-body text-white/90 text-base">
            © {new Date().getFullYear()} RETSBA. {t('footerTagline')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
