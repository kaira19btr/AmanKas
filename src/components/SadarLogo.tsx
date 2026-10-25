/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SadarText } from './SadarText';

export interface SadarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: 'light' | 'dark';
}

/**
 * SadarLogo - Official brand logo of SADAR
 * Motif: Explainable AI lens & protective ledger shield,
 * embodying explainable internal control for cooperatives and MSMEs.
 */
export const SadarLogo: React.FC<SadarLogoProps> = ({
  size = 'md',
  showText = false,
  animated = true,
  className = '',
  onClick,
  variant = 'light',
}) => {
  const dimMap = {
    sm: { box: 'w-9 h-9', rounded: 'rounded-xl', svg: 22, text: 'text-sm', badge: 'text-[9px]', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', rounded: 'rounded-xl', svg: 24, text: 'text-base', badge: 'text-[9px]', sub: 'text-[10px]' },
    lg: { box: 'w-16 h-16', rounded: 'rounded-2xl', svg: 38, text: 'text-2xl', badge: 'text-[10px]', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', rounded: 'rounded-3xl', svg: 48, text: 'text-3xl', badge: 'text-xs', sub: 'text-sm' },
  };

  const dim = dimMap[size];
  const isDark = variant === 'dark';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Container Shield Emblem */}
      <div
        className={`${dim.box} ${dim.rounded} bg-gradient-to-br from-[#009770] via-[#008562] to-[#004d39] flex items-center justify-center text-white shadow-md border border-[#84F8CA]/50 relative overflow-hidden group flex-shrink-0`}
      >
        {animated && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(132,248,202,0.3)_0%,transparent_60%)] pointer-events-none" />
        )}

        {/* Vector SVG: Perisai Pembukuan & Lensa Analitik Explainable */}
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Shield Contour */}
          <path
            d="M12 2L4 5V11C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11V5L12 2Z"
            fill="#031B15"
            stroke="#84F8CA"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Ledger & Neural Graph Lines */}
          <path d="M8 8H16" stroke="#84F8CA" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M8 12H13" stroke="#84F8CA" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M8 16H12" stroke="#84F8CA" strokeWidth="1.4" strokeLinecap="round" />

          {/* Explainable AI Amber Indicator Node */}
          {animated ? (
            <g>
              <circle
                cx="16"
                cy="14"
                r="2.5"
                fill="#FFF637"
                className="animate-ping origin-center opacity-75"
                style={{ transformOrigin: '16px 14px' }}
              />
              <circle
                cx="16"
                cy="14"
                r="2"
                fill="#FFF637"
                stroke="#0A2A22"
                strokeWidth="0.8"
              />
            </g>
          ) : (
            <circle
              cx="16"
              cy="14"
              r="2"
              fill="#FFF637"
              stroke="#0A2A22"
              strokeWidth="0.8"
            />
          )}
        </svg>

        {animated && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#84F8CA] shadow-[0_0_6px_#84F8CA] animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Typography Block */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <SadarText variant={isDark ? 'dark' : 'light'} className={dim.text} />
            <span className={`px-1.5 py-0.5 rounded-md font-mono-tabular font-bold uppercase tracking-wider ${
              isDark 
                ? 'bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/40' 
                : 'bg-[#E0F4EE] text-[#009770] border border-[#009770]/30'
            } ${dim.badge}`}>
              Explainable AI
            </span>
          </div>
          <span className={`font-mono-tabular tracking-wide mt-1 line-clamp-1 ${isDark ? 'text-gray-300' : 'text-[#6B5A55]'} ${dim.sub}`}>
            Pengendalian internal koperasi dan UMKM yang dapat dijelaskan
          </span>
        </div>
      )}
    </div>
  );
};

// Re-export SadarText and AmanKasLogo
export { SadarText } from './SadarText';
export const AmanKasLogo = SadarLogo;
