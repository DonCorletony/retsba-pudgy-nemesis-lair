import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccount } from 'wagmi';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import FooterSection from '../components/FooterSection';

const Claim = () => {
  const { t } = useLanguage();
  const { isConnected } = useAccount();
  const { login } = useLoginWithAbstract();

  const handleClick = async () => {
    if (!isConnected) {
      await login();
    } else {
      // TODO: claim logic
    }
  };

  return (
    <div className="min-h-screen bg-retsba dark:bg-black">
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white">
            {t('claim')}
          </h1>

          <div className="max-w-md mx-auto bg-white dark:bg-black/90 dark:border dark:border-white/10 rounded-2xl shadow-lg p-10 flex items-center justify-center">
            <button
              onClick={handleClick}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-10 py-3 rounded-xl transition-colors"
            >
              {isConnected ? t('claim') : 'Connect AGW'}
            </button>
          </div>

          <p className="max-w-md mx-auto text-center text-white/80 text-sm mt-6">
            Users holding 10,000 $RETSBA or more can push this button once every 3 hours to generate a single transaction on the Abstract blockchain.
          </p>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default Claim;
