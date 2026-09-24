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
    // Spatial feedback delay for ambient depth (music path only).
    this.musicDelay = this.ctx.createDelay(2.0);
    this.musicDelay.delayTime.value = 0.55;
    this.musicFeedback = this.ctx.createGain();
    this.musicFeedback.gain.value = 0.4;
    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1600;
    this.musicBus.connect(this.master);
    this.musicBus.connect(delayFilter);
    delayFilter.connect(this.musicDelay);
    this.musicDelay.connect(this.musicFeedback);
    this.musicFeedback.connect(delayFilter);
    this.musicDelay.connect(this.master);
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
  // A dark-fantasy pad: a detuned three-voice drone (root/fifth/octave) with a
  // slow filter sweep and per-voice amplitude LFOs, washed through a feedback
  // delay for spatial depth, with sparse minor-pentatonic melodic tones and
  // occasional harmony. All synthesized — no audio files.

  startMusic() {
    this.resume();
    if (!this.ctx || this.musicNodes || this.muted) return;
    const now = this.ctx.currentTime;

    // Slow filter sweep gives the drone a breathing, evolving character.
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(1300, now + 22);
    filter.frequency.linearRampToValueAtTime(450, now + 44);
    filter.Q.value = 2.5;
    const filterLfo = this.ctx.createOscillator();
    filterLfo.frequency.value = 0.022;
    const filterLfoGain = this.ctx.createGain();
    filterLfoGain.gain.value = 380;
    filterLfo.connect(filterLfoGain).connect(filter.frequency);

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.10;
    filter.connect(droneGain).connect(this.musicBus);

    const voices = [
      { freq: 55, type: 'sine', detune: 0 },      // A1 root
      { freq: 82.41, type: 'sine', detune: -5 },  // E2 fifth
      { freq: 110, type: 'triangle', detune: 6 }   // A2 octave (triangle for harmonics)
    ];
    const oscs = voices.map(v => {
      const o = this.ctx.createOscillator();
      o.type = v.type;
      o.frequency.value = v.freq;
      o.detune.value = v.detune;
      // Independent slow amplitude LFO per voice — a living, unmechanical pad.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.04 + Math.random() * 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.035;
      const vg = this.ctx.createGain();
      vg.gain.value = 0.5;
      lfo.connect(lfoGain).connect(vg.gain);
      o.connect(vg).connect(filter);
      o.start(now);
      lfo.start(now);
      return { o, lfo };
    });

    filterLfo.start(now);
    this.musicNodes = { oscs, filter, filterLfo, droneGain };
    this.scheduleTone();
  }

  scheduleTone() {
    this.toneTimer = setTimeout(() => {
      if (!this.ctx || !this.musicNodes || this.muted) return;
      const now = this.ctx.currentTime;
      // A minor pentatonic across two octaves — dark, modal, no wrong notes.
      const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
      const playTone = (freq, delay, dur, gain) => {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        const g = this.ctx.createGain();
        const s = now + delay;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(gain, s + dur * 0.25);
        g.gain.linearRampToValueAtTime(0, s + dur);
        o.connect(g).connect(this.musicBus);
        o.start(s);
        o.stop(s + dur + 0.1);
      };
      const idx = Math.floor(Math.random() * scale.length);
      playTone(scale[idx], 0, 5 + Math.random() * 3, 0.04);
      // Occasional harmony — a fourth/fifth above, ~40% of the time.
      if (Math.random() < 0.4) {
        playTone(scale[(idx + 2) % scale.length], 0.3 + Math.random() * 0.5, 4 + Math.random() * 2, 0.025);
      }
      this.scheduleTone();
    }, 5000 + Math.random() * 8000);
  }

  stopMusic() {
    if (!this.musicNodes) return;
    clearTimeout(this.toneTimer);
    this.toneTimer = null;
    try {
      this.musicNodes.oscs.forEach(({ o, lfo }) => { o.stop(); lfo.stop(); });
      this.musicNodes.filterLfo.stop();
    } catch (e) { /* already stopped */ }
    this.musicNodes = null;
  }
}

export const sound = new SoundEngine();