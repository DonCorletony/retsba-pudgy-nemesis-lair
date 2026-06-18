import React, { ReactNode } from 'react';
import FooterSection from './FooterSection';

interface FooterDioramaProps {
  /** Optional content rendered above the footer inside the same photo region
      (e.g. the Buy Now section on the homepage). */
  children?: ReactNode;
}

/**
 * The site-wide footer treatment: the Retsba-and-Earth "Total Dominion" photo
 * (with a dark scrim for legibility) behind the footer, topped by a diagonal
 * slice. Used on the homepage and every subpage so the footer reads identically.
 *
 * When standalone (no children) a top spacer clears the diagonal slice so the
 * footer's social links aren't clipped by it.
 */
const FooterDiorama = ({ children }: FooterDioramaProps) => (
  <div
    className="relative text-white overflow-hidden"
    style={{ clipPath: 'polygon(0 0, 100% 100px, 100% 100%, 0 100%)' }}
  >
    <img
      src="/art/feature-dominion.png"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full object-cover"
    />
    <div className="pointer-events-none absolute inset-0 bg-black/40" />
    <div className="relative z-10">
      {children ?? <div aria-hidden="true" className="pt-24 md:pt-28" />}
      <FooterSection />
    </div>
  </div>
);

export default FooterDiorama;
