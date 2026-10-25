/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SadarLogo } from './SadarLogo';
import { SadarText } from './SadarText';
import { AppMode, ActiveTab } from '../types';
export type { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingReviewCount: number;
  criticalCount: number;
  mode: AppMode;
  onLogout?: () => void;
  onNavigateToLanding?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  criticalCount,
  mode,
  onLogout,
  onNavigateToLanding,
  onOpenSettings,
}) => {
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-[#031B15] via-[#0A2A22] to-[#01140F] border-r border-[#00B386]/25 shadow-2xl z-30 flex flex-col justify-between p-4 no-print select-none text-white overflow-y-auto scrollbar-thin">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#009770]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-40 h-40 bg-[#FFF637]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-3.5 relative z-10">
        {/* Brand Header with SADAR Logo */}
        <div
          className="flex items-center gap-2.5 px-1 py-1 cursor-pointer"
          onClick={onNavigateToLanding}
          title="Kembali ke Landing Page SADAR"
        >
          <SadarLogo size="sm" animated={true} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <SadarText variant="dark" className="text-base leading-none" />
              <span className="px-1.5 py-0.2 rounded bg-[#009770]/40 text-[#84F8CA] font-mono-tabular text-[9px] font-bold border border-[#84F8CA]/40">
                XAI
              </span>
            </div>
            <span
              className="font-mono-tabular text-gray-400 text-[10px] mt-0.5 truncate max-w-[160px]"
              title="Pengendalian Internal Koperasi & UMKM"
            >
              Pengendalian Internal
            </span>
          </div>
        </div>

        {/* Back to Landing Page Button */}
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-[#00B386]/30 hover:bg-[#009770]/25 text-[#84F8CA] text-xs font-mono-tabular font-medium transition-all cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Landing Page</span>
            </span>
            <span className="text-[10px] text-gray-400">Web Utama</span>
          </button>
        )}

        {/* Mode Identification Label */}
        <div className="px-2 pt-1 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-gray-400">
            {mode === 'koperasi' ? 'Menu Koperasi' : 'Menu Toko / Warung'}
          </span>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
              mode === 'koperasi' ? 'bg-[#009770]/30 text-[#84F8CA]' : 'bg-[#FFF637]/30 text-[#FFF637]'
            }`}
          >
            {mode === 'koperasi' ? 'Pengawas' : 'Pemilik'}
          </span>
        </div>

        {/* NAVIGATION MENUS: 100% DISTINCT PER MODE */}
        <nav aria-label="Menu Utama" className="flex flex-col gap-1">
          {mode === 'koperasi' ? (
            /* ========================================================
               1) MODE KOPERASI NAVIGATION (6 Exclusive Screens)
               ======================================================== */
            <>
              {/* 1. Pemantauan Langsung */}
              <button
                onClick={() => setActiveTab('pemantauan_langsung')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'pemantauan_langsung'
                    ? 'bg-gradient-to-r from-[#009770]/40 to-[#009770]/10 text-[#84F8CA] font-bold border-l-4 border-[#84F8CA] shadow-[inset_0_0_15px_rgba(0,179,134,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'pemantauan_langsung' ? 'text-[#84F8CA]' : 'text-gray-400'
                  }`}
                >
                  radar
                </span>
                <span className="font-mono-tabular text-xs">Pemantauan Langsung</span>
              </button>

              {/* 2. Kesehatan Akun */}
              <button
                onClick={() => setActiveTab('kesehatan_akun')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'kesehatan_akun'
                    ? 'bg-gradient-to-r from-[#009770]/40 to-[#009770]/10 text-[#84F8CA] font-bold border-l-4 border-[#84F8CA] shadow-[inset_0_0_15px_rgba(0,179,134,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'kesehatan_akun' ? 'text-[#84F8CA]' : 'text-gray-400'
                  }`}
                >
                  account_balance
                </span>
                <span className="font-mono-tabular text-xs">Kesehatan Akun</span>
              </button>

              {/* 3. Transaksi Pihak Terkait */}
              <button
                onClick={() => setActiveTab('pihak_terkait')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'pihak_terkait'
                    ? 'bg-gradient-to-r from-purple-500/40 to-purple-500/10 text-purple-200 font-bold border-l-4 border-purple-400 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'pihak_terkait' ? 'text-purple-300' : 'text-gray-400'
                  }`}
                >
                  supervised_user_circle
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-mono-tabular text-xs">Transaksi Pihak Terkait</span>
                  <span className="text-[9px] text-purple-300 font-mono">Hipotesis Kerja</span>
                </div>
              </button>

              {/* 4. Antrean Pengawas */}
              <button
                onClick={() => setActiveTab('antrean_pengawas')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'antrean_pengawas'
                    ? 'bg-gradient-to-r from-[#009770]/40 to-[#009770]/10 text-[#84F8CA] font-bold border-l-4 border-[#84F8CA] shadow-[inset_0_0_15px_rgba(0,179,134,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      activeTab === 'antrean_pengawas' ? 'text-[#84F8CA]' : 'text-gray-400'
                    }`}
                  >
                    fact_check
                  </span>
                  <span className="font-mono-tabular text-xs">Antrean Pengawas</span>
                </div>
                {criticalCount > 0 && (
                  <span className="bg-[#CE2F2E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shadow-[0_0_8px_#CE2F2E]">
                    {criticalCount}
                  </span>
                )}
              </button>

              {/* 5. Bahan RAT */}
              <button
                onClick={() => setActiveTab('bahan_rat')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'bahan_rat'
                    ? 'bg-gradient-to-r from-[#009770]/40 to-[#009770]/10 text-[#84F8CA] font-bold border-l-4 border-[#84F8CA] shadow-[inset_0_0_15px_rgba(0,179,134,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'bahan_rat' ? 'text-[#84F8CA]' : 'text-gray-400'
                  }`}
                >
                  menu_book
                </span>
                <span className="font-mono-tabular text-xs">Bahan RAT</span>
              </button>

              {/* 6. Sumber Data & Privasi */}
              <button
                onClick={() => setActiveTab('sumber_data_privasi')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'sumber_data_privasi'
                    ? 'bg-gradient-to-r from-[#009770]/40 to-[#009770]/10 text-[#84F8CA] font-bold border-l-4 border-[#84F8CA] shadow-[inset_0_0_15px_rgba(0,179,134,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'sumber_data_privasi' ? 'text-[#84F8CA]' : 'text-gray-400'
                  }`}
                >
                  security
                </span>
                <span className="font-mono-tabular text-xs">Sumber Data &amp; Privasi</span>
              </button>
            </>
          ) : (
            /* ========================================================
               2) MODE UMKM NAVIGATION (6 Exclusive Screens)
               ======================================================== */
            <>
              {/* 1. Beranda Usaha */}
              <button
                onClick={() => setActiveTab('beranda_usaha')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'beranda_usaha'
                    ? 'bg-gradient-to-r from-[#FFF637]/30 to-[#FFF637]/10 text-[#FFF637] font-bold border-l-4 border-[#FFF637] shadow-[inset_0_0_15px_rgba(255,246,55,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'beranda_usaha' ? 'text-[#FFF637]' : 'text-gray-400'
                  }`}
                >
                  storefront
                </span>
                <span className="font-mono-tabular text-xs">Beranda Usaha</span>
              </button>

              {/* 2. Kasir dan Selisih Kas */}
              <button
                onClick={() => setActiveTab('kasir_selisih_kas')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'kasir_selisih_kas'
                    ? 'bg-gradient-to-r from-[#FFF637]/30 to-[#FFF637]/10 text-[#FFF637] font-bold border-l-4 border-[#FFF637] shadow-[inset_0_0_15px_rgba(255,246,55,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'kasir_selisih_kas' ? 'text-[#FFF637]' : 'text-gray-400'
                  }`}
                >
                  point_of_sale
                </span>
                <span className="font-mono-tabular text-xs">Kasir &amp; Selisih Kas</span>
              </button>

              {/* 3. Pencampuran Uang */}
              <button
                onClick={() => setActiveTab('pencampuran_uang')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'pencampuran_uang'
                    ? 'bg-gradient-to-r from-purple-500/40 to-purple-500/10 text-purple-200 font-bold border-l-4 border-purple-400 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'pencampuran_uang' ? 'text-purple-300' : 'text-gray-400'
                  }`}
                >
                  call_split
                </span>
                <span className="font-mono-tabular text-xs">Pencampuran Uang</span>
              </button>

              {/* 4. Peringatan Saya */}
              <button
                onClick={() => setActiveTab('peringatan_saya')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'peringatan_saya'
                    ? 'bg-gradient-to-r from-rose-500/40 to-rose-500/10 text-rose-200 font-bold border-l-4 border-rose-400 shadow-[inset_0_0_15px_rgba(244,63,94,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      activeTab === 'peringatan_saya' ? 'text-rose-300' : 'text-gray-400'
                    }`}
                  >
                    notifications_active
                  </span>
                  <span className="font-mono-tabular text-xs">Peringatan Saya</span>
                </div>
                {criticalCount > 0 && (
                  <span className="bg-[#CE2F2E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shadow-[0_0_8px_#CE2F2E]">
                    {criticalCount}
                  </span>
                )}
              </button>

              {/* 5. Arus Kas dan Kesiapan Catatan */}
              <button
                onClick={() => setActiveTab('arus_kas_kesiapan')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'arus_kas_kesiapan'
                    ? 'bg-gradient-to-r from-[#FFF637]/30 to-[#FFF637]/10 text-[#FFF637] font-bold border-l-4 border-[#FFF637] shadow-[inset_0_0_15px_rgba(255,246,55,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'arus_kas_kesiapan' ? 'text-[#FFF637]' : 'text-gray-400'
                  }`}
                >
                  trending_up
                </span>
                <span className="font-mono-tabular text-xs">Arus Kas &amp; Kesiapan</span>
              </button>

              {/* 6. Izin dan Data Saya */}
              <button
                onClick={() => setActiveTab('izin_data_saya')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'izin_data_saya'
                    ? 'bg-gradient-to-r from-[#FFF637]/30 to-[#FFF637]/10 text-[#FFF637] font-bold border-l-4 border-[#FFF637] shadow-[inset_0_0_15px_rgba(255,246,55,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === 'izin_data_saya' ? 'text-[#FFF637]' : 'text-gray-400'
                  }`}
                >
                  lock_person
                </span>
                <span className="font-mono-tabular text-xs">Izin &amp; Data Saya</span>
              </button>
            </>
          )}

          {/* ========================================================
             3) SHARED BOTTOM MENU (Kedua Mode): Lab Validasi & Pengaturan
             ======================================================== */}
          <div className="pt-2 mt-2 border-t border-[#00B386]/20 flex flex-col gap-1">
            <span className="px-3 text-[9px] font-mono uppercase font-bold tracking-wider text-gray-400 mb-0.5">
              Alat Penelitian &amp; Sistem
            </span>

            {/* Lab Validasi */}
            <button
              onClick={() => setActiveTab('lab_validasi')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'lab_validasi'
                  ? 'bg-gradient-to-r from-[#FFF637]/30 to-[#FFF637]/10 text-[#FFF637] font-bold border-l-4 border-[#FFF637]'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-[19px] ${
                    activeTab === 'lab_validasi' ? 'text-[#FFF637]' : 'text-gray-400'
                  }`}
                >
                  science
                </span>
                <span className="font-mono-tabular text-xs">Lab Validasi</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-[#FFF637]/20 text-[#FFF637] font-mono-tabular text-[9px] font-bold">
                Riset
              </span>
            </button>

            {/* Pengaturan Trigger */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px] text-gray-400">tune</span>
                <span className="font-mono-tabular text-xs">Pengaturan</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Sidebar Bottom: Active Mode Entity Card */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-[#00B386]/20 relative z-10 mt-auto">
        <div className="px-3 py-2 bg-[#01140F]/90 rounded-xl border border-[#00B386]/30">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono-tabular uppercase text-[#84F8CA] font-bold tracking-wider">
              Entitas Aktif
            </span>
            <span
              className={`text-[9px] font-bold uppercase font-mono-tabular px-1.5 py-0.2 rounded ${
                mode === 'koperasi' ? 'bg-[#009770]/30 text-[#84F8CA]' : 'bg-[#FFF637]/30 text-[#FFF637]'
              }`}
            >
              {mode}
            </span>
          </div>
          <div className="text-xs font-semibold text-white mt-1 truncate">
            {mode === 'koperasi' ? 'KSP Mitra Sejahtera' : 'Warung Fiktif Bu Rina'}
          </div>
          <div className="text-[10px] text-gray-400 font-mono-tabular mt-0.5 truncate">
            {mode === 'koperasi' ? 'Peran: Pengawas · Sari W.' : 'Peran: Pemilik · Warung Bu Rina'}
          </div>
        </div>

        {/* System Principle Statement */}
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-gray-300 leading-snug">
          <strong className="text-[#84F8CA] block mb-0.5">Prinsip Sistem:</strong>
          <SadarText variant="dark" className="text-[10px] font-bold mr-1 inline-flex" /> adalah alat bantu pengendalian internal: bukan alat penindakan dan bukan pengganti auditor.
        </div>

        {/* Logout to Login Page button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-gray-400 hover:text-[#FF6665] hover:bg-red-500/10 text-xs font-mono-tabular transition-colors cursor-pointer w-full text-left"
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
