/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface SadarTextProps {
  className?: string;
  variant?: 'dark' | 'light' | 'auto';
  gradientAngle?: 'br' | 'r' | 'b';
}

/**
 * SadarText Component
 * Renders the brand name "SADAR" where EACH INDIVIDUAL LETTER
 * (S, A, D, A, R) has its own distinct green-to-yellow gradient.
 */
export const SadarText: React.FC<SadarTextProps> = ({
  className = '',
  variant = 'dark',
  gradientAngle = 'r',
}) => {
  const letters = ['S', 'A', 'D', 'A', 'R'];

  // Green to yellow gradient configuration
  // dark variant: for dark emerald / navy backgrounds (#031B15, #0A2A22)
  // light variant: for light backgrounds (white, cream #FFF8F4) with high contrast gold-yellow
  const gradientColors =
    variant === 'light'
      ? 'from-[#007A55] via-[#16A34A] to-[#EAB308]'
      : 'from-[#00D68F] via-[#22C55E] to-[#FFF637]';

  const angleClass =
    gradientAngle === 'r'
      ? 'bg-gradient-to-r'
      : gradientAngle === 'b'
      ? 'bg-gradient-to-b'
      : 'bg-gradient-to-br';

  return (
    <span
      className={`inline-flex items-baseline font-display font-semibold uppercase tracking-[0.06em] select-none ${className}`}
      aria-label="SADAR"
    >
      {letters.map((char, idx) => (
        <span
          key={idx}
          className={`inline-block ${angleClass} ${gradientColors} bg-clip-text text-transparent`}
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};
