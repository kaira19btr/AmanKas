/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppMode, UserRole } from '../types';
import { GradientButton } from '@/components/ui/gradient-button';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  recentAlerts: Array<{
    id: string;
    finalScore: number;
    status: string;
    timestamp?: string;
    jam?: string;
    amount?: number;
    nominal?: number;
    description?: string;
    deskripsi?: string;
  }>;
  onSelectAlert?: (alertId: string) => void;
  isMasked: boolean;
  setIsMasked: (val: boolean) => void;
  streamingActive: boolean;
  setStreamingActive: (val: boolean) => void;
  onNavigateToLanding?: () => void;
  mode: AppMode;
  onToggleMode: (mode: AppMode) => void;
  role: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  recentAlerts,
  onSelectAlert,
  isMasked,
  setIsMasked,
  streamingActive,
  setStreamingActive,
  onNavigateToLanding,
  mode,
  onToggleMode,
  role,
  onSelectRole,
  onOpenSettings,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [swRegistered, setSwRegistered] = useState<boolean | null>(() => {
    return typeof (window as any)?.__swRegistered === 'boolean' ? (window as any).__swRegistered : null;
  });

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSwStatus = (e: any) => {
      setSwRegistered(e.detail?.registered ?? false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-status', handleSwStatus);

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setSwRegistered(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-status', handleSwStatus);
    };
  }, []);

  const personaName =
    mode === 'koperasi'
      ? role === 'Pengurus'
        ? 'Pengurus · Hendro P.'
        : role === 'Pengawas Senior'
        ? 'Pengawas Senior · Bambang S.'
        : role === 'Dinas Koperasi'
        ? 'Dinas Koperasi · Dra. Ratna'
        : role === 'Anggota (RAT)'
        ? 'Anggota KSP · Akses RAT'
        : 'Pengawas · Sari W.'
      : 'Pemilik · Warung Fiktif Bu Rina';

  const personaInitials =
    mode === 'koperasi'
      ? role === 'Pengurus'
        ? 'PG'
        : role === 'Pengawas Senior'
        ? 'PS'
        : role === 'Dinas Koperasi'
        ? 'DK'
        : role === 'Anggota (RAT)'
        ? 'AG'
        : 'SW'
      : 'BR';

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-[#031B15]/95 backdrop-blur-md border-b border-[#00B386]/25 shadow-xl z-20 flex items-center justify-between px-6 no-print text-white">
      {/* Ambient soft glow */}
      <div className="absolute top-0 right-1/4 w-72 h-16 bg-[#009770]/15 blur-2xl pointer-events-none" />

      {/* Left Search Input Box */}
      <div className="w-64 lg:w-80 relative z-10">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#84F8CA]/80 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mode === 'koperasi' ? 'Cari Pseudonim, ID, Akun...' : 'Cari Transaksi, Kasir, Struk...'}
            className="w-full pl-10 pr-8 py-1.5 text-xs font-ui rounded-full border border-[#00B386]/30 bg-[#0A2A22]/90 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84F8CA] focus:border-transparent transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Middle Banner: Two-Mode Global Switcher & Position Statement */}
      <div className="hidden xl:flex items-center gap-3 relative z-10">
        {/* Mode Switcher: Koperasi | UMKM with smooth visual transition */}
        <div className="flex items-center p-1 rounded-full bg-[#0A2A22] border border-[#00B386]/40 shadow-inner">
          <button
            onClick={() => onToggleMode('koperasi')}
            className={`px-3.5 py-1 rounded-full text-xs font-ui font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              mode === 'koperasi'
                ? 'bg-gradient-to-r from-[#009770] to-[#00B386] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">account_balance</span>
            <span>Koperasi</span>
          </button>
          <button
            onClick={() => onToggleMode('umkm')}
            className={`px-3.5 py-1 rounded-full text-xs font-ui font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              mode === 'umkm'
                ? 'bg-gradient-to-r from-[#FFF637] to-[#E6DC17] text-[#0A2A22] shadow-md font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">storefront</span>
            <span>UMKM</span>
          </button>
        </div>

        {/* System Principle Statement Pill */}
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#84F8CA]" />
          <span>Pengendalian Internal &bull; Bukan Penindakan &bull; Bukan Auditor</span>
        </div>
      </div>

      {/* Right Actions: Compact Mode, Settings, Landing, Stream, Notifications, Persona */}
      <div className="flex items-center gap-2.5 relative z-10">
        {/* Compact Mode Switcher for Tablet/Mobile */}
        <div className="flex xl:hidden items-center p-0.5 rounded-full bg-[#0A2A22] border border-[#00B386]/40">
          <button
            onClick={() => onToggleMode(mode === 'koperasi' ? 'umkm' : 'koperasi')}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold text-[#84F8CA] flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              {mode === 'koperasi' ? 'account_balance' : 'storefront'}
            </span>
            <span className="uppercase">{mode}</span>
          </button>
        </div>

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white/10 border border-[#00B386]/30 flex items-center justify-center text-gray-200 hover:text-white hover:bg-[#009770]/25 transition-all cursor-pointer"
            title="Pengaturan Aturan Red-Flag & Bobot Sinyal"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
          </button>
        )}

        {/* Back to Landing Page Button */}
        {onNavigateToLanding && (
          <GradientButton
            variant="outline"
            size="sm"
            onClick={onNavigateToLanding}
            className="hidden sm:inline-flex bg-white/10 hover:bg-[#009770]/25 text-[#84F8CA] border-[#00B386]/30 text-xs px-3"
            title="Kembali ke Landing Page SADAR"
          >
            <span className="material-symbols-outlined text-[15px] text-[#84F8CA]">home</span>
            <span>Landing</span>
          </GradientButton>
        )}

        {/* PWA Online/Offline / Service Worker Status Badge */}
        {!isOnline ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-mono"
            title="Aplikasi berjalan dalam mode offline lokal."
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Offline</span>
          </div>
        ) : swRegistered === false ? (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-gray-300 text-[10px] font-mono"
            title="Service worker tidak diizinkan di pratinjau iframe. Aplikasi tetap beroperasi offline setelah dipasang (PWA) atau di-host di domain publik."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#84F8CA]" />
            <span>Mode offline tersedia setelah aplikasi dipasang/dideploy</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#009770]/25 border border-[#84F8CA]/40 text-[#84F8CA] text-[11px] font-mono"
            title="Tersambung online & siap beroperasi offline"
          >
            <span className="w-2 h-2 rounded-full bg-[#84F8CA] radar-pulse-green" />
            <span>Online</span>
          </div>
        )}

        {/* Stream Toggle Pill */}
        <button
          onClick={() => setStreamingActive(!streamingActive)}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all cursor-pointer ${
            streamingActive
              ? 'bg-[#009770]/25 border-[#84F8CA]/40 text-[#84F8CA]'
              : 'bg-white/5 border-white/15 text-gray-400'
          }`}
          title="Klik untuk menjeda/melanjutkan telemetri langsung"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              streamingActive ? 'bg-[#84F8CA] radar-pulse-green' : 'bg-gray-500'
            }`}
          />
          <span>{streamingActive ? 'Live' : 'Jeda'}</span>
        </button>

        {/* Privacy Masking Toggle */}
        <button
          onClick={() => setIsMasked(!isMasked)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all cursor-pointer ${
            isMasked
              ? 'bg-[#009770]/25 border-[#84F8CA]/40 text-[#84F8CA]'
              : 'bg-[#CE2F2E]/25 border-[#CE2F2E]/50 text-[#FFB89F]'
          }`}
          title="Klik untuk mengubah mode penyamaran identitas NIK & Nama"
        >
          <span className="material-symbols-outlined text-sm">
            {isMasked ? 'visibility_off' : 'visibility'}
          </span>
          <span className="hidden sm:inline">{isMasked ? 'Tersamar' : 'Terbuka'}</span>
        </button>

        {/* Notification Trigger with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Pemberitahuan Indikator Risiko"
            className="relative w-9 h-9 rounded-full bg-white/10 border border-[#00B386]/30 flex items-center justify-center text-gray-200 hover:text-white hover:bg-[#009770]/25 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {recentAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#CE2F2E] radar-pulse-red" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#031B15] text-white rounded-2xl shadow-2xl border border-[#00B386]/30 p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#00B386]/20">
                <div className="flex items-center gap-2">
                  <span className="font-ui font-semibold text-sm text-white">
                    Indikator Risiko Baru
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#CE2F2E]/30 text-[#FFB89F] border border-[#CE2F2E]/40 text-[10px] font-medium font-mono tabular-nums">
                    {recentAlerts.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 font-ui">
                    Tidak ada transaksi prioritas tinggi saat ini.
                  </p>
                ) : (
                  recentAlerts.slice(0, 5).map((alert, idx) => (
                    <div
                      key={`${alert.id}-${idx}`}
                      onClick={() => {
                        if (onSelectAlert) onSelectAlert(alert.id);
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl bg-[#0A2A22] border border-[#CE2F2E]/30 hover:border-[#CE2F2E] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono tabular-nums font-semibold text-[#FF6665]">
                          SKOR {alert.finalScore}/100 ({alert.status})
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono tabular-nums">
                          {alert.jam || alert.timestamp || ''}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-white mt-0.5 font-mono tabular-nums">
                        Rp {new Intl.NumberFormat('id-ID').format(alert.nominal || alert.amount || 0)}
                      </div>
                      <p className="text-[11px] text-gray-300 truncate mt-0.5 font-ui">
                        {alert.deskripsi || alert.description || alert.id}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#00B386]/30" />

        {/* User Persona Profile Display (e.g. "Pengawas · Sari W." or "Pemilik · Warung Fiktif Bu Rina") */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#0A2A22] border border-[#00B386]/30 hover:border-[#84F8CA] transition-all cursor-pointer"
          >
            <div
              className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs ring-2 ${
                mode === 'koperasi'
                  ? 'bg-[#009770] ring-[#84F8CA]/30'
                  : 'bg-amber-600 ring-[#FFF637]/30'
              }`}
            >
              {personaInitials}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight truncate max-w-[170px]" title={personaName}>
                {personaName}
              </span>
              <span className="font-mono-tabular text-[#84F8CA] text-[9px] uppercase">
                {mode === 'koperasi' ? 'Pengawas KSP' : 'Pemilik Usaha'}
              </span>
            </div>
            <span className="material-symbols-outlined text-sm text-gray-400">arrow_drop_down</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#031B15] text-white rounded-2xl shadow-2xl border border-[#00B386]/30 p-2 z-50 animate-fadeIn text-xs font-mono-tabular">
              <span className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wider block">
                Simulasi Peran Pengguna
              </span>
              {mode === 'koperasi' ? (
                <>
                  <button
                    onClick={() => {
                      onSelectRole('Pengawas');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      role === 'Pengawas' ? 'bg-[#009770] text-white font-bold' : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <span>Pengawas (Sari W.)</span>
                    {role === 'Pengawas' && <span className="material-symbols-outlined text-xs">check</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSelectRole('Pengurus');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      role === 'Pengurus' ? 'bg-[#009770] text-white font-bold' : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <span>Pengurus (Hendro P.)</span>
                    {role === 'Pengurus' && <span className="material-symbols-outlined text-xs">check</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSelectRole('Pengawas Senior');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      role === 'Pengawas Senior' ? 'bg-[#009770] text-white font-bold' : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <span>Pengawas Senior (Bambang S.)</span>
                    {role === 'Pengawas Senior' && <span className="material-symbols-outlined text-xs">check</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSelectRole('Dinas Koperasi');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      role === 'Dinas Koperasi' ? 'bg-[#009770] text-white font-bold' : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <span>Dinas Koperasi (Dra. Ratna)</span>
                    {role === 'Dinas Koperasi' && <span className="material-symbols-outlined text-xs">check</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSelectRole('Anggota (RAT)');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      role === 'Anggota (RAT)' ? 'bg-[#009770] text-white font-bold' : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <span>Anggota (Akses Bahan RAT)</span>
                    {role === 'Anggota (RAT)' && <span className="material-symbols-outlined text-xs">check</span>}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onSelectRole('Pemilik UMKM');
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-amber-600/40 text-[#FFF637] font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>Pemilik (Bu Rina)</span>
                  <span className="material-symbols-outlined text-xs">check</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
