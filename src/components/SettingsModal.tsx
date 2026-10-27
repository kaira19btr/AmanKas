/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RuleConfig, SystemWeights } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { SadarText } from './SadarText';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleConfig: RuleConfig;
  onUpdateRuleConfig: (config: RuleConfig) => void;
  systemWeights: SystemWeights;
  onUpdateSystemWeights: (weights: SystemWeights) => void;
  adaptiveThresholdEnabled: boolean;
  onToggleAdaptiveThreshold: (enabled: boolean) => void;
  minVolumeThreshold: number;
  onUpdateMinVolumeThreshold: (threshold: number) => void;
  actualP90?: number;
  actualP98?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  ruleConfig,
  onUpdateRuleConfig,
  systemWeights,
  onUpdateSystemWeights,
  adaptiveThresholdEnabled,
  onToggleAdaptiveThreshold,
  minVolumeThreshold,
  onUpdateMinVolumeThreshold,
  actualP90 = 42,
  actualP98 = 78,
}) => {
  if (!isOpen) return null;

  const handleRuleToggle = (ruleKey: keyof RuleConfig) => {
    soundEngine.playClick(650);
    onUpdateRuleConfig({
      ...ruleConfig,
      [ruleKey]: {
        ...ruleConfig[ruleKey],
        enabled: !ruleConfig[ruleKey].enabled,
      },
    });
  };

  const handleResetWeights = () => {
    soundEngine.playSuccess();
    onUpdateSystemWeights({
      ruleWeight: 50,
      anomalyWeight: 50,
      calibratedCount: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#F3D9CE] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F3D9CE] bg-gradient-to-r from-white to-[#FFF8F4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <h3 className="font-ui text-[17px] font-semibold text-[#0A2A22] flex items-center gap-1.5">
                <span>Pengaturan Mesin Analisis</span>
                <SadarText variant="light" className="text-base font-semibold" />
              </h3>
              <p className="font-ui text-xs text-[#6B5A55]">
                Konfigurasi aturan red-flag, kalibrasi bobot sinyal, dan parameter Benford
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFF8F4] hover:bg-[#FFE9DF] text-[#6B5A55] flex items-center justify-center text-sm font-semibold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-ui">
          {/* Section 1: System Weights Calibration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-ui text-[15px] font-semibold text-[#0A2A22]">
                  Bobot Skor Transaksi (Aturan vs Anomali)
                </h4>
                <p className="text-[#6B5A55] text-[11px]">
                  Mulai netral (50:50) dan terkalibrasi otomatis dari keputusan peninjau manusia
                </p>
              </div>
              <button
                onClick={handleResetWeights}
                className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[11px] font-semibold text-[#86513D] hover:bg-[#FFE9DF] cursor-pointer"
              >
                Reset 50:50
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>
                  Sinyal Aturan: <strong className="font-semibold">{systemWeights.ruleWeight}%</strong>
                </span>
                <span>
                  Model Anomali (Isolation Forest): <strong className="font-semibold">{systemWeights.anomalyWeight}%</strong>
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={systemWeights.ruleWeight}
                onChange={(e) => {
                  const rw = Number(e.target.value);
                  onUpdateSystemWeights({
                    ...systemWeights,
                    ruleWeight: rw,
                    anomalyWeight: 100 - rw,
                  });
                }}
                className="w-full accent-[#009770] cursor-pointer"
              />
              <div className="text-[10px] text-[#6B5A55] flex justify-between font-mono">
                <span>Lebih bersandar pada Aturan Kepatuhan</span>
                <span>Terkalibrasi: {systemWeights.calibratedCount} kali</span>
                <span>Lebih bersandar pada Pencilan Multi-dimensi</span>
              </div>
            </div>
          </div>

          {/* Section 2: Ambang Persentil Historis P90 & P98 (Esai SADAR) */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-ui text-[15px] font-semibold text-[#0A2A22]">
                  Ambang Persentil Historis (P90 &amp; P98)
                </h4>
                <span className="text-[10px] font-mono font-medium uppercase tracking-[0.08em] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Dihitung Empiris
                </span>
              </div>
              <p className="text-[#6B5A55] text-[11px] leading-[1.6]">
                Label status risiko di seluruh sistem ditentukan oleh distribusi persentil Skor Transaksi historis dari dataset yang dimuat.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-tabular">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Hijau · Risiko rendah</span>
                </div>
                <div className="mt-2 text-xs text-emerald-800">
                  Skor &lt; P90 (&lt; <strong className="font-mono text-sm">{actualP90}</strong>)
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 font-ui">
                  Mayoritas peredaran normal
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>Kuning · Risiko sedang</span>
                </div>
                <div className="mt-2 text-xs text-amber-900">
                  &ge; P90 (<strong className="font-mono text-sm">{actualP90}</strong>) &ndash; &lt; P98
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 font-ui">
                  Batas tinjauan pengawas 48 jam
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>Merah · Risiko tinggi</span>
                </div>
                <div className="mt-2 text-xs text-rose-900">
                  &ge; P98 (&ge; <strong className="font-mono text-sm">{actualP98}</strong>)
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 font-ui">
                  Pemeriksaan Pengawas Senior
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Ambang Adaptif (HIPOTESIS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-ui text-[15px] font-semibold text-[#0A2A22] flex items-center gap-1.5">
                  <span>Ambang Adaptif Berdasarkan Status Akun</span>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-[0.08em] bg-[#FFE9DF] text-[#86513D] px-2 py-0.5 rounded">
                    HIPOTESIS
                  </span>
                </h4>
                <p className="text-[#6B5A55] text-[11px] leading-[1.6]">
                  Jika diaktifkan, akun berstatus Merah pada uji Benford akan otomatis menurunkan ambang batas peringatan pada akun itu.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adaptiveThresholdEnabled}
                  onChange={(e) => onToggleAdaptiveThreshold(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#009770]"></div>
              </label>
            </div>
          </div>

          {/* Section 3: Benford Minimum Volume Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-ui text-[15px] font-semibold text-[#0A2A22]">
                  Syarat Volume Minimum Benford
                </h4>
                <p className="text-[#6B5A55] text-[11px]">
                  Ambang batas jumlah baris transaksi agar akun dapat diuji digit pertamanya.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="1000"
                  step="50"
                  value={minVolumeThreshold}
                  onChange={(e) => onUpdateMinVolumeThreshold(Number(e.target.value) || 300)}
                  className="w-20 px-2 py-1 rounded-xl border border-[#F3D9CE] font-mono tabular-nums text-xs font-semibold text-center"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[11px] text-[#86513D]">
              <strong>Label Resmi:</strong> "asumsi, perlu diverifikasi pada literatur" (default 300 transaksi).
            </div>
          </div>

          {/* Section 4: Red Flag Rules Configuration */}
          <div className="space-y-3">
            <h4 className="font-ui text-[15px] font-semibold text-[#0A2A22]">
              Konfigurasi Aturan Red-Flag Terperinci
            </h4>
            <div className="space-y-2.5">
              {/* Rule 1: Duplicate */}
              <div className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0A2A22]">Duplikasi Transaksi Cepat</div>
                  <div className="text-[11px] text-[#6B5A55]">
                    Nominal sama dalam rentang {ruleConfig.duplicateTransactions.maxHours} jam
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={ruleConfig.duplicateTransactions.enabled}
                  onChange={() => handleRuleToggle('duplicateTransactions')}
                  className="accent-[#009770] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Rule 2: Off-hours */}
              <div className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0A2A22]">Transaksi di Luar Jam Operasional</div>
                  <div className="text-[11px] text-[#6B5A55]">
                    Di luar pukul 08:00 - 17:00 WIB
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={ruleConfig.offHoursTransactions.enabled}
                  onChange={() => handleRuleToggle('offHoursTransactions')}
                  className="accent-[#009770] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Rule 3: Round amounts */}
              <div className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0A2A22]">Nominal Bulat Besar / Pemecahan Nominal</div>
                  <div className="text-[11px] text-[#6B5A55]">
                    Mendekati ambang otorisasi atau kelipatan bulat tanpa pecahan sen
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={ruleConfig.roundAmounts.enabled}
                  onChange={() => handleRuleToggle('roundAmounts')}
                  className="accent-[#009770] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Rule 4: Missing docs */}
              <div className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0A2A22]">Transaksi Tanpa Dokumen Pendukung</div>
                  <div className="text-[11px] text-[#6B5A55]">
                    Tanpa nomor slip bukti fisik atau kwitansi resmi
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={ruleConfig.missingDocuments.enabled}
                  onChange={() => handleRuleToggle('missingDocuments')}
                  className="accent-[#009770] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F3D9CE] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            Selesai &amp; Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
};
