/**
 * Re-Birth Procedural Ambient Soundscape Engine (Web Audio API)
 * 100% Offline, Zero external assets, Zero latency, Smooth crossfades.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentMood = 'peaceful';
    this.autoDetect = true;
    this.activeNodes = [];
    this.intervalIds = [];
    this.isMuted = true;
    this.volume = 0.35;
    this.initialized = false;

    // Load persisted settings
    try {
      const storedMute = localStorage.getItem('rebirth_bgm_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }
      const storedVol = localStorage.getItem('rebirth_bgm_volume');
      if (storedVol !== null) {
        this.volume = parseFloat(storedVol) || 0.35;
      }
    } catch (e) {}
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('[AudioEngine] Web Audio not available:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('rebirth_bgm_volume', String(this.volume));
    } catch (e) {}

    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    try {
      localStorage.setItem('rebirth_bgm_muted', String(this.isMuted));
    } catch (e) {}

    this.ensureContext();

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }

    if (!this.isMuted && this.activeNodes.length === 0) {
      this.playMood(this.currentMood, true);
    }

    return this.isMuted;
  }

  // Detects ambient mood based on current scene narration, location, and weather
  detectMoodFromContext({ narration = '', location = '', weather = '', universe = '' }) {
    const text = `${narration} ${location} ${weather} ${universe}`.toLowerCase();

    // 1. High-priority: Combat / Battle
    if (
      /\b(combat|battle|attack|blade|sword|slash|strike|demon|clash|domain|explosion|shatter|curse|blood|warrior|sorcerer|spellcraft)\b/.test(
        text
      )
    ) {
      return 'combat';
    }

    // 2. Weather: Rain & Storm
    if (/\b(rain|storm|thunder|downpour|drizzle|tempest|lightning|gale)\b/.test(text)) {
      return 'rain';
    }

    // 3. Campfire / Warm Tavern / Fire
    if (/\b(campfire|hearth|tavern|inn|flame|roasted|warmth|fireplace|camp)\b/.test(text)) {
      return 'campfire';
    }

    // 4. Abyss / Cavern / Dungeon
    if (/\b(cavern|cave|dungeon|abyss|crypt|subterranean|underground|void|shadow)\b/.test(text)) {
      return 'dungeon';
    }

    // 5. Mystic Ruin / Shrine / Mana
    if (/\b(ruin|shrine|temple|altar|mana|astral|celestial|crystal|grimoire|monument)\b/.test(text)) {
      return 'mystic';
    }

    // 6. Default: Peaceful Exploration / Daylight
    return 'peaceful';
  }

  playMood(mood, force = false) {
    if (!force && mood === this.currentMood && this.activeNodes.length > 0) return;
    this.currentMood = mood;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    // Clear previous scheduled timers
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds = [];

    // Fade out old soundscape
    const oldNodes = [...this.activeNodes];
    this.activeNodes = [];

    if (oldNodes.length > 0) {
      const now = this.ctx.currentTime;
      oldNodes.forEach(({ gain, stop }) => {
        try {
          if (gain && gain.gain) gain.gain.setTargetAtTime(0.0001, now, 0.4);
          if (typeof stop === 'function') setTimeout(stop, 900);
        } catch (e) {}
      });
    }

    // Synthesize new soundscape based on chosen mood
    switch (mood) {
      case 'combat':
        this.synthesizeCombat();
        break;
      case 'rain':
        this.synthesizeRain();
        break;
      case 'campfire':
        this.synthesizeCampfire();
        break;
      case 'mystic':
        this.synthesizeMystic();
        break;
      case 'dungeon':
        this.synthesizeDungeon();
        break;
      case 'peaceful':
      default:
        this.synthesizePeaceful();
        break;
    }
  }

  // 1. Peaceful Exploration: Warm harmonic pad + gentle breeze
  synthesizePeaceful() {
    const now = this.ctx.currentTime;
    const moodGain = this.ctx.createGain();
    moodGain.gain.setValueAtTime(0.001, now);
    moodGain.gain.setTargetAtTime(0.3, now, 1.2);
    moodGain.connect(this.masterGain);

    const freqs = [220, 277.18, 329.63, 440]; // A Major gentle chord
    const oscs = [];

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle slow vibrato LFO
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2 + i * 0.05, now);
      lfoGain.gain.setValueAtTime(1.5, now);
      lfo.connect(osc.frequency);
      lfo.start();

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.12 / freqs.length, now);

      osc.connect(noteGain);
      noteGain.connect(moodGain);
      osc.start();

      oscs.push(osc, lfo);
    });

    this.activeNodes.push({
      gain: moodGain,
      stop: () => oscs.forEach((o) => { try { o.stop(); } catch (e) {} }),
    });
  }

  // 2. Mystic Ruin / Mana Resonance: Ethereal detuned celestial chorus
  synthesizeMystic() {
    const now = this.ctx.currentTime;
    const moodGain = this.ctx.createGain();
    moodGain.gain.setValueAtTime(0.001, now);
    moodGain.gain.setTargetAtTime(0.35, now, 1.5);
    moodGain.connect(this.masterGain);

    const notes = [196, 246.94, 293.66, 392, 493.88]; // G Major Pentatonic shimmer
    const oscs = [];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (i % 2 === 0 ? 0.8 : -0.8), now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.15 / notes.length, now);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(moodGain);
      osc.start();
      oscs.push(osc);
    });

    this.activeNodes.push({
      gain: moodGain,
      stop: () => oscs.forEach((o) => { try { o.stop(); } catch (e) {} }),
    });
  }

  // 3. Combat Tension: Pulse heartbeat + driving low tension drone
  synthesizeCombat() {
    const now = this.ctx.currentTime;
    const moodGain = this.ctx.createGain();
    moodGain.gain.setValueAtTime(0.001, now);
    moodGain.gain.setTargetAtTime(0.4, now, 0.6);
    moodGain.connect(this.masterGain);

    // Low tension dissonance drone
    const bassOsc1 = this.ctx.createOscillator();
    const bassOsc2 = this.ctx.createOscillator();
    bassOsc1.type = 'sawtooth';
    bassOsc2.type = 'sawtooth';
    bassOsc1.frequency.setValueAtTime(73.42, now); // D2
    bassOsc2.frequency.setValueAtTime(77.78, now); // D#2 tension clash

    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(260, now);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.12, now);

    bassOsc1.connect(bassFilter);
    bassOsc2.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(moodGain);

    bassOsc1.start();
    bassOsc2.start();

    // Rhythmic war pulse (110 BPM heartbeat thump)
    const pulseInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      try {
        const t = this.ctx.currentTime;
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(110, t);
        kick.frequency.exponentialRampToValueAtTime(38, t + 0.12);

        kickGain.gain.setValueAtTime(0.18, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        kick.connect(kickGain);
        kickGain.connect(moodGain);

        kick.start(t);
        kick.stop(t + 0.28);
      } catch (e) {}
    }, 545);

    this.intervalIds.push(pulseInterval);

    this.activeNodes.push({
      gain: moodGain,
      stop: () => {
        try { bassOsc1.stop(); bassOsc2.stop(); } catch (e) {}
      },
    });
  }

  // 4. Campfire & Tavern Warmth: Warm low drone + crackling pops
  synthesizeCampfire() {
    const now = this.ctx.currentTime;
    const moodGain = this.ctx.createGain();
    moodGain.gain.setValueAtTime(0.001, now);
    moodGain.gain.setTargetAtTime(0.3, now, 1.0);
    moodGain.connect(this.masterGain);

    // Warm chord drone
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130.81, now); // C3 warm root
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    const warmGain = this.ctx.createGain();
    warmGain.gain.setValueAtTime(0.15, now);

    osc.connect(filter);
    filter.connect(warmGain);
    warmGain.connect(moodGain);
    osc.start();

    // Crackling ember sparks (random impulses)
    const crackleInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || Math.random() > 0.45) return;
      try {
        const t = this.ctx.currentTime;
        const pop = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        pop.type = 'triangle';
        pop.frequency.setValueAtTime(800 + Math.random() * 1400, t);

        popGain.gain.setValueAtTime(0.04 + Math.random() * 0.05, t);
        popGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

        pop.connect(popGain);
        popGain.connect(moodGain);
        pop.start(t);
        pop.stop(t + 0.05);
      } catch (e) {}
    }, 180);

    this.intervalIds.push(crackleInterval);

    this.activeNodes.push({
      gain: moodGain,
      stop: () => { try { osc.stop(); } catch (e) {} },
    });
  }

  // 5. Rain & Wind: Pink noise filter sweep
  synthesizeRain() {
    const now = this.ctx.currentTime;
    const moodGain = this.ctx.createGain();
    moodGain.gain.setValueAtTime(0.001, now);
    moodGain.gain.setTargetAtTime(0.28, now, 1.2);
    moodGain.connect(this.masterGain);

    // Procedural noise buffer (2 seconds loop)
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish noise filter
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    noiseSource.connect(filter);
    filter.connect(moodGain);
    noiseSource.start();

    this.activeNodes.push({
      gain: moodGain,
      stop: () => { try { noiseSource.stop(); } catch (e) {} },
    });
  }

  // 6. Dungeon Abyss: Deep sub-bass cavern drone
  synthesizeDungeon() {
    const now = this.ctx.currentTime;
    const moodGain = this.ctx.createGain();
    moodGain.gain.setValueAtTime(0.001, now);
    moodGain.gain.setTargetAtTime(0.35, now, 1.5);
    moodGain.connect(this.masterGain);

    const bass = this.ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(55, now); // A1 sub-bass

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.25, now);

    bass.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(moodGain);
    bass.start();

    this.activeNodes.push({
      gain: moodGain,
      stop: () => { try { bass.stop(); } catch (e) {} },
    });
  }
}

export const audioEngine = new AudioEngine();
