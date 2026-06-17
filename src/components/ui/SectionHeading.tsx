import React from 'react';
import { cn } from '@/lib/utils';
import Eyebrow from './Eyebrow';

interface SectionHeadingProps {
  eyebrow?: string;
  align?: 'center' | 'left';
  size?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Section header = fire eyebrow + big white-outline title + fire divider.
 * White-outline (not solid) so it stays legible in BOTH pink (light) and
 * black (dark) modes, matching the owner's white-text preference.
 */
export const SectionHeading = ({
  eyebrow,
  align = 'center',
  size = 'text-5xl md:text-6xl',
  className,
  children,
}: SectionHeadingProps) => (
  <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
    {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
    <h2 className={cn('font-display text-ink dark:text-white leading-tight uppercase', size)}>{children}</h2>
    <div className={cn('h-1.5 w-24 rounded-full bg-ink dark:bg-white mt-5', align === 'center' && 'mx-auto')} />
  </div>
);

export default SectionHeading;
