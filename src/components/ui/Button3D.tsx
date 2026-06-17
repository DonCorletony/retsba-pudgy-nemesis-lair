import React from 'react';
import { cn } from '@/lib/utils';

interface Button3DProps {
  variant?: 'black' | 'white';
  as?: 'a' | 'button';
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * The signature RETSBA pill button. Hard offset shadow compresses on :active
 * for a tactile press. `black` = primary money-path CTA, `white` = secondary.
 */
export const Button3D = ({
  variant = 'black',
  as = 'button',
  href,
  target,
  rel,
  onClick,
  className,
  children,
}: Button3DProps) => {
  const cls = cn(variant === 'white' ? 'btn-3d-white' : 'btn-3d-black', className);

  if (as === 'a') {
    return (
      <a href={href} target={target} rel={rel} onClick={onClick} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

export default Button3D;
