import React from 'react';
import { motion } from 'framer-motion';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileNavLayoutProps {
  children: React.ReactNode;
}

export const MobileNavLayout: React.FC<MobileNavLayoutProps> = ({ children }) => {
  const { isOpen, setIsOpen } = useMobileNav();
  const isMobile = useIsMobile();

  // Swipe gestures - only on mobile
  useSwipeGesture({
    onSwipeLeft: () => setIsOpen(true),
    onSwipeRight: () => setIsOpen(false),
    threshold: 50,
    enabled: isMobile,
  });

  // Prevent body scroll when menu is open on mobile
  React.useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Main content - slides left when menu opens */}
      <motion.div
        className="min-h-screen w-full"
        animate={{
          x: isOpen ? '-80%' : 0,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
