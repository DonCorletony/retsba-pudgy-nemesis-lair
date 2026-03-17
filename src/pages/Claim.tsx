import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import FooterSection from '../components/FooterSection';

const Claim = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-foreground">
            {t('claim')}
          </h1>

          <div className="max-w-4xl mx-auto bg-white dark:bg-retsba rounded-2xl shadow-lg p-8">
            <p className="text-center text-muted-foreground text-lg">
              {t('comingSoon')}
            </p>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default Claim;
