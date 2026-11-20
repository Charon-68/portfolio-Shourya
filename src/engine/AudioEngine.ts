import * as THREE from 'three';

/**
 * Nocturnal ambient audio engine routed through Three.js AudioListener.
 * Starts muted and fades cleanly in/out on toggle, with a low-pass filter
 * muffle sweep during CTA hover transitions.
 */
export class ValleyAudioStore {
  public listener: THREE.AudioListener;
  public isInitialized = false;
  public isMuted = true;

  private masterGain: GainNode | null = null;
  private muffleFilter: BiquadFilterNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseSource: AudioBufferSourceNode | null = null;
  private chimeTimer: number | null = null;
  private isDisposed = false;

  constructor(camera: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
  }

  public initAudio(): void {
    if (this.isInitialized || this.isDisposed) return;

    const ctx = this.listener.context;
    const input = this.listener.getInput();

    this.muffleFilter = ctx.createBiquadFilter();
    this.muffleFilter.type = 'lowpass';
    this.muffleFilter.frequency.setValueAtTime(4800, ctx.currentTime);
    this.muffleFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);

    this.muffleFilter.connect(this.masterGain);
    this.masterGain.connect(input);

    // Warm nocturnal harmonic drone (D2, A2, E3, F#3, A3)
    const freqs = [73.42, 110.0, 164.81, 185.0, 220.0];
    const gains = [0.24, 0.18, 0.11, 0.08, 0.07];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime((idx - 2) * 3.5, ctx.currentTime);

      const voiceFilter = ctx.createBiquadFilter();
      voiceFilter.type = 'lowpass';
      voiceFilter.frequency.setValueAtTime(idx < 2 ? 420 : 950, ctx.currentTime);

      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(gains[idx], ctx.currentTime);

      // Slow organic breathing LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.06 + idx * 0.023, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(gains[idx] * 0.35, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(voiceGain.gain);
      lfo.start();

      osc.connect(voiceFilter);
      voiceFilter.connect(voiceGain);
      voiceGain.connect(this.muffleFilter!);
      osc.start();

      this.oscillators.push(osc, lfo);
    });

    // Soft nocturnal breeze through pink-filtered noise
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.06;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(420, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.1, ctx.currentTime);

    const windLfo = ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.09, ctx.currentTime);
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.setValueAtTime(180, ctx.currentTime);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();
    this.oscillators.push(windLfo);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.22, ctx.currentTime);

    noise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.muffleFilter);
    noise.start();
    this.noiseSource = noise;

    // Gentle nocturnal bell/dew shimmer
    const chimeNotes = [587.33, 659.25, 739.99, 880.0, 1174.66];
    const scheduleChime = () => {
      if (this.isDisposed) return;
      if (!this.isMuted && ctx.state === 'running' && this.muffleFilter) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const note = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);
        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(0.025, now + 0.08);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
        osc.connect(env);
        env.connect(this.muffleFilter);
        osc.start(now);
        osc.stop(now + 3.3);
      }
      this.chimeTimer = window.setTimeout(scheduleChime, 2600 + Math.random() * 3400);
    };
    this.chimeTimer = window.setTimeout(scheduleChime, 1800);

    this.isInitialized = true;
  }

  public toggleMute(): boolean {
    if (!this.isInitialized || !this.masterGain) return this.isMuted;
    const ctx = this.listener.context;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    this.isMuted = !this.isMuted;
    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.55, now + 0.65);

    return this.isMuted;
  }

  public setMuffled(muffled: boolean): void {
    if (!this.isInitialized || !this.muffleFilter) return;
    const ctx = this.listener.context;
    const now = ctx.currentTime;
    this.muffleFilter.frequency.cancelScheduledValues(now);
    this.muffleFilter.frequency.setValueAtTime(this.muffleFilter.frequency.value, now);
    this.muffleFilter.frequency.exponentialRampToValueAtTime(muffled ? 320 : 4800, now + 0.75);
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.chimeTimer !== null) {
      window.clearTimeout(this.chimeTimer);
    }
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // Ignore
      }
    }
    this.masterGain?.disconnect();
    this.muffleFilter?.disconnect();
    if (this.listener.context.state === 'running') {
      void this.listener.context.close().catch(() => {});
    }
  }
}
