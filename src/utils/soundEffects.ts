/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Audio API procedural sound generator.
 * Produces crisp, futuristic AI machine, boot sequence, and UI telemetry sounds
 * without needing external audio files or network requests.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Futuristic AI Machine Boot & Authentication Sound Sequence
   * 1. Sub-bass resonant hum (power reactor spinning up)
   * 2. High-frequency digital neural data chirps
   * 3. Resonant ascending filter sweep
   * 4. Harmonic crystal verification chord
   */
  public playAiBootSequence() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Sub-bass Reactor Spin-Up (120Hz down to 60Hz with rumble)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.exponentialRampToValueAtTime(160, now + 0.4);
    subOsc.frequency.exponentialRampToValueAtTime(80, now + 1.2);

    // Low-pass filter for deep machine feel
    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(180, now);
    subFilter.frequency.exponentialRampToValueAtTime(450, now + 0.5);
    subFilter.frequency.exponentialRampToValueAtTime(120, now + 1.2);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.28, now + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 1.4);

    // 2. High-Tech Cyber Hologram Arpeggiator (Data packets scanning)
    const tones = [587.33, 880.0, 1174.66, 1760.0, 2349.32]; // D5, A5, D6, A6, D7
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.15 + idx * 0.08);

      gain.gain.setValueAtTime(0, now + 0.15 + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.17 + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32 + idx * 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.15 + idx * 0.08);
      osc.stop(now + 0.4 + idx * 0.08);
    });

    // 3. Cyber Scanning Resonant Laser Sweep (AI Neural Synapse)
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    const sweepFilter = ctx.createBiquadFilter();

    sweepOsc.type = 'triangle';
    sweepOsc.frequency.setValueAtTime(320, now + 0.45);
    sweepOsc.frequency.exponentialRampToValueAtTime(1480, now + 0.95);

    sweepFilter.type = 'bandpass';
    sweepFilter.Q.setValueAtTime(6.0, now + 0.45);
    sweepFilter.frequency.setValueAtTime(450, now + 0.45);
    sweepFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.95);

    sweepGain.gain.setValueAtTime(0.001, now + 0.45);
    sweepGain.gain.linearRampToValueAtTime(0.18, now + 0.7);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(ctx.destination);

    sweepOsc.start(now + 0.45);
    sweepOsc.stop(now + 1.15);

    // 4. Affirmative Access Granted Chord (Crystal chime)
    const chordFrequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chordFrequencies.forEach((freq) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, now + 1.05);

      chimeGain.gain.setValueAtTime(0.001, now + 1.05);
      chimeGain.gain.linearRampToValueAtTime(0.12, now + 1.12);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      chimeOsc.start(now + 1.05);
      chimeOsc.stop(now + 2.1);
    });
  }

  /**
   * Crisp futuristic UI tap / selection sound
   */
  public playClick(pitch: number = 800) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * AI Telemetry Data Pulse (used when streaming new transactions arrive)
   */
  public playDataPulse() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Warning / Anomaly Alert sound
   */
  public playAlert() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [750, 620].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.12);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.12);
    });
  }
}

export const soundEngine = new SoundEngine();
