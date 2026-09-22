// Web Audio API sound engine for Chronicle D&D.
// Synthesizes dice rolls, message chimes, and combat stings,
// plus a subtle ambient drone with occasional pentatonic tones.
// No external audio files — everything is generated programmatically.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.musicNodes = null;
    this.toneTimer = null;
    this.muted = localStorage.getItem('chronicle_muted') === '1';
  }

  ensureContext() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.6;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.5;
    this.musicBus.connect(this.master);
  }

  resume() {
    this.ensureContext();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('chronicle_muted', this.muted ? '1' : '0');
    this.ensureContext();
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // --- Sound effects ---

  playDiceRoll() {
    this.resume();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = 0.5;
    // Rattle: gated bursts of filtered noise
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.sin(t * Math.PI);
      const gate = Math.random() > 0.35 ? 1 : 0;
      d[i] = (Math.random() * 2 - 1) * env * gate * 0.4;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2500;
    bp.Q.value = 0.8;
    src.connect(bp).connect(this.sfxBus);
    src.start(now);
    // Final clack as the die settles
    const clack = this.ctx.createOscillator();
    clack.type = 'triangle';
    clack.frequency.setValueAtTime(180, now + dur);
    clack.frequency.exponentialRampToValueAtTime(60, now + dur + 0.12);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0, now + dur);
    cg.gain.linearRampToValueAtTime(0.5, now + dur + 0.005);
    cg.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.15);
    clack.connect(cg).connect(this.sfxBus);
    clack.start(now + dur);
    clack.stop(now + dur + 0.2);
  }

  playMessage() {
    this.resume();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [659.25, 987.77].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      const s = now + i * 0.12;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.12, s + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, s + 0.8);
      o.connect(g).connect(this.sfxBus);
      o.start(s);
      o.stop(s + 0.9);
    });
  }

  playCombat() {
    this.resume();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Low dramatic rumble
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, now);
    o.frequency.exponentialRampToValueAtTime(35, now + 0.6);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    o.connect(lp).connect(g).connect(this.sfxBus);
    o.start(now);
    o.stop(now + 1.3);
    // Metallic clash
    const len = Math.floor(this.ctx.sampleRate * 0.25);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.15));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    const ng = this.ctx.createGain();
    ng.gain.value = 0.25;
    src.connect(hp).connect(ng).connect(this.sfxBus);
    src.start(now);
  }

  // --- Ambient music ---

  startMusic() {
    this.resume();
    if (!this.ctx || this.musicNodes || this.muted) return;
    const now = this.ctx.currentTime;
    const drone1 = this.ctx.createOscillator();
    drone1.type = 'sine';
    drone1.frequency.value = 55; // A1
    const drone2 = this.ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 82.41; // E2
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.06;
    const dg = this.ctx.createGain();
    dg.gain.value = 0.12;
    lfo.connect(lfoGain).connect(dg.gain);
    drone1.connect(dg);
    drone2.connect(dg);
    dg.connect(this.musicBus);
    drone1.start(now);
    drone2.start(now);
    lfo.start(now);
    this.musicNodes = { drone1, drone2, lfo, dg };
    this.scheduleTone();
  }

  scheduleTone() {
    this.toneTimer = setTimeout(() => {
      if (!this.ctx || !this.musicNodes || this.muted) return;
      const now = this.ctx.currentTime;
      const scale = [261.63, 311.13, 349.23, 415.30, 466.16]; // C minor pentatonic
      const f = scale[Math.floor(Math.random() * scale.length)];
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.035, now + 1.5);
      g.gain.linearRampToValueAtTime(0, now + 4);
      o.connect(g).connect(this.musicBus);
      o.start(now);
      o.stop(now + 4.5);
      this.scheduleTone();
    }, 8000 + Math.random() * 12000);
  }

  stopMusic() {
    if (!this.musicNodes) return;
    clearTimeout(this.toneTimer);
    this.toneTimer = null;
    try {
      this.musicNodes.drone1.stop();
      this.musicNodes.drone2.stop();
      this.musicNodes.lfo.stop();
    } catch (e) { /* already stopped */ }
    this.musicNodes = null;
  }
}

export const sound = new SoundEngine();