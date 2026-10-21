/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AmanKasLogo } from './AmanKasLogo';

export type ActiveTab = 'pemantauan' | 'kesehatan' | 'antrean' | 'sumber_data' | 'laporan';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingReviewCount: number;
  criticalCount: number;
  onLogout?: () => void;
  onNavigateToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  criticalCount,
  onLogout,
  onNavigateToLanding,
}) => {
  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white/95 backdrop-blur-md border-r border-[#F3D9CE] shadow-sm z-30 flex flex-col justify-between p-4 no-print select-none">
      <div className="flex flex-col gap-4">
        {/* Brand & Organization Header with Animative Logo */}
        <div
          className="flex items-center gap-2.5 px-1 py-1 cursor-pointer"
          onClick={onNavigateToLanding}
          title="Klik untuk kembali ke Landing Page"
        >
          <AmanKasLogo size="sm" animated={true} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base text-[#0A2A22] tracking-tight leading-none">
                AmanKas
              </span>
              <span className="px-1 py-0.2 rounded bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[9px] font-bold">
                v1.4
              </span>
            </div>
            <span className="font-mono-tabular text-[#6B5A55] text-[10px] mt-0.5">
              Sistem Keamanan Koperasi
            </span>
          </div>
        </div>

        {/* Back to Landing Page Pill */}
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] hover:bg-[#FFE9DF]/50 text-[#009770] text-xs font-mono-tabular font-medium transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Landing Page</span>
            </span>
            <span className="text-[10px] text-[#6B5A55]">Web Utama</span>
          </button>
        )}

        {/* Navigation Tabs (5 Tabs) */}
        <nav aria-label="Menu Utama" className="flex flex-col gap-1.5">
          {/* 1. Pemantauan Langsung */}
          <button
            onClick={() => setActiveTab('pemantauan')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ease-in-out cursor-pointer ${
              activeTab === 'pemantauan'
                ? 'bg-[#E0F4EE] text-[#009770] font-semibold border-l-4 border-[#009770]'
                : 'text-[#6B5A55] hover:text-[#0A2A22] hover:bg-[#E0F4EE]/40'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={activeTab === 'pemantauan' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              radar
            </span>
            <span className="font-mono-tabular text-xs">Pemantauan Langsung</span>
          </button>

          {/* 2. Kesehatan Akun */}
          <button
            onClick={() => setActiveTab('kesehatan')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ease-in-out cursor-pointer ${
              activeTab === 'kesehatan'
                ? 'bg-[#E0F4EE] text-[#009770] font-semibold border-l-4 border-[#009770]'
                : 'text-[#6B5A55] hover:text-[#0A2A22] hover:bg-[#E0F4EE]/40'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={activeTab === 'kesehatan' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              account_balance
            </span>
            <span className="font-mono-tabular text-xs">Kesehatan Akun</span>
          </button>

          {/* 3. Antrean Tinjauan */}
          <button
            onClick={() => setActiveTab('antrean')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ease-in-out cursor-pointer ${
              activeTab === 'antrean'
                ? 'bg-[#E0F4EE] text-[#009770] font-semibold border-l-4 border-[#009770]'
                : 'text-[#6B5A55] hover:text-[#0A2A22] hover:bg-[#E0F4EE]/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-[20px]"
                style={activeTab === 'antrean' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                warning
              </span>
              <span className="font-mono-tabular text-xs">Antrean Tinjauan</span>
            </div>
            {criticalCount > 0 && (
              <span className="bg-[#CE2F2E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                {criticalCount}
              </span>
            )}
          </button>

          {/* 4. Sumber Data dan Privasi */}
          <button
            onClick={() => setActiveTab('sumber_data')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ease-in-out cursor-pointer ${
              activeTab === 'sumber_data'
                ? 'bg-[#E0F4EE] text-[#009770] font-semibold border-l-4 border-[#009770]'
                : 'text-[#6B5A55] hover:text-[#0A2A22] hover:bg-[#E0F4EE]/40'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={activeTab === 'sumber_data' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              lock
            </span>
            <span className="font-mono-tabular text-xs">Sumber Data dan Privasi</span>
          </button>

          {/* 5. Laporan Integritas */}
          <button
            onClick={() => setActiveTab('laporan')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ease-in-out cursor-pointer ${
              activeTab === 'laporan'
                ? 'bg-[#E0F4EE] text-[#009770] font-semibold border-l-4 border-[#009770]'
                : 'text-[#6B5A55] hover:text-[#0A2A22] hover:bg-[#E0F4EE]/40'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={activeTab === 'laporan' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              assessment
            </span>
            <span className="font-mono-tabular text-xs">Laporan Integritas</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Bottom: Live Status Module, Koperasi Entity & Logout Action */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-[#F3D9CE]">
        {/* Radar Health Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#E0F4EE]/70 border border-[#009770]/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#009770] radar-pulse-green" />
            <span className="font-mono-tabular text-[11px] font-bold text-[#009770] tracking-wider">
              RADAR AKTIF
            </span>
          </div>
          <span className="font-mono-tabular text-[#6B5A55] text-[10px]">99.8% Sinyal</span>
        </div>

        {/* Koperasi Entity Tag */}
        <div className="px-3 py-1.5 bg-[#FFDBCF]/40 rounded-lg border border-[#F3D9CE]">
          <div className="text-[9px] font-mono-tabular uppercase text-[#86513D] font-semibold tracking-wider">
            Entitas Koperasi
          </div>
          <div className="text-xs font-medium text-[#0A2A22] truncate">
            KSP Mitra Sejahtera (Demo)
          </div>
        </div>

        {/* Logout to Login Page link button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#6B5A55] hover:text-[#CE2F2E] hover:bg-[#FFDAD6]/30 text-xs font-mono-tabular transition-colors cursor-pointer w-full text-left"
            title="Keluar ke Halaman Login"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Halaman Login</span>
          </button>
        )}
      </div>
    </aside>
  );
};
