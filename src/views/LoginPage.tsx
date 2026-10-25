/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SadarLogo } from '../components/SadarLogo';
import { SadarText } from '../components/SadarText';
import { soundEngine } from '../utils/soundEffects';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { GradientButton } from '@/components/ui/gradient-button';

interface LoginPageProps {
  onLoginSuccess: (userRole?: string) => void;
  onDirectToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onDirectToLanding,
}) => {
  const [selectedRole, setSelectedRole] = useState<'bendahara' | 'pengawas' | 'kasir'>('bendahara');
  const [staffId, setStaffId] = useState('3171-8840-02');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  
  // AI Machine Boot Sequence state
  const [isAiBooting, setIsAiBooting] = useState<boolean>(false);
  const [bootStep, setBootStep] = useState<number>(0);
  const [bootProgress, setBootProgress] = useState<number>(0);
  const [showRoleInfo, setShowRoleInfo] = useState<boolean>(false);

  const roles = [
    {
      id: 'bendahara',
      label: 'Bendahara Utama',
      name: 'Sari Wulandari, S.E.',
      idCode: '3171-8840-02',
      badge: 'Otoritas Verifikator',
      icon: 'shield',
      scope: 'Otorisasi Penuh & Keputusan Antrean',
    },
    {
      id: 'pengawas',
      label: 'Ketua Pengawas',
      name: 'Bambang Irawan, Ak., CA',
      idCode: 'K-99120-OJK',
      badge: 'Audit Forensik',
      icon: 'policy',
      scope: 'Analisis Benford & Laporan Integritas',
    },
    {
      id: 'kasir',
      label: 'Kasir Shift 2',
      name: 'Ahmad Fauzi',
      idCode: '0893-KAS-BRT',
      badge: 'Teller Operasional',
      icon: 'point_of_sale',
      scope: 'Pencatatan & Penelusuran Transaksi',
    },
  ];

  const handleRoleSelect = (roleKey: 'bendahara' | 'pengawas' | 'kasir') => {
    soundEngine.playClick(880);
    setSelectedRole(roleKey);
    const found = roles.find((r) => r.id === roleKey);
    if (found) {
      setStaffId(found.idCode);
      setPin('1234');
    }
  };

  const handleStartLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAiBooting) return;

    // Trigger futuristic AI machine sound sequence
    soundEngine.playAiBootSequence();
    setIsAiBooting(true);
    setBootStep(0);
    setBootProgress(12);

    // AI Machine boot step progression
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setBootStep(1);
        setBootProgress(38);
      }, 350)
    );

    timers.push(
      setTimeout(() => {
        setBootStep(2);
        setBootProgress(67);
      }, 750)
    );

    timers.push(
      setTimeout(() => {
        setBootStep(3);
        setBootProgress(89);
      }, 1150)
    );

    timers.push(
      setTimeout(() => {
        setBootStep(4);
        setBootProgress(100);
      }, 1500)
    );

    timers.push(
      setTimeout(() => {
        setIsAiBooting(false);
        onLoginSuccess(selectedRole);
      }, 1950)
    );

    return () => timers.forEach(clearTimeout);
  };

  const bootMessages = [
    'Menginisialisasi Kernel SADAR Explainable AI Engine...',
    'Memuat Model Isolation Forest (35 Pohon Anomali)...',
    'Sinkronisasi Vektor Uji Nigrini (Benford MAD Multi-Akun)...',
    'Otentikasi Kredensial & Enkripsi Kunci Sesi AES-256...',
    'Akses Diberikan: Selamat Datang di Pusat Kendali!',
  ];

  const activeRoleObj = roles.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F4] text-[#0A2A22] selection:bg-[#009770] selection:text-white relative overflow-hidden">
      {/* Ambient futuristic background glow & grid lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-[#009770]/15 via-[#FFB89F]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#009770_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Top Bar for Login */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-[#00B386]/30 bg-[#031B15]/95 backdrop-blur-md relative z-10 text-white">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => { soundEngine.playClick(600); onDirectToLanding(); }}>
          <SadarLogo size="md" animated={true} variant="dark" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <SadarText variant="dark" className="text-xl leading-none" />
              <span className="px-2 py-0.5 rounded-full bg-[#009770]/30 text-[#84F8CA] font-mono-tabular text-[9px] font-bold border border-[#84F8CA]/40 uppercase tracking-wider">
                Explainable AI
              </span>
            </div>
            <span className="font-mono-tabular text-gray-400 text-[10px] tracking-wide mt-0.5">
              Pengendalian internal koperasi dan UMKM yang dapat dijelaskan
            </span>
          </div>
        </div>

        {/* Direct Link to Landing Page Header Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick(720);
              onDirectToLanding();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-[#009770]/25 text-[#84F8CA] border border-[#00B386]/40 font-mono-tabular text-xs font-semibold shadow-xs transition-all cursor-pointer group active:scale-95"
          >
            <span>Kembali ke Landing Page</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </header>

      {/* Center Hero & Login Panel */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full rounded-3xl p-8 border border-[#F3D9CE] shadow-2xl relative overflow-hidden bg-white/95 backdrop-blur-xl">
          {/* Top Decorative Amber Line with scan glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#009770] via-[#00B386] to-[#FFF637]" />

          {/* Centered Animative Sadar Logo matching Menu */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-b from-[#E0F4EE]/70 to-white border border-[#F3D9CE] shadow-sm mb-3 relative group">
              <SadarLogo size="lg" animated={true} />
              <div className="absolute -inset-1 rounded-3xl bg-[#009770]/15 filter blur-sm -z-10 group-hover:bg-[#009770]/25 transition-all" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <SadarText variant="light" className="text-3xl font-black tracking-tight" />
              <span className="px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold border border-[#009770]/30 uppercase tracking-wider">
                Explainable AI
              </span>
            </div>

            <p className="text-xs text-[#6B5A55] max-w-xs leading-relaxed">
              Pengendalian internal koperasi dan UMKM yang dapat dijelaskan · Gerbang Akses Terotentikasi
            </p>
          </div>

          {/* Role Picker (One-click demo profiles) */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono-tabular font-semibold uppercase tracking-wider text-[#6B5A55] flex items-center gap-1.5">
                <span>Pilih Profil Petugas Demo:</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(920);
                  setShowRoleInfo(!showRoleInfo);
                }}
                className="text-[10px] font-mono-tabular text-[#009770] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">info</span>
                <span>{showRoleInfo ? 'Tutup Info' : 'Info Hak Akses'}</span>
              </button>
            </div>

            {/* Informative Popover for Role Privileges */}
            {showRoleInfo && (
              <div className="mb-3 p-3 rounded-xl bg-[#E0F4EE]/60 border border-[#009770]/25 text-[11px] font-mono-tabular text-[#0A2A22] space-y-1 animate-fadeIn">
                <div className="font-bold text-[#009770] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  <span>Matriks Otorisasi Sesuai UU Koperasi &amp; UU PDP:</span>
                </div>
                <p className="text-[#6B5A55]">
                  • <strong>Bendahara</strong>: Dapat membuat keputusan tinjauan transaksi &amp; penyesuaian MAD.
                </p>
                <p className="text-[#6B5A55]">
                  • <strong>Pengawas</strong>: Memiliki hak audit menyeluruh atas 14 akun dan ekspor laporan RAT.
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const isActive = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'border-[#009770] bg-[#E0F4EE] shadow-sm ring-1 ring-[#009770]'
                        : 'border-[#F3D9CE] bg-white hover:bg-[#FFF8F4]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`material-symbols-outlined text-base ${
                            isActive ? 'text-[#009770]' : 'text-[#6B5A55]'
                          }`}
                        >
                          {r.icon}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009770] animate-ping" />
                        )}
                      </div>
                      <div className="font-display font-bold text-xs text-[#0A2A22] leading-tight">
                        {r.label}
                      </div>
                    </div>
                    <div className="mt-2 text-[9px] font-mono-tabular text-[#6B5A55] truncate">
                      {r.name.split(',')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Profile Info Banner */}
          {activeRoleObj && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#009770]" />
                <span className="font-bold text-[#0A2A22]">{activeRoleObj.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white border border-[#F3D9CE] font-mono-tabular text-[10px] text-[#009770] font-semibold">
                {activeRoleObj.badge}
              </span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleStartLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono-tabular font-medium text-[#6B5A55] block mb-1">
                ID Petugas (Staff ID)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  badge
                </span>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono-tabular rounded-xl border border-[#F3D9CE] bg-white focus:outline-none focus:ring-2 focus:ring-[#009770]"
                  placeholder="3171-8840-02"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono-tabular font-medium text-[#6B5A55] block mb-1">
                PIN Otorisasi Rahasia
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  lock
                </span>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs font-mono-tabular rounded-xl border border-[#F3D9CE] bg-white focus:outline-none focus:ring-2 focus:ring-[#009770]"
                  placeholder="••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPin ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <span className="text-[10px] font-mono-tabular text-[#6B5A55] mt-1 block">
                PIN Demo default: <strong className="text-[#009770]">1234</strong>
              </span>
            </div>

            {/* Futuristic Submit Button */}
            <GradientButton
              type="submit"
              disabled={isAiBooting}
              size="full"
              variant="default"
              className="group relative overflow-hidden"
            >
              {/* Animated reflective shine effect */}
              <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_2.5s_infinite]" />
              
              <span className="material-symbols-outlined text-lg group-hover:rotate-45 transition-transform duration-300">
                lock_open
              </span>
              <span>Masuk ke Dasbor Pemantauan</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </GradientButton>
          </form>

          {/* Quick Landing Direct Link */}
          <div className="mt-5 text-center pt-4 border-t border-[#F3D9CE]">
            <GradientButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                soundEngine.playClick(640);
                onDirectToLanding();
              }}
              className="mx-auto"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              <span>Kembali ke Halaman Web Utama AmanKas</span>
            </GradientButton>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="px-8 py-3.5 border-t border-[#F3D9CE] bg-white/70 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between text-xs font-mono-tabular text-[#6B5A55] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#009770] radar-pulse-green" />
          <span>
            <strong>Data simulasi untuk demonstrasi</strong> · KSP Mitra Sejahtera
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Protokol ISO 27001</span>
          <span>•</span>
          <span>Enkripsi AES-256</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* FUTURISTIC AI MACHINE BOOTUP & SCAN MODAL (Suara & Animasi Canggih)     */}
      {/* ========================================================================= */}
      {isAiBooting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#01140F]/85 backdrop-blur-xl animate-fadeIn">
          {/* Futuristic HUD Scan Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,179,134,0.18)_0%,transparent_75%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,151,112,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,151,112,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Scanning Laser Beam Line moving top to bottom */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#84F8CA] to-transparent shadow-[0_0_15px_#84F8CA] animate-[scanLaser_1.6s_ease-in-out_infinite] pointer-events-none" />

          <div className="max-w-md w-full mx-4 p-8 rounded-3xl bg-[#031B15]/95 border-2 border-[#00B386]/60 shadow-[0_0_50px_rgba(0,179,134,0.45)] text-white relative overflow-hidden flex flex-col items-center text-center">
            {/* Top corner tech coordinates */}
            <div className="w-full flex justify-between items-center text-[10px] font-mono-tabular text-[#84F8CA]/70 mb-4 pb-2 border-b border-[#00B386]/20">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00B386] animate-ping" />
                <span>AI_ENGINE_CORE // ACTIVE</span>
              </span>
              <span>NODE_ID: KSP-MTR-01</span>
            </div>

            {/* Rotating Concentric Futuristic AI HUD Rings */}
            <div className="relative w-28 h-28 my-3 flex items-center justify-center">
              {/* Outer Dashed Ring (spinning slow clockwise) */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#84F8CA]/40 animate-[spin_8s_linear_infinite]" />
              
              {/* Middle Precision Segment Ring (spinning counter-clockwise) */}
              <div className="absolute inset-2 rounded-full border border-t-2 border-r-2 border-transparent border-t-[#FFF637] border-r-[#00B386] animate-[spin_3s_linear_infinite_reverse]" />

              {/* Glowing Core with Logo */}
              <div className="relative z-10 p-2 rounded-2xl bg-[#00513B] border border-[#84F8CA] shadow-[0_0_20px_#00B386]">
                <SadarLogo size="md" animated={true} />
              </div>
            </div>

            {/* Neural Matrix Status Title */}
            <h3 className="font-display font-bold text-xl text-white tracking-wide mt-2 flex items-center justify-center gap-2">
              <span>OTENTIKASI AI</span>
              <SadarText variant="dark" className="text-xl font-black" />
            </h3>
            <p className="text-xs font-mono-tabular text-[#84F8CA] mt-1">
              {bootMessages[bootStep]}
            </p>

            {/* Real-time Telemetry Percentage Counter */}
            <div className="w-full mt-6 mb-2">
              <div className="flex justify-between items-center text-xs font-mono-tabular text-[#84F8CA] mb-1.5">
                <span>KALIBRASI MODEL</span>
                <span className="font-bold text-base text-[#FFF637]">
                  <AnimatedCounter value={bootProgress} duration={400} suffix="%" />
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#01251C] overflow-hidden border border-[#00B386]/40 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#009770] via-[#84F8CA] to-[#FFF637] transition-all duration-300 shadow-[0_0_10px_#84F8CA]"
                  style={{ width: `${bootProgress}%` }}
                />
              </div>
            </div>

            {/* Sub-telemetry verification flags */}
            <div className="w-full grid grid-cols-2 gap-2 mt-3 text-[10px] font-mono-tabular text-left text-gray-300">
              <div className="p-2 rounded-lg bg-[#01251C]/80 border border-[#00B386]/30 flex items-center gap-1.5">
                <span className="text-[#84F8CA]">✓</span>
                <span>Benford Nigrini MAD</span>
              </div>
              <div className="p-2 rounded-lg bg-[#01251C]/80 border border-[#00B386]/30 flex items-center gap-1.5">
                <span className="text-[#84F8CA]">✓</span>
                <span>Isolation Forest (c(n))</span>
              </div>
              <div className="p-2 rounded-lg bg-[#01251C]/80 border border-[#00B386]/30 flex items-center gap-1.5">
                <span className="text-[#84F8CA]">✓</span>
                <span>UU PDP No. 27/2022</span>
              </div>
              <div className="p-2 rounded-lg bg-[#01251C]/80 border border-[#00B386]/30 flex items-center gap-1.5">
                <span className="text-[#84F8CA]">✓</span>
                <span>Human-In-The-Loop</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
