import React, { useEffect } from 'react';
import FooterSection from '../components/FooterSection';

const CommandCenter = () => {
  useEffect(() => {
    // Set noindex meta tag to hide from search engines
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <div className="min-h-screen bg-retsba dark:bg-gray-900 text-white pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Command Center</h1>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:border dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-300 text-center">Welcome, Commander.</p>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default CommandCenter;
