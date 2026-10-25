/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SadarLogo } from '../components/SadarLogo';
import { SadarText } from '../components/SadarText';
import { InteractiveDemoModal } from '../components/InteractiveDemoModal';
import { Transaction, AppMode } from '../types';
import { ActiveTab } from '../components/Sidebar';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';
import { GradientButton } from '@/components/ui/gradient-button';

interface LandingPageProps {
  onEnterDashboard: (targetTab?: ActiveTab) => void;
  onNavigateToLogin: () => void;
  transactions: Transaction[];
  currentMode?: AppMode;
  onToggleMode?: (m: AppMode) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  onNavigateToLogin,
  transactions,
  currentMode = 'koperasi',
  onToggleMode,
}) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Machine Boot Sequence state when entering dashboard from landing page
  const [isAiBooting, setIsAiBooting] = useState<boolean>(false);
  const [bootStep, setBootStep] = useState<number>(0);
  const [bootProgress, setBootProgress] = useState<number>(0);

  // Live ticking values for the right hero card
  const [liveTrxCount, setLiveTrxCount] = useState(1248);
  const [liveReviewCount, setLiveReviewCount] = useState(17);
  const [pulseTick, setPulseTick] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTrxCount((prev) => prev + Math.floor(1 + Math.random() * 3));
      if (Math.random() < 0.3) {
        setLiveReviewCount((prev) => Math.max(12, Math.min(22, prev + (Math.random() < 0.5 ? 1 : -1))));
      }
      setPulseTick(true);
      setTimeout(() => setPulseTick(false), 800);
    }, 3800);

    return () => clearInterval(timer);
  }, []);

  const bootMessages = [
    'Menginisialisasi Kernel SADAR Explainable AI Engine...',
    'Memuat Model Isolation Forest & Ekstraksi Baseline Median...',
    'Sinkronisasi Uji Chi-Square & Nigrini MAD Multi-Akun...',
    'Memeriksa Kepatuhan Kontrol & Enkripsi Sesi...',
    'Akses Siap: Membuka Pusat Kendali Pengendalian Internal!',
  ];

  const handleLaunchDashboard = (targetTab?: ActiveTab) => {
    if (isAiBooting) return;
    soundEngine.playAiBootSequence();
    setIsAiBooting(true);
    setBootStep(0);
    setBootProgress(14);

    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setBootStep(1);
        setBootProgress(39);
      }, 350)
    );

    timers.push(
      setTimeout(() => {
        setBootStep(2);
        setBootProgress(68);
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
        onEnterDashboard(targetTab);
      }, 1950)
    );
  };

  const scrollToSection = (id: string) => {
    soundEngine.playClick(600);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F4] text-[#0A2A22] antialiased selection:bg-[#009770] selection:text-white relative overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. TOPBAR HEADER                                                          */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#031B15]/95 backdrop-blur-md border-b border-[#00B386]/30 shadow-xl text-white">
        <div className="max-w-[1400px] mx-auto px-6 h-18 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <SadarLogo size="md" animated={true} variant="dark" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <SadarText variant="dark" className="text-xl leading-none" />
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] font-mono-tabular text-[9px] font-bold border border-[#84F8CA]/40 uppercase tracking-wider">
                  Explainable AI
                </span>
              </div>
              <span className="font-mono-tabular text-[10px] text-gray-400 tracking-wide mt-0.5 hidden sm:inline">
                Pengendalian internal koperasi dan UMKM yang dapat dijelaskan
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-gray-300">
            <button
              onClick={() => scrollToSection('segmen')}
              className="hover:text-[#84F8CA] transition-colors cursor-pointer py-1"
            >
              Dua Segmen
            </button>
            <button
              onClick={() => scrollToSection('data-masalah')}
              className="hover:text-[#84F8CA] transition-colors cursor-pointer py-1"
            >
              Data Masalah
            </button>
            <button
              onClick={() => scrollToSection('alur-kerja')}
              className="hover:text-[#84F8CA] transition-colors cursor-pointer py-1"
            >
              Alur Kerja
            </button>
            <button
              onClick={() => scrollToSection('arsitektur-sistem')}
              className="hover:text-[#84F8CA] transition-colors cursor-pointer py-1 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#84F8CA]">account_tree</span>
              <span>Arsitektur Sistem</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Demo Interaktif Button */}
            <GradientButton
              variant="variant"
              size="sm"
              onClick={() => {
                soundEngine.playClick(950);
                setIsDemoModalOpen(true);
              }}
              className="group"
            >
              <span className="material-symbols-outlined text-sm text-[#FFF637] group-hover:rotate-12 transition-transform">
                fullscreen
              </span>
              <span>Demo Interaktif</span>
            </GradientButton>

            {/* Masuk Akun */}
            <GradientButton
              variant="outline"
              size="sm"
              onClick={() => {
                soundEngine.playClick(850);
                onNavigateToLogin();
              }}
              className="bg-white/5 hover:bg-[#009770]/20 text-[#84F8CA] border-[#00B386]/30"
            >
              Masuk Akun
            </GradientButton>

            {/* Akses Dasbor */}
            <GradientButton
              variant="default"
              size="sm"
              onClick={() => handleLaunchDashboard('pemantauan')}
            >
              <span className="material-symbols-outlined text-sm">lock_open</span>
              <span>Akses Dasbor</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </GradientButton>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <GradientButton
              variant="default"
              size="sm"
              onClick={() => handleLaunchDashboard('pemantauan')}
            >
              Dasbor
            </GradientButton>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#00B386]/30 bg-white/5 text-white"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#00B386]/25 bg-[#031B15] text-white px-6 py-4 space-y-3 font-mono-tabular text-xs">
            <button
              onClick={() => scrollToSection('segmen')}
              className="block w-full text-left py-1 text-gray-300 hover:text-[#84F8CA]"
            >
              Dua Segmen
            </button>
            <button
              onClick={() => scrollToSection('data-masalah')}
              className="block w-full text-left py-1 text-gray-300 hover:text-[#84F8CA]"
            >
              Data Masalah
            </button>
            <button
              onClick={() => scrollToSection('alur-kerja')}
              className="block w-full text-left py-1 text-gray-300 hover:text-[#84F8CA]"
            >
              Alur Kerja
            </button>
            <button
              onClick={() => scrollToSection('arsitektur-sistem')}
              className="block w-full text-left py-1 text-gray-300 hover:text-[#84F8CA]"
            >
              Arsitektur Sistem
            </button>
            <div className="pt-2 border-t border-[#00B386]/20 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsDemoModalOpen(true);
                }}
                className="flex-1 py-2 bg-[#009770] text-white rounded-xl text-center font-semibold"
              >
                Demo Interaktif
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="flex-1 py-2 border border-[#00B386]/30 bg-white/5 text-white rounded-xl text-center font-semibold"
              >
                Masuk Akun
              </button>
            </div>
          </div>
        )}
      </header>


      {/* ========================================================================= */}
      {/* 2. HERO SECTION DUA KOLOM                                                 */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-[#FFF8F4] via-[#FFF8F4] to-[#FFE9DF]">
        <div className="absolute top-12 left-10 w-[500px] h-[500px] rounded-full bg-[#009770]/18 blur-[110px] pointer-events-none" />
        <div className="absolute top-28 right-16 w-[450px] h-[450px] rounded-full bg-[#FFF637]/22 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#FFB89F_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column (7 cols): Exact 3-Line Headline & Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#F3D9CE] shadow-xs text-xs font-mono-tabular font-medium text-[#0A2A22]">
                <span className="w-2 h-2 rounded-full bg-[#009770] radar-pulse-green" />
                <span>Pengendalian Internal Berbasis Explainable AI (XAI)</span>
              </div>

              {/* Exact 3-Line Title */}
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#0A2A22] tracking-tight leading-[1.12]">
                Deteksi Dini <br />
                <span className="relative inline-block my-1 px-3.5 py-1 rounded-2xl bg-[#FFF637] text-[#009770] shadow-sm transform -rotate-1 border border-[#EEDC9A]/80">
                  Risiko Keuangan
                </span>{' '}
                <br />
                Koperasi dan UMKM
              </h1>

              {/* Exact Paragraph */}
              <p className="text-base sm:text-lg text-[#6B5A55] max-w-2xl leading-relaxed font-body-md">
                <SadarText variant="light" className="text-base sm:text-lg font-black mr-1 inline-flex" /> membaca catatan transaksi, menandai pola tidak biasa, menjelaskan alasannya, dan menyerahkan keputusan pada manusia.
              </p>

              {/* Two CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <GradientButton
                  variant="default"
                  size="lg"
                  onClick={() => handleLaunchDashboard('pemantauan')}
                >
                  <span className="material-symbols-outlined text-lg">lock_open</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span>Buka Dasbor</span>
                    <SadarText variant="dark" className="text-sm font-black" />
                  </span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </GradientButton>

                <GradientButton
                  variant="outline"
                  size="lg"
                  onClick={() => scrollToSection('segmen')}
                >
                  <span className="material-symbols-outlined text-base">storefront</span>
                  <span>Jelajahi Dua Mode</span>
                </GradientButton>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-mono-tabular text-[#6B5A55]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#009770]">verified</span>
                  <span>Kepatuhan UU PDP No. 27/2022</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#009770]">rule</span>
                  <span>Tanpa Tindakan / Sanksi Otomatis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#009770]">shield</span>
                  <span>Hak Koreksi &amp; Jejak Audit</span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Glass Card "Pusat Kendali SADAR" (Exact 3 Rows) */}
            <div className="lg:col-span-5">
              <div className="glass-panel-elevated rounded-3xl p-6 sm:p-7 border border-[#F3D9CE] shadow-2xl relative overflow-hidden bg-white/95 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F3D9CE]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#E0F4EE] border border-[#009770]/30 flex items-center justify-center text-[#009770] shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">radar</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-[#0A2A22] flex items-center gap-1.5">
                          <span>Pusat Kendali</span>
                          <SadarText variant="light" className="text-base font-black" />
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009770] radar-pulse-green" />
                          LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B5A55] mt-0.5">
                        Telemetri Pengendalian Internal Berkelanjutan
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-[#FFF637]/40 text-[#6B5F00] font-mono-tabular text-[10px] font-bold border border-[#FFF637]">
                    Data simulasi
                  </span>
                </div>

                {/* Subtitle */}
                <div className="py-3 text-[10px] font-mono-tabular uppercase tracking-wider text-[#6B5A55] font-bold">
                  ARSITEKTUR TIGA BARIS SISTEM:
                </div>

                {/* Exact 3 Rows */}
                <div className="space-y-3">
                  {/* Row 1: Skor Akun (Benford dan chi-square) */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between gap-3 hover:bg-[#F3FAF7] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                        <span className="material-symbols-outlined text-[20px]">equalizer</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-[#0A2A22]">
                            Skor Akun
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#009770] bg-[#E0F4EE] px-1.5 py-0.2 rounded font-semibold">
                            Benford &amp; Chi-Square
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5A55] font-mono-tabular mt-0.5">
                          Uji digit pertama, Nigrini MAD &bull; Status Hijau/Kuning/Merah
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold border border-[#009770]/30 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#009770] animate-pulse" />
                      Terpantau
                    </span>
                  </div>

                  {/* Row 2: Skor Transaksi (aturan + anomali) */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between gap-3 hover:bg-[#F3FAF7] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF637]/30 flex items-center justify-center text-[#6B5F00]">
                        <span className="material-symbols-outlined text-[20px]">bubble_chart</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-[#0A2A22]">
                            Skor Transaksi
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#6B5F00] bg-[#FFF637]/40 px-1.5 py-0.2 rounded font-semibold">
                            Aturan + Anomali (50:50)
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5A55] font-mono-tabular mt-0.5">
                          <span className={pulseTick ? 'text-[#009770] font-bold' : ''}>
                            <AnimatedCounter value={liveTrxCount} />
                          </span>{' '}
                          transaksi dievaluasi &bull; Klasifikasi persentil P90/P98
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#FFF637] text-[#6B5F00] font-mono-tabular text-[10px] font-bold border border-[#6B5F00]/25 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                      Netral
                    </span>
                  </div>

                  {/* Row 3: Tinjauan Manusia */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between gap-3 hover:bg-[#F3FAF7] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                        <span className="material-symbols-outlined text-[20px]">gavel</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-[#0A2A22]">
                            Tinjauan Manusia
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#009770] bg-[#E0F4EE] px-1.5 py-0.2 rounded font-semibold">
                            Human-in-the-Loop
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5A55] font-mono-tabular mt-0.5">
                          Keputusan Pengawas/Pemilik melatih bobot &bull; Hak koreksi
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold border border-[#009770]/30 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                      Aktif
                    </span>
                  </div>
                </div>

                {/* CTA inside card */}
                <div className="mt-5 pt-4 border-t border-[#F3D9CE]">
                  <GradientButton
                    variant="default"
                    size="full"
                    onClick={() => handleLaunchDashboard('pemantauan')}
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span>Masuk ke Dasbor</span>
                      <SadarText variant="dark" className="text-sm font-black" />
                    </span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </GradientButton>
                  <p className="text-center font-mono-tabular text-[10px] text-[#6B5A55] mt-2">
                    Data simulasi untuk demonstrasi · Koperasi &amp; UMKM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. NEW SECTION "DUA SEGMEN, SATU MESIN"                                   */}
      {/* ========================================================================= */}
      <section id="segmen" className="py-20 bg-white border-y border-[#F3D9CE]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold uppercase tracking-wider">
              Fleksibilitas Arsitektur
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Dua Segmen, Satu Mesin
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Satu mesin analitik explainable AI yang beradaptasi secara cerdas untuk tata kelola Koperasi dan kesederhanaan operasional UMKM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Segmen 1: Mode Koperasi */}
            <div className="glass-panel rounded-3xl p-7 border-2 border-[#009770]/30 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">account_balance</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#009770]/15 text-[#009770] font-mono-tabular text-xs font-bold border border-[#009770]/30">
                    Mode Koperasi
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-[#0A2A22]">
                  Pengawasan KSP &amp; Simpan Pinjam
                </h3>
                <p className="text-xs sm:text-sm text-[#6B5A55] leading-relaxed">
                  Ditujukan bagi <strong>Pengawas dan Pengurus</strong> koperasi untuk mengawal integritas buku kas harian, simpanan anggota, angsuran pinjaman, dan dana cadangan risiko.
                </p>

                <div className="space-y-2.5 pt-2 text-xs font-mono-tabular">
                  <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#009770] text-sm">badge</span>
                    <span>Pengguna: Pengawas &amp; Pengurus Koperasi</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#009770] text-sm">upload_file</span>
                    <span>Sumber Data: Ekspor CSV Buku Kas &amp; Rekening Koran</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#009770] text-sm">balance</span>
                    <span>Fokus: Uji Benford, pemecahan nominal (smurfing), bahan RAT</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F3D9CE] flex items-center justify-between">
                <span className="text-xs text-[#6B5A55] font-mono-tabular">Data KSP fiktif</span>
                <GradientButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onToggleMode) onToggleMode('koperasi');
                    handleLaunchDashboard('pemantauan');
                  }}
                  className="text-xs"
                >
                  Buka Mode Koperasi &rarr;
                </GradientButton>
              </div>
            </div>

            {/* Segmen 2: Mode UMKM */}
            <div className="glass-panel rounded-3xl p-7 border-2 border-[#FFF637]/60 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden bg-gradient-to-br from-white via-white to-[#FFFDE6]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF637]/40 text-[#6B5F00] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">storefront</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FFF637]/50 text-[#6B5F00] font-mono-tabular text-xs font-bold border border-[#6B5F00]/30">
                    Mode UMKM (Opt-in)
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-[#0A2A22]">
                  Pengendalian Toko &amp; Warung Retail
                </h3>
                <p className="text-xs sm:text-sm text-[#6B5A55] leading-relaxed">
                  Ditujukan bagi <strong>Pemilik Usaha</strong> mikro dan kecil untuk mengendalikan kebocoran kas kasir, void tidak wajar, dan pencampuran uang pribadi.
                </p>

                <div className="space-y-2.5 pt-2 text-xs font-mono-tabular">
                  <div className="p-3 rounded-xl bg-white border border-[#EEDC9A] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B5F00] text-sm">person</span>
                    <span>Pengguna: Pemilik Usaha (Owner)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#EEDC9A] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B5F00] text-sm">receipt_long</span>
                    <span>Sumber Data: CSV Kasir POS, QRIS, Mutasi Bank</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#EEDC9A] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B5F00] text-sm">verified_user</span>
                    <span>Fokus: Void berulang, selisih kas fisik, pencampuran pribadi</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EEDC9A] flex items-center justify-between">
                <span className="text-xs text-[#6B5A55] font-mono-tabular">Warung/Toko fiktif</span>
                <GradientButton
                  variant="variant"
                  size="sm"
                  onClick={() => {
                    if (onToggleMode) onToggleMode('umkm');
                    handleLaunchDashboard('pemantauan');
                  }}
                  className="text-xs text-white"
                >
                  Buka Mode UMKM &rarr;
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION "DATA MASALAH" (EMPAT KARTU SESUAI INSTRUKSI)                  */}
      {/* ========================================================================= */}
      <section id="data-masalah" className="py-20 bg-gradient-to-b from-[#FFF8F4] to-[#FFE9DF]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#FFDBCF] text-[#86513D] font-mono-tabular text-xs font-bold uppercase tracking-wider">
              Urgensi &amp; Fakta Empiris
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Konteks Masalah Koperasi &amp; UMKM
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Data empiris menunjukkan urgensi penguatan pengendalian internal di sektor koperasi simpan pinjam dan kesenjangan pembiayaan UMKM di Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Rp26 T */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#CE2F2E] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-3xl sm:text-4xl text-[#CE2F2E] tracking-tight block">
                  Rp 26 Triliun
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Kerugian Anggota Bermasalah
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Kerugian anggota dari 8 koperasi bermasalah di Indonesia yang mengalami gagal bayar masif.
                </p>
                <div className="w-full h-1.5 bg-[#FDE8E8] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#CE2F2E] rounded-full w-full" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#86513D] leading-snug">
                Sumber: Pernyataan Menkop, ANTARA 2025 (angka disebut sejak 2022, kasus belum tuntas)
              </div>
            </div>

            {/* Card 2: Rp3,4 T dari Rp26 T (±13%) */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#009770] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-3xl sm:text-4xl text-[#009770] tracking-tight block">
                  Rp 3,4 T <span className="text-base font-normal text-gray-500">(±13%)</span>
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Realisasi Tagihan Terbayar
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Dari total Rp26 T kerugian 8 koperasi bermasalah, baru sekitar 13% tagihan yang berhasil didorong terbayar kembali kepada anggota.
                </p>
                <div className="w-full h-1.5 bg-[#E0F4EE] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#009770] rounded-full w-[13%]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#6B5A55] leading-snug">
                Sumber: Katadata, 2024
              </div>
            </div>

            {/* Card 3: 1,62% vs 13,58% */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#6B5F00] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-2xl sm:text-3xl text-[#6B5F00] tracking-tight block">
                  1,62% <span className="text-sm font-normal text-gray-500">vs</span> 13,58%
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Pertumbuhan Kredit UMKM vs Bank
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Pertumbuhan kredit UMKM hanya tumbuh 1,62% dibandingkan pertumbuhan kredit perbankan umum yang mencapai 13,58% pada Juli 2026.
                </p>
                <div className="space-y-1 mt-3">
                  <div className="w-full h-1.5 bg-[#FFF637]/40 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6B5F00] rounded-full w-[12%]" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#6B5A55] leading-snug">
                Sumber: Bank Indonesia (BI), via Infobanknews (Juli 2026)
              </div>
            </div>

            {/* Card 4: Belum dijamin */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#86513D] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-2xl sm:text-3xl text-[#86513D] tracking-tight block">
                  Belum Dijamin
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Status Penjaminan Simpanan
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Simpanan anggota pada koperasi belum dijamin oleh Lembaga Penjamin Simpanan (LPS); regulasi penjaminan khusus masih dalam tahap kajian.
                </p>
                <div className="w-full h-1.5 bg-[#FFDBCF] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#86513D] rounded-full w-full opacity-60" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#86513D] leading-snug">
                Sumber: Lembaga Penjamin Simpanan (LPS), 7 Okt 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION "ALUR KERJA"                                                   */}
      {/* ========================================================================= */}
      <section id="alur-kerja" className="py-20 bg-white border-y border-[#F3D9CE]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold uppercase tracking-wider">
              Mekanisme Kerja
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Alur Deteksi &amp; Intervensi Manusia
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Dari penyerapan catatan transaksi hingga keputusan verifikasi tanpa ada aksi atau sanksi sepihak otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              {
                step: '01',
                title: 'Sumber Catatan',
                desc: 'Unggah CSV buku kas KSP, kasir POS, atau mutasi QRIS. Data ID otomatis dipseudonimkan.',
                icon: 'dataset',
              },
              {
                step: '02',
                title: 'Skor Akun',
                desc: 'Uji distribusi digit Benford dan Chi-Square untuk mendeteksi ketidakwajaran pembukuan.',
                icon: 'analytics',
              },
              {
                step: '03',
                title: 'Skor Transaksi',
                desc: 'Evaluasi 50:50 aturan red-flag & Isolation Forest menghasilkan indikator risiko berbobot.',
                icon: 'bubble_chart',
              },
              {
                step: '04',
                title: 'Tinjauan Manusia',
                desc: 'Pengawas/Pemilik menelaah faktor pemicu, riwayat, dan memutuskan: Wajar / Dokumen / Lanjut.',
                icon: 'fact_check',
              },
              {
                step: '05',
                title: 'Laporan Agregat',
                desc: 'Rekapitulasi pola pengendalian internal bahan RAT koperasi atau ringkasan arus kas UMKM.',
                icon: 'query_stats',
              },
            ].map((st, i) => (
              <div
                key={i}
                className="glass-panel rounded-3xl p-5 border border-[#F3D9CE] flex flex-col justify-between hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono-tabular font-extrabold text-sm text-[#009770] px-2.5 py-1 rounded-xl bg-[#E0F4EE]">
                      Langkah {st.step}
                    </span>
                    <span className="material-symbols-outlined text-[24px] text-[#009770]">
                      {st.icon}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-[#0A2A22] mb-1.5">
                    {st.title}
                  </h4>
                  <p className="text-xs text-[#6B5A55] leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION "ARSITEKTUR SISTEM"                                            */}
      {/* ========================================================================= */}
      <section id="arsitektur-sistem" className="py-20 bg-gradient-to-b from-[#FFF8F4] to-[#FFE9DF]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold uppercase tracking-wider">
              Arsitektur Terbuka
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Arsitektur Sistem SADAR
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Arsitektur modular berbasis Explainable AI: seluruh pemrosesan berjalan di browser tanpa menyimpan data sensitif di server luar.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-[#F3D9CE] shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs font-mono-tabular">
              <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE] space-y-2">
                <span className="font-bold text-[#009770] block">1. Lapis Ingesti &amp; Privasi</span>
                <p className="text-gray-600">
                  Pseudonimisasi deterministik ID (contoh: ANG-7F3A), minimisasi data, dan pemetaan kontrol kepatuhan UU PDP No. 27/2022.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE] space-y-2">
                <span className="font-bold text-[#009770] block">2. Lapis Analisis Dual-Core</span>
                <p className="text-gray-600">
                  Uji digit pertama Benford (MAD &amp; Chi-Square) untuk tingkat akun, dipadu Isolation Forest &amp; Aturan Red-Flag untuk transaksi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE] space-y-2">
                <span className="font-bold text-[#009770] block">3. Lapis Tinjauan &amp; XAI</span>
                <p className="text-gray-600">
                  Atribusi faktor pemicu (selisih terhadap median), tingkat prioritas, baris keterbatasan data, serta hak koreksi berjejak.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE] space-y-2">
                <span className="font-bold text-[#009770] block">4. Lapis Akuntabilitas</span>
                <p className="text-gray-600">
                  Laporan agregat tanpa nama orang nyata untuk bahan RAT koperasi, ringkasan arus kas berizin untuk UMKM, dan Lab Validasi data sintetis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-[#F3D9CE] pt-14 pb-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#F3D9CE]">
            {/* Brand Col */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <SadarLogo size="sm" animated={false} />
                <SadarText variant="light" className="text-2xl font-black" />
              </div>
              <p className="text-xs text-[#6B5A55] max-w-sm leading-relaxed">
                Sistem Analitik Deteksi Anomali dan Risiko Keuangan Berbasis Explainable AI. Pengendalian internal koperasi dan UMKM yang dapat dijelaskan.
              </p>
              <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] text-[11px] text-[#6B5A55] leading-relaxed">
                <strong className="text-[#0A2A22] block mb-0.5">Pernyataan Posisi Sistem:</strong>
                <SadarText variant="light" className="text-[11px] font-bold mr-1 inline-flex" /> adalah alat bantu pengendalian internal: bukan alat penindakan dan bukan pengganti auditor.
              </div>
            </div>

            {/* Links Col */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A2A22] flex items-center gap-1.5">
                <span>Modul Dasbor</span>
                <SadarText variant="light" className="text-xs font-black" />
                <span>(6 Modul):</span>
              </h4>
              <ul className="space-y-2 text-xs font-mono-tabular">
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('pemantauan')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">radar</span>
                    1. Pemantauan Langsung (Indikator Risiko)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('kesehatan')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">account_balance</span>
                    2. Kesehatan Akun (Uji Benford &amp; Chi-Square)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('antrean')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">fact_check</span>
                    3. Antrean Tinjauan (Human-in-the-Loop)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('sumber_data')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">security</span>
                    4. Sumber Data dan Privasi (UU 27/2022)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('laporan')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">query_stats</span>
                    5. Laporan Agregat (Bahan RAT &amp; Arus Kas)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('lab')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">science</span>
                    6. Lab Validasi (Ablasi Data Sintetis)
                  </button>
                </li>
              </ul>
            </div>

            {/* Competition Notice */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A2A22]">
                Catatan Prototipe
              </h4>
              <p className="text-xs text-[#6B5A55] leading-relaxed">
                Prototipe untuk <strong>Indonesia Accounting Challenge 2026</strong>. Data sintetis. Seluruh algoritma berjalan lokal di browser.
              </p>
              <div className="p-3 bg-[#E0F4EE] rounded-xl border border-[#009770]/30 text-[11px] font-mono-tabular text-[#009770]">
                Mode: Koperasi &amp; UMKM (Dua Segmen, Satu Mesin)
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono-tabular text-[#6B5A55] gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#009770] radar-pulse-green" />
              <span className="inline-flex items-center gap-1.5">
                <SadarText variant="light" className="text-xs font-black" />
                <span>v2.0 · Sistem Analitik Deteksi Anomali &amp; Risiko Keuangan</span>
              </span>
            </div>
            <div>
              Prototipe untuk Indonesia Accounting Challenge 2026. Data sintetis.
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Fullscreen Demo Modal */}
      <InteractiveDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onEnterFullDashboard={() => {
          setIsDemoModalOpen(false);
          handleLaunchDashboard('pemantauan');
        }}
        transactions={transactions}
      />

      {/* AI Machine Bootup Modal */}
      {isAiBooting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#01140F]/85 backdrop-blur-xl animate-fadeIn">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,179,134,0.18)_0%,transparent_75%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,151,112,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,151,112,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#84F8CA] to-transparent shadow-[0_0_15px_#84F8CA] animate-[scanLaser_1.6s_ease-in-out_infinite] pointer-events-none" />

          <div className="max-w-md w-full mx-4 p-8 rounded-3xl bg-[#031B15]/95 border-2 border-[#00B386]/60 shadow-[0_0_50px_rgba(0,179,134,0.45)] text-white relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-full flex justify-between items-center text-[10px] font-mono-tabular text-[#84F8CA]/70 mb-4 pb-2 border-b border-[#00B386]/20">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00B386] animate-ping" />
                <span>SADAR_XAI_ENGINE // RUNNING</span>
              </span>
              <span>NODE: IAC-2026-ID</span>
            </div>

            <div className="relative w-28 h-28 my-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#84F8CA]/40 animate-[spin_8s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-t-2 border-r-2 border-transparent border-t-[#FFF637] border-r-[#00B386] animate-[spin_3s_linear_infinite_reverse]" />
              <div className="relative z-10 p-2 rounded-2xl bg-[#00513B] border border-[#84F8CA] shadow-[0_0_20px_#00B386]">
                <SadarLogo size="md" animated={true} />
              </div>
            </div>

            <h3 className="font-display font-bold text-xl text-white tracking-wide mt-2 flex items-center justify-center gap-2">
              <span>SISTEM ANALITIK</span>
              <SadarText variant="dark" className="text-xl font-black" />
            </h3>
            <p className="text-xs font-mono-tabular text-[#84F8CA] mt-1">
              {bootMessages[bootStep]}
            </p>

            <div className="w-full mt-6 mb-2">
              <div className="flex justify-between items-center text-xs font-mono-tabular text-[#84F8CA] mb-1.5">
                <span>KALIBRASI DASBOR</span>
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

            <div className="w-full grid grid-cols-2 gap-2 mt-3 text-[10px] font-mono-tabular text-left text-gray-300">
              <div className="p-2 rounded-lg bg-[#01251C]/80 border border-[#00B386]/30 flex items-center gap-1.5">
                <span className="text-[#84F8CA]">✓</span>
                <span>Benford &amp; Chi-Square</span>
              </div>
              <div className="p-2 rounded-lg bg-[#01251C]/80 border border-[#00B386]/30 flex items-center gap-1.5">
                <span className="text-[#84F8CA]">✓</span>
                <span>Isolation Forest TypeScript</span>
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
