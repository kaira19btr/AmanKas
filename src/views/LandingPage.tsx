/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AmanKasLogo } from '../components/AmanKasLogo';
import { InteractiveDemoModal } from '../components/InteractiveDemoModal';
import { Transaction } from '../types';
import { ActiveTab } from '../components/Sidebar';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';

interface LandingPageProps {
  onEnterDashboard: (targetTab?: ActiveTab) => void;
  onNavigateToLogin: () => void;
  transactions: Transaction[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  onNavigateToLogin,
  transactions,
}) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // AI Machine Boot Sequence state when entering dashboard from landing page
  const [isAiBooting, setIsAiBooting] = useState<boolean>(false);
  const [bootStep, setBootStep] = useState<number>(0);
  const [bootProgress, setBootProgress] = useState<number>(0);

  // Live ticking values for the right hero card to feel alive!
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
    'Menginisialisasi Kernel AI AmanKas Neural Engine...',
    'Memuat Model Isolation Forest (35 Pohon Anomali)...',
    'Sinkronisasi Vektor Uji Nigrini (Benford MAD Multi-Akun)...',
    'Otentikasi Kredensial & Enkripsi Kunci Sesi AES-256...',
    'Akses Diberikan: Membuka Pusat Kendali Dasbor!',
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
      {/* 1. STICKY TOPBAR HEADER                                                   */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F3D9CE] shadow-xs">
        <div className="max-w-[1400px] mx-auto px-6 h-18 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <AmanKasLogo size="md" animated={true} />

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-[#0A2A22] tracking-tight leading-none">
                  AmanKas
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[9px] font-bold border border-[#009770]/30 uppercase tracking-wider">
                  Deteksi Dini Fraud
                </span>
              </div>
              <span className="font-mono-tabular text-[10px] text-[#6B5A55] tracking-wide mt-0.5">
                Pemantauan Pembukuan Koperasi &amp; UMKM
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#6B5A55]">
            <button
              onClick={() => scrollToSection('fitur-utama')}
              className="hover:text-[#009770] transition-colors cursor-pointer py-1"
            >
              Fitur Utama
            </button>
            <button
              onClick={() => scrollToSection('data-masalah')}
              className="hover:text-[#009770] transition-colors cursor-pointer py-1"
            >
              Data Masalah
            </button>
            <button
              onClick={() => scrollToSection('alur-kerja')}
              className="hover:text-[#009770] transition-colors cursor-pointer py-1"
            >
              Alur Kerja
            </button>
            <button
              onClick={() => scrollToSection('arsitektur-sistem')}
              className="hover:text-[#009770] transition-colors cursor-pointer py-1 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#009770]">account_tree</span>
              <span>Arsitektur Sistem</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Demo Interaktif Button */}
            <button
              onClick={() => {
                soundEngine.playClick(950);
                setIsDemoModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0A2A22] to-[#17362D] hover:bg-[#0A2A22] text-white text-xs font-mono-tabular font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-sm text-[#FFF637] group-hover:rotate-12 transition-transform">
                fullscreen
              </span>
              <span>Demo Interaktif</span>
            </button>

            {/* Masuk Akun */}
            <button
              onClick={() => {
                soundEngine.playClick(850);
                onNavigateToLogin();
              }}
              className="px-3.5 py-2 rounded-xl border border-[#F3D9CE] hover:bg-[#FFF8F4] text-xs font-mono-tabular font-semibold text-[#0A2A22] transition-colors cursor-pointer"
            >
              Masuk Akun
            </button>

            {/* Akses Dasbor (Primary CTA) */}
            <button
              onClick={() => handleLaunchDashboard('pemantauan')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#009770] to-[#00B386] hover:brightness-105 text-white font-display text-xs font-bold shadow-md shadow-[#009770]/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-sm">lock_open</span>
              <span>Akses Dasbor</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => handleLaunchDashboard('pemantauan')}
              className="px-3 py-1.5 rounded-lg bg-[#009770] text-white text-xs font-bold"
            >
              Dasbor
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-[#F3D9CE] text-[#0A2A22]"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#F3D9CE] bg-white px-6 py-4 space-y-3 font-mono-tabular text-xs">
            <button
              onClick={() => scrollToSection('fitur-utama')}
              className="block w-full text-left py-1 text-[#6B5A55]"
            >
              Fitur Utama
            </button>
            <button
              onClick={() => scrollToSection('data-masalah')}
              className="block w-full text-left py-1 text-[#6B5A55]"
            >
              Data Masalah
            </button>
            <button
              onClick={() => scrollToSection('alur-kerja')}
              className="block w-full text-left py-1 text-[#6B5A55]"
            >
              Alur Kerja
            </button>
            <button
              onClick={() => scrollToSection('arsitektur-sistem')}
              className="block w-full text-left py-1 text-[#6B5A55]"
            >
              Arsitektur Sistem
            </button>
            <div className="pt-2 border-t border-[#F3D9CE] flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsDemoModalOpen(true);
                }}
                className="flex-1 py-2 bg-[#0A2A22] text-white rounded-lg text-center font-semibold"
              >
                Demo Interaktif
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="flex-1 py-2 border border-[#F3D9CE] rounded-lg text-center font-semibold"
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
        {/* Two Soft Glow Spheres in background (Jade & Vanilla) */}
        <div className="absolute top-12 left-10 w-[500px] h-[500px] rounded-full bg-[#009770]/18 blur-[110px] pointer-events-none" />
        <div className="absolute top-28 right-16 w-[450px] h-[450px] rounded-full bg-[#FFF637]/22 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#FFB89F_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column (7 cols): Headlines & Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#F3D9CE] shadow-xs text-xs font-mono-tabular font-medium text-[#0A2A22]">
                <span className="w-2 h-2 rounded-full bg-[#009770] radar-pulse-green" />
                <span>Platform Deteksi Dini Fraud Koperasi &amp; UMKM Indonesia</span>
              </div>

              {/* Massive 3-Line Headline with Stabilo Vanilla Highlighter */}
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#0A2A22] tracking-tight leading-[1.12]">
                Deteksi Dini <br />
                {/* Keyword with Jade text on Vanilla Highlighter background (Like text-marker) */}
                <span className="relative inline-block my-1 px-3.5 py-1 rounded-2xl bg-[#FFF637] text-[#009770] shadow-sm transform -rotate-1 border border-[#EEDC9A]/80">
                  Kecurangan Keuangan
                </span>{' '}
                <br />
                Koperasi &amp; UMKM
              </h1>

              {/* Explanatory Paragraph */}
              <p className="text-base sm:text-lg text-[#6B5A55] max-w-2xl leading-relaxed font-body-md">
                Pemantauan transaksi berkelanjutan dengan uji <strong>Benford's Law</strong> dan deteksi anomali <strong>Isolation Forest</strong>, memberi peringatan dini ke pengurus, sementara keputusan akhir tetap di tangan manusia.
              </p>

              {/* Two CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {/* Primary Button */}
                <button
                  onClick={() => handleLaunchDashboard('pemantauan')}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#009770] via-[#008562] to-[#00B386] hover:brightness-105 text-white font-display text-base font-bold shadow-lg shadow-[#009770]/30 flex items-center gap-2.5 transition-all cursor-pointer active:scale-98"
                >
                  <span className="material-symbols-outlined text-lg">lock_open</span>
                  <span>Buka Dasbor Pemantauan</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>

                {/* Secondary Outline Button */}
                <button
                  onClick={() => scrollToSection('arsitektur-sistem')}
                  className="px-5 py-3.5 rounded-2xl border-2 border-[#009770] bg-white/80 hover:bg-[#E0F4EE] text-[#009770] font-display text-sm font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">account_tree</span>
                  <span>Diagram Arsitektur</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex items-center gap-6 text-xs font-mono-tabular text-[#6B5A55]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#009770]">verified</span>
                  <span>Kepatuhan UU PDP No. 27/2022</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#009770]">security</span>
                  <span>Standar Forensik Kemenkop-UKM</span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Glass Card "Pusat Kendali AmanKas" */}
            <div className="lg:col-span-5">
              <div className="glass-panel-elevated rounded-3xl p-6 sm:p-7 border border-[#F3D9CE] shadow-2xl relative overflow-hidden bg-white/95 backdrop-blur-xl">
                {/* Header of Control Center Card */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F3D9CE]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#E0F4EE] border border-[#009770]/30 flex items-center justify-center text-[#009770] shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">radar</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-[#0A2A22]">
                          Pusat Kendali AmanKas
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009770] radar-pulse-green" />
                          LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B5A55] mt-0.5">
                        Portal Telemetri Integritas Pembukuan KSP
                      </p>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-full bg-[#FFF8F4] border border-[#F3D9CE] text-[10px] font-mono-tabular text-[#009770] font-semibold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#009770] radar-pulse-green" />
                    <span>24/7 Terkoneksi</span>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="py-3 text-[10px] font-mono-tabular uppercase tracking-wider text-[#6B5A55] font-bold">
                  STATUS 3 LAPIS PERLINDUNGAN (REAL-TIME):
                </div>

                {/* 3 Status Rows */}
                <div className="space-y-3">
                  {/* Row 1: SKOR AKUN (Benford's Law) */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between gap-3 hover:bg-[#F3FAF7] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                        <span className="material-symbols-outlined text-[20px]">account_balance</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-[#0A2A22]">
                            SKOR AKUN
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#009770] bg-[#E0F4EE] px-1.5 py-0.2 rounded font-semibold">
                            Benford's Law
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5A55] font-mono-tabular mt-0.5">
                          <AnimatedCounter value={14} /> akun dipantau • <AnimatedCounter value={11} /> sehat
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold border border-[#009770]/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#009770] animate-pulse" />
                      Terpantau
                    </span>
                  </div>

                  {/* Row 2: SKOR TRANSAKSI (Isolation Forest + Red-Flag) */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between gap-3 hover:bg-[#F3FAF7] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF637]/30 flex items-center justify-center text-[#6B5F00]">
                        <span className="material-symbols-outlined text-[20px]">bubble_chart</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-[#0A2A22]">
                            SKOR TRANSAKSI
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#6B5F00] bg-[#FFF637]/40 px-1.5 py-0.2 rounded font-semibold">
                            Isolation Forest + Red-Flag
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5A55] font-mono-tabular mt-0.5">
                          <span className={pulseTick ? 'text-[#009770] font-bold' : ''}>
                            <AnimatedCounter value={liveTrxCount} />
                          </span>{' '}
                          transaksi hari ini •{' '}
                          <span className="text-[#6B5F00] font-bold">
                            <AnimatedCounter value={liveReviewCount} />
                          </span>{' '}
                          perlu ditinjau
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#FFF637] text-[#6B5F00] font-mono-tabular text-[10px] font-bold border border-[#6B5F00]/25 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                      Real-time
                    </span>
                  </div>

                  {/* Row 3: KEPUTUSAN MANUSIA (Human-in-the-loop) */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between gap-3 hover:bg-[#F3FAF7] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FDE8E8] flex items-center justify-center text-[#CE2F2E]">
                        <span className="material-symbols-outlined text-[20px]">gavel</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-xs text-[#0A2A22]">
                            KEPUTUSAN MANUSIA
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#CE2F2E] bg-[#FDE8E8] px-1.5 py-0.2 rounded font-semibold">
                            Human-in-the-loop
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5A55] font-mono-tabular mt-0.5">
                          <AnimatedCounter value={3} /> menunggu pengurus • tanpa aksi otomatis
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#FDE8E8] text-[#CE2F2E] font-mono-tabular text-[10px] font-bold border border-[#CE2F2E]/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />
                      Menunggu
                    </span>
                  </div>
                </div>

                {/* Wide CTA Button */}
                <div className="mt-5 pt-4 border-t border-[#F3D9CE]">
                  <button
                    onClick={() => handleLaunchDashboard('pemantauan')}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#009770] to-[#00B386] hover:brightness-105 text-white font-display text-sm font-bold shadow-md shadow-[#009770]/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    <span>Masuk ke Dasbor Pemantauan</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  <p className="text-center font-mono-tabular text-[10px] text-[#6B5A55] mt-2">
                    Data simulasi untuk demonstrasi · KSP Mitra Sejahtera
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION "FITUR UTAMA"                                                  */}
      {/* ========================================================================= */}
      <section id="fitur-utama" className="py-20 bg-white border-y border-[#F3D9CE]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold uppercase tracking-wider">
              Kapabilitas Inti
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Empat Pilar Perlindungan AmanKas
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Dirancang khusus untuk ekosistem koperasi simpan pinjam Indonesia tanpa kerumitan instalasi server lokal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Skor Akun (Benford) */}
            <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[26px]">account_balance</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#0A2A22] mb-2">
                  Skor Akun Benford's Law
                </h3>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Menguji frekuensi kemunculan digit pertama pada setiap buku kas terhadap kurva logaritmik alami. Menghitung deviasi MAD Nigrini untuk mengungkap pola manipulasi tersembunyi.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#F3D9CE] flex items-center justify-between text-[11px] font-mono-tabular text-[#009770] font-semibold">
                <span>Ambang Nigrini MAD</span>
                <span className="material-symbols-outlined text-sm">trending_up</span>
              </div>
            </div>

            {/* Card 2: Skor Transaksi (Isolation Forest) */}
            <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF637]/35 text-[#6B5F00] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[26px]">bubble_chart</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#0A2A22] mb-2">
                  Skor Transaksi Real-Time
                </h3>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Model hybrid machine learning (60% Isolation Forest multi-pohon acak + 40% aturan red-flag statis) yang mengevaluasi nominal, jam kerja, selisih rata-rata, dan pola pemecahan smurfing.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#F3D9CE] flex items-center justify-between text-[11px] font-mono-tabular text-[#6B5F00] font-semibold">
                <span>Skor 0–100 Hibrida</span>
                <span className="material-symbols-outlined text-sm">speed</span>
              </div>
            </div>

            {/* Card 3: Notifikasi Instan & Antrean */}
            <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FDE8E8] text-[#CE2F2E] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[26px]">notification_important</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#0A2A22] mb-2">
                  Antrean Tinjauan Pengurus
                </h3>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Semua transaksi berisiko tinggi diarahkan ke antrean peninjau pengurus (Human-in-the-Loop). Menandai 'Ternyata Wajar' secara otomatis melatih dan menyesuaikan sensitivitas sistem.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#F3D9CE] flex items-center justify-between text-[11px] font-mono-tabular text-[#CE2F2E] font-semibold">
                <span>Tanpa Pembekuan Otomatis</span>
                <span className="material-symbols-outlined text-sm">gavel</span>
              </div>
            </div>

            {/* Card 4: Privasi & Jejak Audit */}
            <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[26px]">enhanced_encryption</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#0A2A22] mb-2">
                  Privasi &amp; Jejak Audit Abadi
                </h3>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Penyamaran deterministik Nama &amp; NIK sesuai UU PDP No. 27/2022. Pembukaan data asli memerlukan verifikasi PIN otoritas dan dicatat permanen dalam ledger audit terenkripsi SHA-256.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#F3D9CE] flex items-center justify-between text-[11px] font-mono-tabular text-[#009770] font-semibold">
                <span>Kepatuhan UU PDP 5/5</span>
                <span className="material-symbols-outlined text-sm">lock</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION "DATA MASALAH" (STATISTIK DENGAN SUMBER RESMI)                 */}
      {/* ========================================================================= */}
      <section id="data-masalah" className="py-20 bg-gradient-to-b from-[#FFF8F4] to-[#FFE9DF]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#FFDBCF] text-[#86513D] font-mono-tabular text-xs font-bold uppercase tracking-wider">
              Urgensi &amp; Fakta Empiris
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Mengapa Koperasi Rentan Terhadap Fraud?
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Sektor koperasi mengelola ratusan triliun simpanan masyarakat, namun memiliki celah pengawasan audit berkala yang panjang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat 1: Rp26 T */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#CE2F2E] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-3xl sm:text-4xl text-[#CE2F2E] tracking-tight block">
                  <AnimatedCounter value={26} prefix="Rp " suffix=" Triliun" />
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Kerugian Anggota Bermasalah
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Total kerugian dana simpanan anggota dari 8 koperasi simpan pinjam bermasalah di Indonesia yang mengalami gagal bayar.
                </p>
                {/* Moving indicator bar */}
                <div className="w-full h-1.5 bg-[#FDE8E8] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#CE2F2E] rounded-full w-4/5 animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#86513D]">
                Sumber: Kementerian Koperasi &amp; UKM (via Antara)
              </div>
            </div>

            {/* Stat 2: $200 ribu vs $104 ribu */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#009770] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-2xl sm:text-3xl text-[#009770] tracking-tight block">
                  <AnimatedCounter value={200} prefix="$" suffix=" rb" /> vs <AnimatedCounter value={104} prefix="$" suffix=" rb" />
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Median Kerugian Lembaga Kecil
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Median kerugian kecurangan pada organisasi skala kecil (koperasi/UMKM) hampir 2x lipat lebih besar dibanding korporasi raksasa karena minim kontrol internal otomatis.
                </p>
                {/* Comparative bar */}
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-[10px] font-mono-tabular text-[#6B5A55]">
                    <span>UMKM/KSP</span>
                    <span className="font-bold text-[#009770]">192%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E0F4EE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#009770] rounded-full w-[92%] animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#6B5A55]">
                Sumber: ACFE Report to the Nations (2018)
              </div>
            </div>

            {/* Stat 3: 14 bulan */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#6B5F00] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-3xl sm:text-4xl text-[#6B5F00] tracking-tight block">
                  <AnimatedCounter value={14} suffix=" Bulan" />
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Durasi Fraud Sebelum Terdeteksi
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Rata-rata tindak penyelewengan kas berjalan lebih dari satu tahun sebelum terbongkar dalam sidang tutup buku atau audit tahunan RAT.
                </p>
                {/* Timeline visual animation */}
                <div className="w-full h-1.5 bg-[#FFF637]/30 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#8C7D00] rounded-full w-3/4 animate-[shimmer_3s_infinite]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#6B5A55]">
                Sumber: ACFE Global Fraud Study (2020)
              </div>
            </div>

            {/* Stat 4: Belum dijamin */}
            <div className="glass-panel rounded-3xl p-6 border-t-4 border-t-[#86513D] flex flex-col justify-between hover:-translate-y-1 transition-all">
              <div>
                <span className="font-display font-black text-2xl sm:text-3xl text-[#86513D] tracking-tight block">
                  <AnimatedCounter value={0} suffix=" Penjamin LPS" />
                </span>
                <h4 className="font-display font-bold text-sm text-[#0A2A22] mt-2 mb-1">
                  Tanpa Perlindungan LPS
                </h4>
                <p className="text-xs text-[#6B5A55] leading-relaxed">
                  Simpanan koperasi simpan pinjam belum dijamin oleh Lembaga Penjamin Simpanan (LPS). Skema penjaminan khusus baru mulai dibahas pemerintah.
                </p>
                {/* Warning pulse bar */}
                <div className="w-full h-1.5 bg-[#FFDBCF] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#86513D] rounded-full w-full opacity-60" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3D9CE] font-mono-tabular text-[10px] text-[#86513D]">
                Sumber: Kemenkop-UKM &amp; OJK (Okt 2026)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION "ALUR KERJA" (TIMELINE 5 LANGKAH HORIZONTAL)                   */}
      {/* ========================================================================= */}
      <section id="alur-kerja" className="py-20 bg-white border-y border-[#F3D9CE]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold uppercase tracking-wider">
              Mekanisme Kerja
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Alur Deteksi &amp; Intervensi 5 Langkah
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Dari transaksi mentah hingga keputusan terotorisasi tanpa celah intervensi sepihak.
            </p>
          </div>

          {/* Horizontal Steps Container */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              {
                step: '01',
                title: 'Sumber Data',
                desc: 'Integrasi otomatis API Core ERP, POS Kasir, QRIS SNAP, atau unggah rekening koran CSV/XLSX.',
                icon: 'dataset',
                color: 'text-[#009770]',
                bg: 'bg-[#E0F4EE]',
              },
              {
                step: '02',
                title: 'Skor Akun',
                desc: 'Analisis Benford Law per buku kas untuk menghitung deviasi MAD Nigrini secara periodik.',
                icon: 'analytics',
                color: 'text-[#009770]',
                bg: 'bg-[#E0F4EE]',
              },
              {
                step: '03',
                title: 'Skor Transaksi',
                desc: 'Evaluasi hibrida 60% Isolation Forest + 40% aturan red-flag (jam malam, smurfing, nominal bulat).',
                icon: 'filter_alt',
                color: 'text-[#6B5F00]',
                bg: 'bg-[#FFF637]/35',
              },
              {
                step: '04',
                title: 'Notifikasi Instan',
                desc: 'Peringatan visual seketika pada dasbor pengurus jika skor melampaui ambang kewaspadaan.',
                icon: 'crisis_alert',
                color: 'text-[#CE2F2E]',
                bg: 'bg-[#FDE8E8]',
              },
              {
                step: '05',
                title: 'Keputusan Pengurus',
                desc: 'Verifikator memilih tindak lanjut atau wajar. Pilihan wajar melatih adaptasi sensitivitas model.',
                icon: 'how_to_reg',
                color: 'text-[#009770]',
                bg: 'bg-[#E0F4EE]',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="glass-panel rounded-3xl p-5 flex flex-col justify-between relative group hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono-tabular font-bold text-xs text-[#86513D] px-2 py-0.5 rounded-md bg-[#FFF8F4] border border-[#F3D9CE]">
                      LANGKAH {item.step}
                    </span>
                    <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-sm text-[#0A2A22] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#6B5A55] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION "ARSITEKTUR SISTEM" (DIAGRAM KOTAK & PANAH SVG)               */}
      {/* ========================================================================= */}
      <section id="arsitektur-sistem" className="py-20 bg-gradient-to-b from-[#FFF8F4] to-[#FFE9DF]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-max mx-auto">
              <span className="material-symbols-outlined text-sm">account_tree</span>
              Diagram Topologi
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#0A2A22]">
              Arsitektur Sistem AmanKas
            </h2>
            <p className="text-sm text-[#6B5A55]">
              Arsitektur pipeline data terenkripsi lokal dengan pemisahan tegas antara mesin analitik dan hak eksekusi pengurus.
            </p>
          </div>

          {/* SVG Diagram Canvas Box */}
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-[#F3D9CE] bg-white shadow-xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[860px]">
                {/* 4-Layer Architectural Visual Representation */}
                <div className="grid grid-cols-4 gap-6 items-stretch">
                  {/* Layer 1: Data Ingestion */}
                  <div className="p-5 rounded-2xl bg-[#FFF8F4] border-2 border-dashed border-[#F3D9CE] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono-tabular uppercase font-bold text-[#86513D] block mb-2">
                        1. INGESTI TRANSAKSI
                      </span>
                      <h4 className="font-display font-bold text-sm text-[#0A2A22] mb-3">
                        Sumber Data
                      </h4>
                      <div className="space-y-2 text-xs font-mono-tabular">
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • Core ERP Koperasi
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • Webhook POS Kasir
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • QRIS Dompet SNAP
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • Impor CSV / Excel
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#F3D9CE] text-[10px] font-mono-tabular text-[#009770]">
                      SSL/TLS &amp; Pseudonimisasi
                    </div>
                  </div>

                  {/* Layer 2: Two-Tier Analytics Engine */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#E0F4EE]/50 to-white border-2 border-[#009770] flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-mono-tabular uppercase font-bold text-[#009770] block mb-2">
                        2. MESIN ANALISIS DUA LAPIS
                      </span>
                      <h4 className="font-display font-bold text-sm text-[#0A2A22] mb-3">
                        Algoritma Deteksi
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-[#009770]/30">
                          <span className="font-bold text-[#009770] block">Lapis 1: Benford's Law</span>
                          <span className="text-[10px] text-[#6B5A55]">
                            MAD Nigrini &le; 0.012 (Kesehatan Akun)
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-[#009770]/30">
                          <span className="font-bold text-[#009770] block">Lapis 2: Hybrid Scoring</span>
                          <span className="text-[10px] text-[#6B5A55]">
                            60% iForest ML + 40% Red-Flags
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#009770]/30 text-[10px] font-mono-tabular text-[#009770] font-semibold">
                      Ambang Otomatis Sensitif
                    </div>
                  </div>

                  {/* Layer 3: Human Verification Queue */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#FFFDE6]/60 to-white border-2 border-[#FFF637] flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-mono-tabular uppercase font-bold text-[#6B5F00] block mb-2">
                        3. KENDALI MANUSIA
                      </span>
                      <h4 className="font-display font-bold text-sm text-[#0A2A22] mb-3">
                        Antrean Verifikasi
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="p-2 bg-white rounded-xl border border-[#EEDC9A]">
                          <span className="font-semibold text-[#0A2A22] block">Tinjauan Pengurus</span>
                          <span className="text-[10px] text-[#6B5A55]">Otoritas Bendahara / Pengawas</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#EEDC9A]">
                          <span className="font-semibold text-[#0A2A22] block">Tiga Tombol Putusan</span>
                          <span className="text-[10px] text-[#6B5A55]">Tindak • Wajar • Minta Dokumen</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#EEDC9A]">
                          <span className="font-semibold text-[#009770] block">Feedback Loop</span>
                          <span className="text-[10px] text-[#6B5A55]">Pilihan wajar menurunkan skor</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#EEDC9A] text-[10px] font-mono-tabular text-[#6B5F00] font-semibold">
                      Human-in-the-Loop Mandate
                    </div>
                  </div>

                  {/* Layer 4: Compliance Outputs */}
                  <div className="p-5 rounded-2xl bg-[#FFF8F4] border-2 border-[#F3D9CE] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono-tabular uppercase font-bold text-[#86513D] block mb-2">
                        4. AKUNTABILITAS &amp; RAT
                      </span>
                      <h4 className="font-display font-bold text-sm text-[#0A2A22] mb-3">
                        Luaran Audit
                      </h4>
                      <div className="space-y-2 text-xs font-mono-tabular">
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • Laporan Integritas RAT
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • Lembar Pengesahan Kas
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • Jejak Audit SHA-256
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-[#F3D9CE]">
                          • Cetak Berkas PDF Resmi
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#F3D9CE] text-[10px] font-mono-tabular text-[#009770]">
                      Siap Sidang Kemenkop-UKM
                    </div>
                  </div>
                </div>
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
            {/* Brand Col (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <AmanKasLogo size="sm" animated={false} />
                <span className="font-display font-bold text-lg text-[#0A2A22]">AmanKas</span>
              </div>
              <p className="text-xs text-[#6B5A55] max-w-sm leading-relaxed">
                Platform deteksi dini kecurangan keuangan (*fraud*) untuk koperasi simpan pinjam dan UMKM Indonesia. Memperkuat kepercayaan anggota melalui transparansi berbasis data ilmiah.
              </p>
              <div className="flex items-center gap-3 text-xs font-mono-tabular text-[#009770]">
                <span>✓ Protokol ISO 27001</span>
                <span>•</span>
                <span>✓ UU PDP No. 27/2022</span>
              </div>
            </div>

            {/* Dashboard 5 Pages Links Col (4 cols) */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A2A22]">
                Tautan Modul Dasbor (5 Layar):
              </h4>
              <ul className="space-y-2 text-xs font-mono-tabular">
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('pemantauan')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">radar</span>
                    1. Pemantauan Langsung (Live Telemetri)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('kesehatan')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">account_balance</span>
                    2. Kesehatan Akun (Benford's Law)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('antrean')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    3. Antrean Tinjauan (Human-in-the-Loop)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('sumber_data')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    4. Sumber Data dan Privasi (Unggah CSV/XLSX)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLaunchDashboard('laporan')}
                    className="text-[#6B5A55] hover:text-[#009770] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">assessment</span>
                    5. Laporan Integritas (Siap Cetak RAT)
                  </button>
                </li>
              </ul>
            </div>

            {/* Accreditation / Institutional Notice (3 cols) */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A2A22]">
                Catatan Kompetisi
              </h4>
              <p className="text-xs text-[#6B5A55] leading-relaxed">
                Prototipe untuk <strong>Indonesia Accounting Challenge 2026</strong>. Data simulasi. Seluruh algoritma berjalan lokal di browser.
              </p>
              <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] text-[11px] font-mono-tabular text-[#86513D]">
                Entitas: KSP Mitra Sejahtera (Demo Environment)
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono-tabular text-[#6B5A55] gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#009770] radar-pulse-green" />
              <span>AmanKas v1.4 · Sistem Keamanan Koperasi</span>
            </div>
            <div>
              Prototipe untuk Indonesia Accounting Challenge 2026. Data simulasi.
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

      {/* ========================================================================= */}
      {/* FUTURISTIC AI MACHINE BOOTUP & SCAN HUD MODAL (Suara & Animasi Canggih)  */}
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
                <AmanKasLogo size="md" animated={true} />
              </div>
            </div>

            {/* Neural Matrix Status Title */}
            <h3 className="font-display font-bold text-xl text-white tracking-wide mt-2">
              OTENTIKASI AI AMANKAS
            </h3>
            <p className="text-xs font-mono-tabular text-[#84F8CA] mt-1">
              {bootMessages[bootStep]}
            </p>

            {/* Real-time Telemetry Percentage Counter */}
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
