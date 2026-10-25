/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { SadarText } from './SadarText';
import { GradientButton } from '@/components/ui/gradient-button';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterFullDashboard: () => void;
  transactions: Transaction[];
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({
  isOpen,
  onClose,
  onEnterFullDashboard,
  transactions,
}) => {
  const [filter, setFilter] = useState<'Semua' | 'Perlu Ditinjau' | 'Prioritas Tinggi'>('Semua');
  const [simulatedStream, setSimulatedStream] = useState<Transaction[]>(transactions.slice(0, 15));
  const [isLivePaused, setIsLivePaused] = useState(false);

  // Live simulation tick inside modal
  useEffect(() => {
    if (!isOpen || isLivePaused) return;

    const interval = setInterval(() => {
      const accountsList = ['#K-104', '#B-101', '#S-201', '#P-302', '#K-109'];
      const membersList = ['Bpk. Hendro Prayogo', 'Ibu Nurhasanah', 'Ahmad Fauzi', 'Siti Rahmawati', 'Dewi Lestari'];
      const descriptions = ['Tarik Tunai ATM', 'Transfer Antar Rekening', 'Setoran Kasir', 'Angsuran Pinjaman', 'Pencairan Kas Operasional'];

      const randomAcc = accountsList[Math.floor(Math.random() * accountsList.length)];
      const randomMember = membersList[Math.floor(Math.random() * membersList.length)];
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];

      const isAnomaly = Math.random() < 0.25;
      const amount = isAnomaly
        ? Math.random() < 0.5
          ? 9900000
          : 5000000
        : Math.floor(100 + Math.random() * 2500) * 10000;

      const score = isAnomaly ? Math.floor(75 + Math.random() * 23) : Math.floor(2 + Math.random() * 32);
      const status = score >= 71 ? 'Prioritas tinggi' : score >= 41 ? 'Perlu ditinjau' : 'Normal';

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newTrx: Transaction = {
        id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: timeStr,
        fullDate: now.toISOString().split('T')[0],
        accountId: randomAcc,
        accountName: randomAcc === '#K-104' ? 'Kas Operasional & Cadangan' : 'Kas Utama Bank Mandiri',
        memberId: `#${Math.floor(100 + Math.random() * 900)}`,
        memberName: randomMember,
        description: randomDesc,
        amount,
        channel: 'Telemetri Real-Time',
        isolationScore: Math.round(score * 0.9),
        ruleScore: isAnomaly ? 85 : 0,
        finalScore: score,
        status,
        decisionStatus: 'Menunggu Keputusan',
        flagReasons: isAnomaly
          ? ['Nominal bulat mendekati ambang approval', 'Frekuensi penarikan di luar rentang normal']
          : ['Pola transaksi selaras dengan profil historis operasional'],
        parentAccountAnomalySensitive: randomAcc === '#K-104',
        isNew: true,
      };

      setSimulatedStream((prev) => [newTrx, ...prev.slice(0, 24)]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isOpen, isLivePaused]);

  if (!isOpen) return null;

  const filtered = simulatedStream.filter((t) => {
    if (filter === 'Perlu Ditinjau') return t.status === 'Perlu ditinjau';
    if (filter === 'Prioritas Tinggi') return t.status === 'Prioritas tinggi';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0A2A22]/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[88vh] border border-[#F3D9CE] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-[#F3D9CE] bg-gradient-to-r from-[#FFF8F4] via-white to-[#E0F4EE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] border border-[#009770]/30 flex items-center justify-center text-[#009770] shadow-xs">
              <span className="material-symbols-outlined text-[22px]">radar</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-[#0A2A22]">
                  Demo Layar Penuh: Simulasi Umpan Transaksi
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold">
                  <span className={`w-2 h-2 rounded-full ${isLivePaused ? 'bg-gray-400' : 'bg-[#009770] radar-pulse-green'}`} />
                  {isLivePaused ? 'STREAM DIJEDA' : 'LIVE TELEMETRI'}
                </span>
              </div>
              <p className="text-xs text-[#6B5A55]">
                Memperagakan mesin deteksi anomali Benford's Law &amp; Isolation Forest secara langsung.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLivePaused(!isLivePaused)}
              className="px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] text-xs font-mono-tabular font-medium text-[#0A2A22] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">
                {isLivePaused ? 'play_arrow' : 'pause'}
              </span>
              <span>{isLivePaused ? 'Lanjutkan' : 'Jeda'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 border border-[#F3D9CE] flex items-center justify-center text-[#6B5A55] hover:text-[#0A2A22] cursor-pointer shadow-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter bar & stats banner */}
        <div className="px-6 py-3 bg-[#FFF8F4] border-b border-[#F3D9CE] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="inline-flex p-1 rounded-xl bg-white border border-[#F3D9CE] font-mono-tabular text-xs">
            {(['Semua', 'Perlu Ditinjau', 'Prioritas Tinggi'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-[#009770] text-white font-semibold shadow-xs'
                    : 'text-[#6B5A55] hover:text-[#0A2A22]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-tabular text-[#6B5A55]">
            <span>
              Total Ditampilkan: <strong className="text-[#0A2A22]">{filtered.length}</strong>
            </span>
            <span>•</span>
            <span className="text-[#CE2F2E] font-semibold">
              Prioritas Tinggi: {simulatedStream.filter((t) => t.status === 'Prioritas tinggi').length}
            </span>
            <span>•</span>
            <span className="text-[#86513D] font-semibold">
              Perlu Ditinjau: {simulatedStream.filter((t) => t.status === 'Perlu ditinjau').length}
            </span>
          </div>
        </div>

        {/* Streaming Transactions Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#FFF8F4] z-10 shadow-xs">
              <tr className="border-b border-[#F3D9CE] font-mono-tabular font-semibold uppercase text-[#6B5A55] text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">ID &amp; Buku Kas</th>
                <th className="py-2.5 px-3">Anggota</th>
                <th className="py-2.5 px-3">Keterangan &amp; Alasan</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 px-3 text-center">Skor Risiko</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3D9CE]/60 font-mono-tabular">
              {filtered.map((trx) => {
                const isCrit = trx.status === 'Segera verifikasi';
                const isRev = trx.status === 'Perlu ditinjau';

                return (
                  <tr
                    key={trx.id}
                    className={`transition-colors hover:bg-[#F3FAF7] ${
                      isCrit
                        ? 'bg-[#FFEAEA]/60 border-l-4 border-[#CE2F2E]'
                        : isRev
                        ? 'bg-[#FFFDE8]/40 border-l-4 border-[#6B5F00]'
                        : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-3 text-[#0A2A22] whitespace-nowrap">
                      {trx.timestamp}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0A2A22]">{trx.id}</div>
                      <div className="text-[10px] text-[#86513D]">{trx.accountId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#0A2A22]">{trx.memberName}</div>
                      <div className="text-[10px] text-[#6B5A55]">{trx.memberId}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-medium text-[#0A2A22] truncate">{trx.description}</div>
                      <div className={`text-[10px] truncate ${isCrit ? 'text-[#CE2F2E]' : isRev ? 'text-[#6B5F00]' : 'text-[#6B5A55]'}`}>
                        {trx.flagReasons[0] || 'Transaksi wajar'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#0A2A22] whitespace-nowrap">
                      Rp {new Intl.NumberFormat('id-ID').format(trx.amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1 w-16">
                        <span
                          className={`font-bold text-[11px] ${
                            isCrit ? 'text-[#CE2F2E]' : isRev ? 'text-[#6B5F00]' : 'text-[#009770]'
                          }`}
                        >
                          {trx.finalScore}/100
                        </span>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isCrit ? 'bg-[#CE2F2E]' : isRev ? 'bg-[#6B5F00]' : 'bg-[#009770]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(8, trx.finalScore))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isCrit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDE8E8] text-[#CE2F2E] font-bold text-[10px] border border-[#CE2F2E]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />
                          Segera Verifikasi
                        </span>
                      ) : isRev ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF637] text-[#6B5F00] font-bold text-[10px] border border-[#6B5F00]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                          Perlu Ditinjau
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Bottom CTA */}
        <div className="px-6 py-4 border-t border-[#F3D9CE] bg-[#FFF8F4] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#6B5A55]">
            <span className="w-2 h-2 rounded-full bg-[#009770]" />
            <span>Data simulasi untuk demonstrasi · KSP Mitra Sejahtera (Demo)</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <GradientButton
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Tutup Demo
            </GradientButton>

            <GradientButton
              variant="default"
              size="sm"
              onClick={onEnterFullDashboard}
              className="flex-1 sm:flex-none"
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Masuk ke Dasbor Lengkap</span>
                <SadarText variant="dark" className="text-xs font-black" />
              </span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
};
