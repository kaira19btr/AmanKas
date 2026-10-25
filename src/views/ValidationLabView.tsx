/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ValidationAblationResult } from '../types';
import { runValidationAblation } from '../utils/dataGenerator';
import { soundEngine } from '../utils/soundEffects';

export const ValidationLabView: React.FC = () => {
  const [trxCount, setTrxCount] = useState<number>(1000);
  const [injectedPercent, setInjectedPercent] = useState<number>(10);
  const [baseSeed, setBaseSeed] = useState<number>(42);
  const [repetitions, setRepetitions] = useState<number>(20);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<ValidationAblationResult[]>(() =>
    runValidationAblation({
      transactionCount: 1000,
      injectedPercent: 10,
      seed: 42,
      repetitions: 20,
    })
  );

  const [activeMetricTab, setActiveMetricTab] = useState<'f1' | 'precision' | 'recall' | 'fpr' | 'alerts'>('f1');

  const handleRunBenchmark = () => {
    setIsRunning(true);
    soundEngine.playAiBootSequence();

    setTimeout(() => {
      const computed = runValidationAblation({
        transactionCount: trxCount,
        injectedPercent: injectedPercent,
        seed: baseSeed,
        repetitions: repetitions,
      });
      setResults(computed);
      setIsRunning(false);
      soundEngine.playSuccess();
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* 1. Permanent Synthetic Data Disclaimer Banner (Mandatory Requirement) */}
      <div className="p-4 rounded-2xl bg-[#FFE9DF] border-2 border-[#CE2F2E] text-[#86513D] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#CE2F2E] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">science</span>
          </div>
          <div>
            <div className="font-display font-extrabold text-xs uppercase tracking-wider text-[#CE2F2E]">
              Pemberitahuan Metodologi Validasi
            </div>
            <p className="text-xs font-bold text-[#0A2A22] mt-0.5">
              DATA SINTETIS. Metrik ini hanya menunjukkan sistem berjalan, bukan kinerja pada koperasi nyata.
            </p>
          </div>
        </div>
        <span className="font-mono-tabular text-xs text-[#86513D] bg-white px-2.5 py-1 rounded-lg border border-[#F3D9CE] shrink-0 font-semibold self-end sm:self-auto">
          Evaluasi Akal Sehat (Fair Benchmark)
        </span>
      </div>

      {/* 2. Simulation & Synthetic Dataset Controls */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3D9CE] pb-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#0A2A22]">
              Pembangkit Data Sintetis &amp; Uji Ablasi 5 Konfigurasi
            </h2>
            <p className="text-xs text-[#6B5A55]">
              Menyisipkan 6 jenis pola anomali dengan label kebenaran (ground truth) untuk mengukur sensitivitas empiris
            </p>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-[#009770] hover:bg-[#008260] disabled:bg-gray-400 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <span className={`material-symbols-outlined text-sm ${isRunning ? 'animate-spin' : ''}`}>
              {isRunning ? 'refresh' : 'play_arrow'}
            </span>
            {isRunning ? 'Menjalankan Simulasi 20 Seed...' : 'Jalankan Uji Ablasi Ulang'}
          </button>
        </div>

        {/* Injected Patterns Info */}
        <div className="text-xs space-y-2">
          <span className="font-semibold text-[#0A2A22] block">
            Pola yang Disisipkan Bersama Label Kebenaran:
          </span>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[#0A2A22]">
              Void/Retur Berulang
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[#0A2A22]">
              Pemecahan Transaksi (Smurfing)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[#0A2A22]">
              Selisih Kas Harian
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[#0A2A22]">
              Pencampuran Uang Pribadi
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[#0A2A22]">
              Nominal Bulat Berulang
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] text-[#0A2A22]">
              Manipulasi Digit Benford
            </span>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium">Jumlah Transaksi per Iterasi</label>
            <select
              value={trxCount}
              onChange={(e) => setTrxCount(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono-tabular"
            >
              <option value="500">500 Transaksi</option>
              <option value="1000">1.000 Transaksi</option>
              <option value="2000">2.000 Transaksi</option>
            </select>
          </div>

          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium">Persentase Pola Anomali Disisipkan</label>
            <select
              value={injectedPercent}
              onChange={(e) => setInjectedPercent(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono-tabular"
            >
              <option value="5">5% Transaksi</option>
              <option value="10">10% Transaksi (Standar)</option>
              <option value="15">15% Transaksi</option>
              <option value="20">20% Transaksi</option>
            </select>
          </div>

          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium">Jumlah Pengulangan (Seed)</label>
            <input
              type="number"
              min="5"
              max="50"
              value={repetitions}
              onChange={(e) => setRepetitions(Number(e.target.value) || 20)}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono-tabular"
            />
            <span className="text-[10px] text-[#6B5A55] mt-0.5 block">Menghasilkan nilai &mu; &plusmn; &sigma;</span>
          </div>

          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium">Seed Awal Acak</label>
            <input
              type="number"
              value={baseSeed}
              onChange={(e) => setBaseSeed(Number(e.target.value) || 42)}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono-tabular"
            />
          </div>
        </div>
      </section>

      {/* 3. Ablation Study Results Table */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-[#0A2A22]">
              Hasil Perbandingan 5 Konfigurasi (Rata-rata &plusmn; Simpangan Baku dari {repetitions} Seed)
            </h3>
            <p className="text-xs text-[#6B5A55]">
              Hasil apa adanya tanpa rekayasa kurva untuk memenangkan algoritma tertentu
            </p>
          </div>
          <span className="text-[11px] font-mono-tabular text-[#009770] bg-[#E0F4EE] px-2.5 py-1 rounded-lg font-semibold">
            Objektif &amp; Tidak Berpihak
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#F3D9CE]/70">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FFF8F4] text-[#6B5A55] font-semibold border-b border-[#F3D9CE]">
              <tr>
                <th className="py-3 px-4">Konfigurasi Pengujian</th>
                <th className="py-3 px-3 text-right">Precision (&mu; &plusmn; &sigma;)</th>
                <th className="py-3 px-3 text-right">Recall (&mu; &plusmn; &sigma;)</th>
                <th className="py-3 px-3 text-right">F1-Score (&mu; &plusmn; &sigma;)</th>
                <th className="py-3 px-3 text-right">False Positive Rate</th>
                <th className="py-3 px-3 text-right">Peringatan per 1.000 Trx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3D9CE]/50">
              {results.map((r, idx) => {
                const pVal = typeof r.precision === 'number' ? r.precision : r.precision.mean;
                const pStd = r.precisionStd ?? (typeof r.precision === 'object' ? r.precision.std : 0);

                const rVal = typeof r.recall === 'number' ? r.recall : r.recall.mean;
                const rStd = r.recallStd ?? (typeof r.recall === 'object' ? r.recall.std : 0);

                const fVal = typeof r.f1Score === 'number' ? r.f1Score : typeof r.f1 === 'number' ? r.f1 : typeof r.f1 === 'object' ? r.f1.mean : 0;
                const fStd = r.f1Std ?? (typeof r.f1 === 'object' ? r.f1.std : 0);

                const fprVal = typeof r.falsePositiveRate === 'number' ? r.falsePositiveRate : typeof r.fpr === 'number' ? r.fpr : typeof r.fpr === 'object' ? r.fpr.mean : 0;
                const fprStd = r.fprStd ?? (typeof r.fpr === 'object' ? r.fpr.std : 0);

                const alVal = typeof r.alertsPerThousand === 'number' ? r.alertsPerThousand : typeof r.alertsPer1000 === 'number' ? r.alertsPer1000 : typeof r.alertsPer1000 === 'object' ? r.alertsPer1000.mean : 0;
                const alStd = r.alertsPerThousandStd ?? (typeof r.alertsPer1000 === 'object' ? r.alertsPer1000.std : 0);

                return (
                  <tr key={idx} className="hover:bg-[#FFF8F4]/50">
                    <td className="py-3 px-4 font-bold text-[#0A2A22]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#009770]" />
                        <span>{r.configName || r.configuration}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      <strong className="text-[#0A2A22]">{pVal.toFixed(1)}%</strong>{' '}
                      <span className="text-[10px] text-[#6B5A55]">&plusmn; {pStd.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      <strong className="text-[#0A2A22]">{rVal.toFixed(1)}%</strong>{' '}
                      <span className="text-[10px] text-[#6B5A55]">&plusmn; {rStd.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      <strong className="text-[#009770] font-bold">{fVal.toFixed(1)}%</strong>{' '}
                      <span className="text-[10px] text-[#6B5A55]">&plusmn; {fStd.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      <strong className="text-[#86513D]">{fprVal.toFixed(1)}%</strong>{' '}
                      <span className="text-[10px] text-[#6B5A55]">&plusmn; {fprStd.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-[#0A2A22]">
                      <strong>{alVal.toFixed(1)}</strong>{' '}
                      <span className="text-[10px] text-[#6B5A55]">&plusmn; {alStd.toFixed(1)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Comparison Bar Chart Visualizer */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold text-[#0A2A22]">
              Grafik Batang Perbandingan Metrik Antar Konfigurasi
            </h3>
            <p className="text-xs text-[#6B5A55]">
              Pilih metrik evaluasi untuk melihat visualisasi perbandingan
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#FFF8F4] p-1 rounded-xl border border-[#F3D9CE] text-xs">
            {(['f1', 'precision', 'recall', 'fpr', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMetricTab(tab)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeMetricTab === tab
                    ? 'bg-[#009770] text-white shadow-xs'
                    : 'text-[#6B5A55] hover:text-[#0A2A22]'
                }`}
              >
                {tab === 'f1' && 'F1-Score'}
                {tab === 'precision' && 'Precision'}
                {tab === 'recall' && 'Recall'}
                {tab === 'fpr' && 'False Positive Rate'}
                {tab === 'alerts' && 'Peringatan / 1k'}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Comparison */}
        <div className="space-y-4 pt-2">
          {results.map((r, idx) => {
            let val = 0;
            let stdVal = 0;
            let maxRef = 100;
            let unit = '%';

            if (activeMetricTab === 'f1') {
              val = typeof r.f1Score === 'number' ? r.f1Score : typeof r.f1 === 'number' ? r.f1 : typeof r.f1 === 'object' ? r.f1.mean : 0;
              stdVal = r.f1Std ?? (typeof r.f1 === 'object' ? r.f1.std : 0);
            } else if (activeMetricTab === 'precision') {
              val = typeof r.precision === 'number' ? r.precision : r.precision.mean;
              stdVal = r.precisionStd ?? (typeof r.precision === 'object' ? r.precision.std : 0);
            } else if (activeMetricTab === 'recall') {
              val = typeof r.recall === 'number' ? r.recall : r.recall.mean;
              stdVal = r.recallStd ?? (typeof r.recall === 'object' ? r.recall.std : 0);
            } else if (activeMetricTab === 'fpr') {
              val = typeof r.falsePositiveRate === 'number' ? r.falsePositiveRate : typeof r.fpr === 'number' ? r.fpr : typeof r.fpr === 'object' ? r.fpr.mean : 0;
              stdVal = r.fprStd ?? (typeof r.fpr === 'object' ? r.fpr.std : 0);
            } else if (activeMetricTab === 'alerts') {
              val = typeof r.alertsPerThousand === 'number' ? r.alertsPerThousand : typeof r.alertsPer1000 === 'number' ? r.alertsPer1000 : typeof r.alertsPer1000 === 'object' ? r.alertsPer1000.mean : 0;
              stdVal = r.alertsPerThousandStd ?? (typeof r.alertsPer1000 === 'object' ? r.alertsPer1000.std : 0);
              maxRef = 200;
              unit = ' peringatan';
            }

            const pctWidth = Math.min(100, (val / maxRef) * 100);

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0A2A22]">{r.configName || r.configuration}</span>
                  <span className="font-mono-tabular font-bold text-[#0A2A22]">
                    {val.toFixed(1)}
                    {unit} (&plusmn;{stdVal.toFixed(1)})
                  </span>
                </div>
                <div className="w-full bg-[#FFF8F4] h-4 rounded-full overflow-hidden border border-[#F3D9CE] p-0.5">
                  <div
                    style={{ width: `${pctWidth}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeMetricTab === 'fpr'
                        ? 'bg-[#86513D]'
                        : idx === 3
                        ? 'bg-[#009770]'
                        : idx === 4
                        ? 'bg-[#00B386]'
                        : 'bg-[#6B5A55]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] text-[11px] text-[#6B5A55] leading-relaxed">
          <strong>Interpretasi Ilmiah:</strong> Konfigurasi "aturan saja" cenderung memiliki presisi tinggi pada pola umum tetapi gagal menangkap anomali tersembunyi (recall rendah). "Anomali saja" mendeteksi lebih banyak pencilan namun memicu lebih banyak false-alarm. Konfigurasi gabungan menyeimbangkan kedua dimensi. Ambang adaptif (HIPOTESIS) menurunkan ambang pada akun berisiko tinggi dengan konsekuensi peningkatan volume tinjauan manusia.
        </div>
      </section>
    </div>
  );
};
