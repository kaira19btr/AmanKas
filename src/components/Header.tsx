/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  recentAlerts: Transaction[];
  onSelectTransaction: (trx: Transaction) => void;
  isMasked: boolean;
  setIsMasked: (val: boolean) => void;
  streamingActive: boolean;
  setStreamingActive: (val: boolean) => void;
  onNavigateToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  recentAlerts,
  onSelectTransaction,
  isMasked,
  setIsMasked,
  streamingActive,
  setStreamingActive,
  onNavigateToLanding,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#F3D9CE] shadow-sm z-20 flex items-center justify-between px-6 no-print">
      {/* Left Search Input Box */}
      <div className="w-80 lg:w-96">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#6B5A55] text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIK, ID Transaksi, atau Nama Anggota..."
            className="w-full pl-10 pr-4 py-1.5 text-xs font-mono-tabular rounded-full border border-[#F3D9CE] bg-white text-[#0A2A22] placeholder:text-[#6B5A55]/70 focus:outline-none focus:ring-2 focus:ring-[#009770] focus:border-transparent transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-[#6B5A55] hover:text-[#0A2A22]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Actions: Landing Button, Stream Toggle, Privacy Badge, Notification, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Back to Landing Page Button */}
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] text-xs font-mono-tabular font-medium text-[#0A2A22] transition-colors cursor-pointer shadow-xs"
            title="Kembali ke Landing Page Utama"
          >
            <span className="material-symbols-outlined text-[16px] text-[#009770]">home</span>
            <span>Landing Page</span>
          </button>
        )}

        {/* Stream Toggle Pill */}
        <button
          onClick={() => setStreamingActive(!streamingActive)}
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono-tabular transition-all cursor-pointer ${
            streamingActive
              ? 'bg-[#E0F4EE] border-[#009770]/40 text-[#009770]'
              : 'bg-[#FFF8F4] border-[#F3D9CE] text-[#6B5A55]'
          }`}
          title="Klik untuk menjeda/melanjutkan telemetri langsung"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              streamingActive ? 'bg-[#009770] radar-pulse-green' : 'bg-gray-400'
            }`}
          />
          <span>{streamingActive ? 'Stream Aktif (3-6s)' : 'Stream Dijeda'}</span>
        </button>

        {/* Quick Masking Status Toggle */}
        <button
          onClick={() => setIsMasked(!isMasked)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono-tabular transition-all cursor-pointer ${
            isMasked
              ? 'bg-[#E0F4EE] border-[#009770]/40 text-[#009770]'
              : 'bg-[#FFDAD6]/40 border-[#CE2F2E]/30 text-[#CE2F2E]'
          }`}
          title="Klik untuk mengubah mode penyamaran identitas NIK & Nama"
        >
          <span className="material-symbols-outlined text-sm">
            {isMasked ? 'visibility_off' : 'visibility'}
          </span>
          <span className="hidden sm:inline">{isMasked ? 'Privasi: Tersamar' : 'Privasi: Terbuka'}</span>
        </button>

        {/* Notification Trigger with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifikasi Anomali"
            className="relative w-9 h-9 rounded-full bg-white border border-[#F3D9CE] flex items-center justify-center text-[#6B5A55] hover:text-[#0A2A22] hover:bg-[#E0F4EE]/40 transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {recentAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#CE2F2E] radar-pulse-red" />
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#F3D9CE] p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#F3D9CE]">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-[#0A2A22]">
                    Pemberitahuan Audit
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FDE8E8] text-[#CE2F2E] text-[10px] font-bold font-mono">
                    {recentAlerts.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-[#6B5A55] hover:text-[#0A2A22]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <p className="text-xs text-[#6B5A55] text-center py-4">
                    Tidak ada transaksi berisiko tinggi saat ini.
                  </p>
                ) : (
                  recentAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        onSelectTransaction(alert);
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl bg-[#FFF2F2] border border-[#CE2F2E]/30 hover:bg-[#FFEAEA] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-tabular font-bold text-[#CE2F2E]">
                          SKOR {alert.finalScore}/100
                        </span>
                        <span className="text-[10px] text-[#6B5A55] font-mono-tabular">
                          {alert.timestamp}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-[#0A2A22] mt-0.5">
                        Rp {new Intl.NumberFormat('id-ID').format(alert.amount)}
                      </div>
                      <p className="text-[11px] text-[#6B5A55] truncate mt-0.5">
                        {alert.memberName} · {alert.accountName}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#F3D9CE]" />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-[#E0F4EE]/40 border border-[#F3D9CE]">
          <div className="w-8 h-8 rounded-full bg-[#009770] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#009770]/20 shadow-xs">
            SW
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-[#0A2A22] leading-tight">
              Bendahara · Sari W.
            </span>
            <span className="font-mono-tabular text-[#6B5A55] text-[10px]">
              Otoritas Verifikator
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
