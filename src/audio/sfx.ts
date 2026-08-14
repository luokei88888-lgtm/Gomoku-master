interface ToneOpts {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  peak?: number;
  delay?: number;
  attack?: number;
}

interface NoiseOpts {
  dur: number;
  freq: number;
  to?: number;
  filter?: BiquadFilterType;
  q?: number;
  peak?: number;
  delay?: number;
}

/** Procedural SFX — no audio files. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(private volume: number) {}

  setVolume(v: number): void {
    this.volume = v;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  private ensure(): AudioContext | null {
    const AC =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    return this.ctx;
  }

  private tone(o: ToneOpts): void {
    if (this.volume <= 0.01) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const peak = o.peak ?? 0.2;
    const attack = o.attack ?? 0.008;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + o.dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
  }

  private noise(o: NoiseOpts): void {
    if (this.volume <= 0.01) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (!this.noiseBuffer) {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const peak = o.peak ?? 0.12;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = o.filter ?? 'bandpass';
    filter.frequency.setValueAtTime(o.freq, t0);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + o.dur);
    filter.Q.value = o.q ?? 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + o.dur + 0.05);
  }

  place(): void {
    this.tone({ freq: 280, to: 180, dur: 0.09, type: 'sine', peak: 0.22 });
    this.noise({ dur: 0.06, freq: 600, filter: 'lowpass', peak: 0.1 });
  }

  undo(): void {
    this.tone({ freq: 360, to: 240, dur: 0.12, type: 'triangle', peak: 0.14 });
  }

  hint(): void {
    this.tone({ freq: 660, to: 880, dur: 0.12, type: 'sine', peak: 0.14 });
    this.tone({ freq: 990, dur: 0.1, type: 'triangle', peak: 0.08, delay: 0.06 });
  }

  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.tone({
        freq: f,
        dur: i === notes.length - 1 ? 0.45 : 0.14,
        type: 'triangle',
        peak: 0.2,
        delay: i * 0.12,
      });
    });
  }

  lose(): void {
    this.tone({ freq: 300, to: 140, dur: 0.5, type: 'sawtooth', peak: 0.1 });
  }

  draw(): void {
    this.tone({ freq: 400, dur: 0.15, type: 'triangle', peak: 0.12 });
    this.tone({ freq: 400, dur: 0.15, type: 'triangle', peak: 0.1, delay: 0.18 });
  }

  click(): void {
    this.tone({ freq: 520, to: 640, dur: 0.05, type: 'triangle', peak: 0.1 });
  }
}

let shared: Sfx | null = null;

export function getSfx(volume = 0.7): Sfx {
  if (!shared) shared = new Sfx(volume);
  else shared.setVolume(volume);
  return shared;
}
