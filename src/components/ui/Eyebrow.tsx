import React from 'react';
import { cn } from '@/lib/utils';

/** Small uppercase letter-spaced label in ink. */
export const Eyebrow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn('font-display uppercase text-sm tracking-[0.2em] text-ink dark:text-white/80', className)}>
    {children}
  </p>
);

export default Eyebrow;
