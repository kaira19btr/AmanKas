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
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [results, setResults] = useState<ValidationAblationResult[]>(() =>
    runValidationAblation({
      transactionCount: 1000,
      injectedPercent: 10,
      seed: 42,
      repetitions: 20,
    })
  );

  const [activeMetricTab, setActiveMetricTab] = useState<'f1' | 'precision' | 'recall' | 'fpr' | 'alerts'>('f1');

  // Safe metric extractors
  const getF1 = (r: ValidationAblationResult) => {
    const f1 = r.f1Score ?? r.f1 ?? 0;
    const mean = typeof f1 === 'number' ? f1 : f1.mean;
    const std = r.f1ScoreStd ?? r.f1Std ?? (typeof f1 === 'object' ? f1.std : 0);
    return { mean, std };
  };

  const getPrecision = (r: ValidationAblationResult) => {
    const prec = r.precision;
    const mean = typeof prec === 'number' ? prec : prec.mean;
    const std = r.precisionStd ?? (typeof prec === 'object' ? prec.std : 0);
    return { mean, std };
  };

  const getRecall = (r: ValidationAblationResult) => {
    const rec = r.recall;
    const mean = typeof rec === 'number' ? rec : rec.mean;
    const std = r.recallStd ?? (typeof rec === 'object' ? rec.std : 0);
    return { mean, std };
  };

  const getFpr = (r: ValidationAblationResult) => {
    const fpr = r.falsePositiveRate ?? r.fpr ?? 0;
    const mean = typeof fpr === 'number' ? fpr : fpr.mean;
    const std = r.fprStd ?? (typeof fpr === 'object' ? fpr.std : 0);
    return { mean, std };
  };

  const getAlerts = (r: ValidationAblationResult) => {
    const alerts = r.alertsPerThousand ?? r.alertsPer1000 ?? 0;
    const mean = typeof alerts === 'number' ? alerts : alerts.mean;
    const std = r.alertsPerThousandStd ?? (typeof alerts === 'object' ? alerts.std : 0);
    return { mean, std };
  };

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

  // 1. Ekspor hasil (CSV)
  const handleExportCsv = () => {
    const headers = 'Konfigurasi,F1_Mean,F1_Std,Precision_Mean,Precision_Std,Recall_Mean,Recall_Std,FPR_Mean,FPR_Std,AlertsPer1000_Mean,AlertsPer1000_Std\n';
    const rows = results
      .map((r) => {
        const name = `"${r.configName || r.configuration || ''}"`;
        const f1 = getF1(r);
        const p = getPrecision(r);
        const rec = getRecall(r);
        const fpr = getFpr(r);
        const al = getAlerts(r);

        return `${name},${f1.mean.toFixed(2)},${f1.std.toFixed(2)},${p.mean.toFixed(2)},${p.std.toFixed(2)},${rec.mean.toFixed(2)},${rec.std.toFixed(2)},${fpr.mean.toFixed(2)},${fpr.std.toFixed(2)},${al.mean.toFixed(1)},${al.std.toFixed(1)}`;
      })
      .join('\n');

    const meta = `# Metodologi Validasi Sintetis SADAR\n# Transaksi per Iterasi: ${trxCount}\n# Rasio Anomali: ${injectedPercent}%\n# Seed Dasar: ${baseSeed}\n# Pengulangan (Monte Carlo): ${repetitions}\n# Catatan: DATA SINTETIS. Bukan kinerja pada koperasi nyata.\n`;
    const blob = new Blob([meta + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sadar_validasi_ablasibenchmark_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundEngine.playSuccess();
  };

  // 2. Salin ringkasan metode
  const handleCopyMethodSummary = () => {
    let summary = `RINGKASAN METODE VALIDASI SINTETIS (LAMPIRAN ESAI SADAR)
=====================================================
Pemberitahuan: DATA SINTETIS. Metrik ini hanya menunjukkan sistem berjalan, bukan kinerja pada koperasi nyata.
Parameter Uji:
- Jumlah Transaksi per Iterasi : ${trxCount}
- Proporsi Anomali Disisipkan   : ${injectedPercent}%
- Seed Awal                    : ${baseSeed}
- Jumlah Pengulangan (Seeds)   : ${repetitions} kali pengulangan independen
- Generator Aturan             : Ground truth berlabel 6 variasi anomali (tanpa penyetelan memihak)

TABEL HASIL METRIK ABLASI (Rata-rata ± Simpangan Baku):
-------------------------------------------------------------------------------------------------------------------
Konfigurasi              | F1-Score (%)     | Presisi (%)      | Recall (%)       | FPR (%)          | Peringatan/1000
-------------------------------------------------------------------------------------------------------------------
`;

    results.forEach((r) => {
      const name = (r.configName || r.configuration || '').padEnd(24);
      const f1 = getF1(r);
      const p = getPrecision(r);
      const rec = getRecall(r);
      const fpr = getFpr(r);
      const al = getAlerts(r);

      const f1Str = `${f1.mean.toFixed(1)} ± ${f1.std.toFixed(1)}%`.padEnd(16);
      const pStr = `${p.mean.toFixed(1)} ± ${p.std.toFixed(1)}%`.padEnd(16);
      const rStr = `${rec.mean.toFixed(1)} ± ${rec.std.toFixed(1)}%`.padEnd(16);
      const fprStr = `${fpr.mean.toFixed(1)} ± ${fpr.std.toFixed(1)}%`.padEnd(16);
      const alStr = `${al.mean.toFixed(0)} ± ${al.std.toFixed(0)}`;

      summary += `${name} | ${f1Str} | ${pStr} | ${rStr} | ${fprStr} | ${alStr}\n`;
    });

    summary += `-------------------------------------------------------------------------------------------------------------------
Kesimpulan Singkat: Model hibrida menyeimbangkan presisi aturan dan daya tangkap anomali multi-dimensi. Ambang adaptif menguji trade-off beban penelaahan manusia vs penurunan false negative.`;

    navigator.clipboard.writeText(summary);
    soundEngine.playSuccess();
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Permanent Synthetic Data Disclaimer Banner (Mandatory Requirement) */}
      <div className="p-4 rounded-2xl bg-[#FFE9DF] border-2 border-[#CE2F2E] text-[#86513D] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-ui">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#CE2F2E] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">science</span>
          </div>
          <div>
            <div className="font-mono font-medium text-xs uppercase tracking-[0.08em] text-[#CE2F2E]">
              Pemberitahuan Metodologi Validasi
            </div>
            <p className="text-xs font-bold text-[#0A2A22] mt-0.5 font-ui">
              DATA SINTETIS. Metrik ini hanya menunjukkan sistem berjalan, bukan kinerja pada koperasi nyata.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs text-[#86513D] bg-white px-2.5 py-1 rounded-lg border border-[#F3D9CE] shrink-0 font-medium tracking-[0.08em] self-end sm:self-auto">
          Evaluasi Akal Sehat (Fair Benchmark)
        </span>
      </div>

      {/* 2. Simulation & Synthetic Dataset Controls */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3D9CE] pb-4">
          <div>
            <h2 className="font-ui text-base font-semibold text-[#0A2A22]">
              Pembangkit Data Sintetis &amp; Uji Ablasi 5 Konfigurasi
            </h2>
            <p className="text-xs text-[#6B5A55] font-ui font-normal">
              Menyisipkan 6 jenis pola anomali dengan label kebenaran (ground truth) untuk mengukur sensitivitas empiris
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Export buttons required by essay specification */}
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#F3D9CE] text-[#0A2A22] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs font-ui"
              title="Unduh metrik tabel ablasi dalam format CSV untuk lampiran karya ilmiah"
            >
              <span className="material-symbols-outlined text-sm text-[#009770]">download</span>
              <span>Ekspor hasil (CSV)</span>
            </button>

            <button
              onClick={handleCopyMethodSummary}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#F3D9CE] text-[#0A2A22] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs font-ui"
              title="Salin parameter uji, seed, dan tabel metrik ke clipboard untuk naskah lampiran"
            >
              <span className="material-symbols-outlined text-sm text-[#009770]">content_copy</span>
              <span>{copiedSummary ? 'Tersalin ke Clipboard!' : 'Salin ringkasan metode'}</span>
            </button>

            <button
              onClick={handleRunBenchmark}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] disabled:bg-gray-400 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs font-ui"
            >
              <span className={`material-symbols-outlined text-sm ${isRunning ? 'animate-spin' : ''}`}>
                {isRunning ? 'refresh' : 'play_arrow'}
              </span>
              <span>{isRunning ? 'Simulasi...' : 'Jalankan Uji Ablasi'}</span>
            </button>
          </div>
        </div>

        {/* Injected Patterns Info */}
        <div className="text-xs space-y-2 font-ui">
          <span className="font-semibold text-[#0A2A22] block font-ui">
            Pola yang Disisipkan Bersama Label Kebenaran:
          </span>
          <div className="flex flex-wrap gap-2 text-[11px] font-ui font-medium">
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 text-xs font-ui">
          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium font-ui">Jumlah Transaksi per Iterasi</label>
            <select
              value={trxCount}
              onChange={(e) => setTrxCount(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono tabular-nums"
            >
              <option value="500">500 Transaksi</option>
              <option value="1000">1.000 Transaksi</option>
              <option value="2000">2.000 Transaksi</option>
            </select>
          </div>

          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium font-ui">Persentase Pola Anomali Disisipkan</label>
            <select
              value={injectedPercent}
              onChange={(e) => setInjectedPercent(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono tabular-nums"
            >
              <option value="5">5% Transaksi</option>
              <option value="10">10% Transaksi</option>
              <option value="15">15% Transaksi</option>
            </select>
          </div>

          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium font-ui">Seed Awal Pseudo-Random</label>
            <input
              type="number"
              value={baseSeed}
              onChange={(e) => setBaseSeed(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[#6B5A55] mb-1 font-medium font-ui">Jumlah Pengulangan (Monte Carlo)</label>
            <select
              value={repetitions}
              onChange={(e) => setRepetitions(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] font-mono tabular-nums"
            >
              <option value="10">10 Iterasi</option>
              <option value="20">20 Iterasi</option>
              <option value="50">50 Iterasi</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Ablation Benchmark Results Table */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
        <div>
          <h3 className="font-ui text-sm font-semibold text-[#0A2A22]">
            Tabel Evaluasi Metrik Komparasi 5 Konfigurasi (Rata-rata &plusmn; Simpangan Baku)
          </h3>
          <p className="text-xs text-[#6B5A55] font-ui font-normal">
            Hasil pengulangan {repetitions} kali simulasi dengan ground truth sintetis yang tidak dimodifikasi
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums border border-[#F3D9CE] rounded-xl overflow-hidden">
            <thead className="bg-[#FFF8F4] text-[#0A2A22]">
              <tr>
                <th className="py-2.5 px-3 font-semibold font-ui">Konfigurasi Pengendalian</th>
                <th className="py-2.5 px-3 font-semibold text-center">F1-Score (%)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Presisi (%)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Recall (%)</th>
                <th className="py-2.5 px-3 font-semibold text-center">FPR (%)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Peringatan / 1.000 trx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3D9CE]/60">
              {results.map((r, idx) => {
                const f1 = getF1(r);
                const prec = getPrecision(r);
                const rec = getRecall(r);
                const fpr = getFpr(r);
                const alerts = getAlerts(r);

                const isCombined = idx === 3;
                const isAdaptive = idx === 4;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-[#FFF8F4]/80 transition-colors ${
                      isCombined ? 'bg-emerald-50/50 font-bold' : isAdaptive ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-ui text-[#0A2A22]">
                      <div className="flex items-center gap-1.5">
                        {isCombined && <span className="w-2 h-2 rounded-full bg-[#009770]" />}
                        {isAdaptive && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                        <span>{r.configName || r.configuration}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#0A2A22]">
                      {f1.mean.toFixed(1)} <span className="text-[10px] text-[#6B5A55]">&plusmn;{f1.std.toFixed(1)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#0A2A22]">
                      {prec.mean.toFixed(1)} <span className="text-[10px] text-[#6B5A55]">&plusmn;{prec.std.toFixed(1)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#0A2A22]">
                      {rec.mean.toFixed(1)} <span className="text-[10px] text-[#6B5A55]">&plusmn;{rec.std.toFixed(1)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#86513D]">
                      {fpr.mean.toFixed(1)} <span className="text-[10px] text-[#6B5A55]">&plusmn;{fpr.std.toFixed(1)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#0A2A22]">
                      {alerts.mean.toFixed(0)} <span className="text-[10px] text-[#6B5A55]">&plusmn;{alerts.std.toFixed(0)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Graphical Metric Comparison */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3D9CE] pb-3">
          <h3 className="font-ui text-sm font-semibold text-[#0A2A22]">
            Visualisasi Perbandingan Kinerja Lintas Konfigurasi
          </h3>
          <div className="flex items-center gap-1 bg-[#FFF8F4] p-1 rounded-xl border border-[#F3D9CE] text-xs font-ui">
            {(
              [
                { key: 'f1', label: 'F1-Score' },
                { key: 'precision', label: 'Presisi' },
                { key: 'recall', label: 'Recall' },
                { key: 'fpr', label: 'False Positive' },
                { key: 'alerts', label: 'Beban Tinjauan' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveMetricTab(tab.key)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-ui ${
                  activeMetricTab === tab.key
                    ? 'bg-[#009770] text-white font-semibold shadow-xs'
                    : 'text-[#6B5A55] hover:text-[#0A2A22]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Comparison Horizontal Bars */}
        <div className="space-y-3 pt-2">
          {results.map((r, idx) => {
            let val = 0;
            let stdVal = 0;
            let maxRef = 100;
            let unit = '%';

            if (activeMetricTab === 'f1') {
              const m = getF1(r);
              val = m.mean;
              stdVal = m.std;
            } else if (activeMetricTab === 'precision') {
              const m = getPrecision(r);
              val = m.mean;
              stdVal = m.std;
            } else if (activeMetricTab === 'recall') {
              const m = getRecall(r);
              val = m.mean;
              stdVal = m.std;
            } else if (activeMetricTab === 'fpr') {
              const m = getFpr(r);
              val = m.mean;
              stdVal = m.std;
            } else if (activeMetricTab === 'alerts') {
              const m = getAlerts(r);
              val = m.mean;
              stdVal = m.std;
              maxRef = 200;
              unit = ' peringatan';
            }

            const pctWidth = Math.min(100, (val / maxRef) * 100);

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-ui">
                  <span className="font-semibold text-[#0A2A22]">{r.configName || r.configuration}</span>
                  <span className="font-mono tabular-nums font-bold text-[#0A2A22]">
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

        <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] text-[11px] text-[#6B5A55] leading-relaxed font-ui font-normal">
          <strong>Interpretasi Ilmiah:</strong> Konfigurasi "aturan saja" cenderung memiliki presisi tinggi pada pola umum tetapi gagal menangkap anomali tersembunyi (recall rendah). "Anomali saja" mendeteksi lebih banyak pencilan namun memicu lebih banyak false-alarm. Konfigurasi gabungan menyeimbangkan kedua dimensi. Ambang adaptif (HIPOTESIS) menurunkan ambang pada akun berisiko tinggi dengan konsekuensi peningkatan volume tinjauan manusia.
        </div>
      </section>

      {/* 4. TANGGA VALIDASI EMPAT TINGKAT SESUAI ESAI SADAR */}
      <section className="bg-white rounded-3xl p-6 border border-[#F3D9CE] shadow-xs space-y-6 font-ui">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3D9CE] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#009770] text-2xl">stairs</span>
              <h2 className="font-ui text-base font-bold text-[#0A2A22]">
                Tangga Validasi Empat Tingkat (Validation Ladder)
              </h2>
            </div>
            <p className="text-xs text-[#6B5A55] mt-0.5">
              Peta jalan pengujian ilmiah bertahap dari tinjauan regulasi dasar hingga evaluasi dampak lapangan longitudinal.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-[#009770] text-white font-mono text-xs font-bold shadow-xs">
              Posisi Prototipe: Level 1
            </span>
          </div>
        </div>

        {/* 4 Levels Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Level 0 */}
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-gray-500">LEVEL 0</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">
                  Telah Selesai
                </span>
              </div>
              <h3 className="font-bold text-xs text-[#0A2A22] mt-1">
                Perancangan Berbasis Bukti
              </h3>
              <p className="text-[11px] text-[#6B5A55] leading-relaxed mt-1">
                Harmonisasi regulasi hukum (UU 27/2022 PDP, UU 4/2023 P2SK, POJK 9/2025) dan dasar teoritis statistik (Nigrini 2012 Benford MAD &amp; Liu et al. Isolation Forest).
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-mono">
              Fokus: Landasan normatif &amp; teoretis
            </div>
          </div>

          {/* Level 1 (CURRENT) */}
          <div className="p-4 rounded-2xl border-2 border-[#009770] bg-gradient-to-b from-[#E0F4EE]/40 to-white space-y-2.5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#009770]">LEVEL 1 (AKTIF)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#009770] text-white font-bold">
                  Status Saat Ini
                </span>
              </div>
              <h3 className="font-bold text-xs text-[#0A2A22] mt-1">
                Validasi Teknis Sintetis
              </h3>
              <p className="text-[11px] text-[#6B5A55] leading-relaxed mt-1">
                Pengujian terkontrol terhadap dataset sintetis berlabel kebenaran (ground truth). Uji ablasi 5 konfigurasi, metrik presisi, recall, F1, FPR, dan beban penelaahan manusia.
              </p>
            </div>
            <div className="pt-2 border-t border-[#009770]/20 text-[10px] text-[#009770] font-mono font-bold">
              Fokus: Pembuktian mekanisme komputasi
            </div>
          </div>

          {/* Level 2 */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-800">LEVEL 2</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
                  Tahap Berikutnya
                </span>
              </div>
              <h3 className="font-bold text-xs text-[#0A2A22] mt-1">
                Uji Coba Lapangan Data Riil Anonim
              </h3>
              <p className="text-[11px] text-[#6B5A55] leading-relaxed mt-1">
                Evaluasi operasional pada 1–3 koperasi percontohan dan warung UMKM. Data disamarkan (pseudonimisasi NIK dan nama) di perangkat lokal sebelum diproses.
              </p>
            </div>
            <div className="pt-2 border-t border-amber-200 text-[10px] text-amber-800 font-mono">
              Fokus: Uji empiris lapangan terbatas
            </div>
          </div>

          {/* Level 3 */}
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-gray-500">LEVEL 3</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">
                  Jangka Panjang
                </span>
              </div>
              <h3 className="font-bold text-xs text-[#0A2A22] mt-1">
                Evaluasi Dampak Lapangan
              </h3>
              <p className="text-[11px] text-[#6B5A55] leading-relaxed mt-1">
                Studi longitudinal multi-periode pasca-penerapan: penurunan anomali berulang, tingkat kepatuhan SOP 48 jam, dan penerimaan laporan agregat pada forum RAT anggota.
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-mono">
              Fokus: Dampak tata kelola &amp; keberlanjutan
            </div>
          </div>
        </div>

        {/* Batasan Klaim Ilmiah (Mandatory Callout Box) */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span className="material-symbols-outlined text-sm">shield</span>
            <span>Batasan Klaim Ilmiah yang Diizinkan:</span>
          </div>
          <p className="leading-relaxed">
            Prototipe SADAR saat ini beroperasi pada <strong>Level 1 (Validasi Teknis Sintetis)</strong>. Metrik kinerja yang ditampilkan membuktikan bahwa arsitektur komputasi, dekomposisi sinyal aturan-anomali, atribusi Shapley eksak, dan rantai hash audit berfungsi secara teknis. <strong>Tidak diperkenankan membuat klaim akurasi atau keberhasilan di dunia nyata sebelum menyelesaikan uji coba lapangan Level 2 pada data riil teranonimkan.</strong>
          </p>
        </div>
      </section>
    </div>
  );
};
