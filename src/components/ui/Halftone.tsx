import React from 'react';
import { cn } from '@/lib/utils';

/** Printed-zine halftone dot overlay — the only allowed surface texture (no gradients). */
export const Halftone = ({ className }: { className?: string }) => (
  <div className={cn('halftone pointer-events-none absolute inset-0', className)} aria-hidden />
);

export default Halftone;
