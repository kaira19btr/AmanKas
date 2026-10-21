/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface AmanKasLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * AmanKasLogo - Official brand logo of AmanKas
 * Motif: Protective shield (perisai), cashbook ledger lines (garis buku kas),
 * and red anomaly indicator dot (satu titik merah dengan animasi deteksi fraud).
 */
export const AmanKasLogo: React.FC<AmanKasLogoProps> = ({
  size = 'md',
  showText = false,
  animated = true,
  className = '',
  onClick,
}) => {
  // Dimension mapping for various UI contexts
  const dimMap = {
    sm: { box: 'w-9 h-9', rounded: 'rounded-xl', svg: 22, text: 'text-sm', badge: 'text-[9px]', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', rounded: 'rounded-xl', svg: 24, text: 'text-base', badge: 'text-[9px]', sub: 'text-[10px]' },
    lg: { box: 'w-16 h-16', rounded: 'rounded-2xl', svg: 38, text: 'text-2xl', badge: 'text-[10px]', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', rounded: 'rounded-3xl', svg: 48, text: 'text-3xl', badge: 'text-xs', sub: 'text-sm' },
  };

  const dim = dimMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Container Shield Emblem */}
      <div
        className={`${dim.box} ${dim.rounded} bg-gradient-to-br from-[#009770] via-[#008562] to-[#005c44] flex items-center justify-center text-white shadow-md border border-[#00B386]/40 relative overflow-hidden group flex-shrink-0`}
      >
        {/* Subtle ambient light gradient behind shield */}
        {animated && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(132,248,202,0.25)_0%,transparent_60%)] pointer-events-none" />
        )}

        {/* Vector SVG: Perisai dengan Garis Buku Kas dan Satu Titik Merah Anomali */}
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Shield Contour (Perisai Utama Koperasi) */}
          <path
            d="M12 2L4 5V11C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11V5L12 2Z"
            fill="#005B43"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cashbook Ledger Lines (Garis Buku Kas Pembukuan) */}
          <path d="M8 8H16" stroke="#84F8CA" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 12H13" stroke="#84F8CA" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 16H11" stroke="#84F8CA" strokeWidth="1.5" strokeLinecap="round" />

          {/* Red Anomaly Detection Dot (Satu Titik Merah Deteksi Anomali) */}
          {animated ? (
            <g>
              {/* Radar Ping Animation */}
              <circle
                cx="16"
                cy="14"
                r="2.5"
                fill="#CE2F2E"
                className="animate-ping origin-center"
                style={{ transformOrigin: '16px 14px' }}
              />
              {/* Core Alert Node */}
              <circle
                cx="16"
                cy="14"
                r="2"
                fill="#CE2F2E"
                stroke="#FFFFFF"
                strokeWidth="0.9"
              />
            </g>
          ) : (
            <circle
              cx="16"
              cy="14"
              r="2"
              fill="#CE2F2E"
              stroke="#FFFFFF"
              strokeWidth="0.9"
            />
          )}
        </svg>

        {/* Micro-corner indicator beam when animated */}
        {animated && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FFF637] shadow-[0_0_6px_#FFF637] animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Optional Brand Typography Block */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-display font-bold text-[#0A2A22] tracking-tight leading-none ${dim.text}`}>
              AmanKas
            </span>
            <span className={`px-1.5 py-0.5 rounded-md bg-[#E0F4EE] text-[#009770] font-mono-tabular font-bold border border-[#009770]/30 ${dim.badge}`}>
              DETEKSI DINI FRAUD
            </span>
          </div>
          <span className={`font-mono-tabular text-[#6B5A55] tracking-wide mt-1 ${dim.sub}`}>
            Pemantauan Pembukuan Koperasi &amp; UMKM
          </span>
        </div>
      )}
    </div>
  );
};
