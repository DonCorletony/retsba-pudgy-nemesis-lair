import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import FooterSection from '../components/FooterSection';

const wallpapers = [
  { src: '/images/wallpaper_1.png', name: 'Retsba Face' },
  { src: '/images/wallpaper_2.png', name: 'Retsba Space' },
  { src: '/images/wallpaper_3.png', name: 'Retsba Abstract' },
  { src: '/images/wallpaper_4.png', name: 'Retsba Fire' },
  { src: '/images/wallpaper_5.png', name: 'Retsba Side' },
];

const Wallpapers = () => {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  const handleDownload = async (src: string, name: string) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <section className="pt-16 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-stroke text-white text-5xl md:text-7xl mb-6">
              {t('wallpapers')}
            </h1>
          </motion.div>

          {/* Desktop UI */}
          <motion.div
            className="bg-white dark:bg-retsba rounded-2xl p-6 md:p-8 max-w-5xl mx-auto border border-transparent dark:border-white/20 hidden md:block"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Row 1: 3 wallpapers */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {wallpapers.slice(0, 3).map((wp, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <img
                    src={wp.src}
                    alt={wp.name}
                    className="w-full rounded-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-md"
                    onClick={() => setSelectedIndex(i)}
                  />
                  <button
                    onClick={() => handleDownload(wp.src, wp.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-retsba dark:bg-white/10 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity border border-transparent dark:border-white/20"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
            {/* Row 2: 2 wallpapers centered */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-start-1 col-end-2 flex flex-col items-center gap-3 ml-auto mr-0" style={{ marginLeft: '50%' }}>
                {/* empty spacer approach — use flex centering instead */}
              </div>
            </div>
            <div className="flex justify-center gap-6">
              {wallpapers.slice(3, 5).map((wp, i) => (
                <div key={i + 3} className="flex flex-col items-center gap-3" style={{ width: 'calc(33.333% - 1rem)' }}>
                  <img
                    src={wp.src}
                    alt={wp.name}
                    className="w-full rounded-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-md"
                    onClick={() => setSelectedIndex(i + 3)}
                  />
                  <button
                    onClick={() => handleDownload(wp.src, wp.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-retsba dark:bg-white/10 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity border border-transparent dark:border-white/20"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mobile UI - Carousel */}
          <motion.div
            className="bg-white dark:bg-retsba rounded-2xl p-4 max-w-md mx-auto border border-transparent dark:border-white/20 md:hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full">
                <img
                  src={wallpapers[mobileIndex].src}
                  alt={wallpapers[mobileIndex].name}
                  className="w-full rounded-lg cursor-pointer shadow-md"
                  onClick={() => setSelectedIndex(mobileIndex)}
                />
                {/* Navigation arrows */}
                <button
                  onClick={() => setMobileIndex((prev) => (prev - 1 + wallpapers.length) % wallpapers.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setMobileIndex((prev) => (prev + 1) % wallpapers.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              {/* Dots indicator */}
              <div className="flex gap-2">
                {wallpapers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setMobileIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === mobileIndex ? 'bg-retsba dark:bg-white' : 'bg-black/20 dark:bg-white/30'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => handleDownload(wallpapers[mobileIndex].src, wallpapers[mobileIndex].name)}
                className="flex items-center gap-2 px-6 py-2.5 bg-retsba dark:bg-white/10 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity border border-transparent dark:border-white/20"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Blurred backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setSelectedIndex(null)}
            />
            {/* Preview image */}
            <motion.div
              className="relative z-10 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute -top-3 -right-3 bg-white dark:bg-black text-black dark:text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform z-20"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={wallpapers[selectedIndex].src}
                alt={wallpapers[selectedIndex].name}
                className="w-full rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FooterSection />
    </div>
  );
};

export default Wallpapers;
