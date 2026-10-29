/**
 * Re-Birth Scene-Adaptive BGM Engine powered by FreeToUse (https://freetouse.com/api)
 * Streams royalty-free, human-created music matching the current anime scene context.
 */

class AudioEngine {
  constructor() {
    this.audioElement = null;
    this.currentTrack = null;
    this.playlist = [];
    this.currentMood = 'peaceful';
    this.isMuted = true;
    this.volume = 0.35;
    this.isLoading = false;
    this.listeners = new Set();
    this.fadeInterval = null;

    // Load persisted settings
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedMute = localStorage.getItem('rebirth_bgm_muted');
        if (storedMute !== null) {
          this.isMuted = storedMute === 'true';
        }
        const storedVol = localStorage.getItem('rebirth_bgm_volume');
        if (storedVol !== null) {
          this.volume = Math.max(0, Math.min(1, parseFloat(storedVol) || 0.35));
        }
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  initAudioElement() {
    if (this.audioElement) return;
    try {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      this.audioElement.volume = this.isMuted ? 0 : this.volume;

      // When the track ends, automatically pick and play another random track from current mood
      this.audioElement.addEventListener('ended', () => {
        this.nextTrack();
      });

      // Handle loading/stream errors gracefully by trying the next track
      this.audioElement.addEventListener('error', (err) => {
        console.warn('[AudioEngine] Track playback error, skipping to next track:', err);
        if (!this.isMuted) {
          setTimeout(() => this.nextTrack(), 1500);
        }
      });
    } catch (e) {
      console.warn('[AudioEngine] HTML5 Audio initialization error:', e);
    }
  }

  onTrackChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyTrackChange() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentTrack, {
          isMuted: this.isMuted,
          volume: this.volume,
          mood: this.currentMood,
          isLoading: this.isLoading,
        });
      } catch (e) {}
    });
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rebirth_bgm_volume', String(this.volume));
      }
    } catch (e) {}

    if (this.audioElement && !this.isMuted) {
      this.audioElement.volume = this.volume;
    }
    this.notifyTrackChange();
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rebirth_bgm_muted', String(this.isMuted));
      }
    } catch (e) {}

    if (!this.audioElement) {
      this.initAudioElement();
    }

    if (this.audioElement) {
      if (this.isMuted) {
        this.audioElement.volume = 0;
        this.audioElement.pause();
      } else {
        this.audioElement.volume = this.volume;
        if (this.currentTrack?.audioUrl) {
          this.audioElement.play().catch((e) => console.warn('[AudioEngine] Play failed:', e));
        } else {
          this.playMood(this.currentMood, true);
        }
      }
    }

    this.notifyTrackChange();
    return this.isMuted;
  }

  /**
   * Detects ambient mood based on current scene narration, location, and weather
   */
  detectMoodFromContext({ narration = '', location = '', weather = '', universe = '' } = {}) {
    const text = `${narration} ${location} ${weather} ${universe}`.toLowerCase();

    // 1. High-priority: Combat / Battle / Action
    if (
      /\b(combat|battle|attack|blade|sword|slash|strike|demon|clash|domain|explosion|shatter|curse|blood|warrior|sorcerer|spellcraft|kill|destroy|fight)\b/.test(
        text
      )
    ) {
      return 'combat';
    }

    // 2. Weather: Rain, Storm, Melancholy
    if (/\b(rain|storm|thunder|downpour|drizzle|tempest|lightning|gale|tears|grief|sorrow)\b/.test(text)) {
      return 'rain';
    }

    // 3. Campfire / Warm Tavern / Fireplace
    if (/\b(campfire|hearth|tavern|inn|flame|roasted|warmth|fireplace|camp|rest|ale|drink)\b/.test(text)) {
      return 'campfire';
    }

    // 4. Abyss / Cavern / Dungeon
    if (/\b(cavern|cave|dungeon|abyss|crypt|subterranean|underground|void|shadow|tomb|dread)\b/.test(text)) {
      return 'dungeon';
    }

    // 5. Mystic Ruin / Shrine / Mana / Temple
    if (/\b(ruin|shrine|temple|altar|mana|astral|celestial|crystal|grimoire|monument|sacred|sanctuary)\b/.test(text)) {
      return 'mystic';
    }

    // 6. Default: Peaceful Exploration / Town / Academy
    return 'peaceful';
  }

  /**
   * Fetches tracks from FreeToUse API matching the given mood
   */
  async fetchFreeToUseTracks(mood) {
    try {
      this.isLoading = true;
      this.notifyTrackChange();

      // First try internal server proxy which caches and deduplicates
      let res = await fetch(`/api/bgm/search?mood=${encodeURIComponent(mood)}&limit=15`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        // Direct client fallback to FreeToUse API v3
        const fallbackQueries = {
          combat: 'action',
          peaceful: 'lofi',
          mystic: 'fantasy',
          dungeon: 'dark',
          rain: 'melancholy',
          campfire: 'acoustic',
        };
        const query = fallbackQueries[mood] || 'cinematic';
        res = await fetch(`https://api.freetouse.com/v3/music/tracks/search?query=${encodeURIComponent(query)}&limit=10&order=random`, {
          signal: AbortSignal.timeout(5000),
        });
      }

      if (res.ok) {
        const json = await res.json();
        const rawTracks = json.tracks || json.data || [];
        const normalized = rawTracks
          .filter((t) => (t.audioUrl || t.files?.mp3))
          .map((t) => ({
            id: t.id,
            title: t.title || 'Scene Soundtrack',
            artist: t.artist || t.artists?.[0]?.[1]?.name || 'FreeToUse Music',
            genre: t.genre || 'Cinematic',
            category: t.category || 'Soundtrack',
            duration: t.duration ? Math.round(t.duration) : 120,
            thumbnail: t.thumbnail || t.thumbnails?.sm || t.thumbnails?.md || '',
            audioUrl: t.audioUrl || t.files?.mp3,
          }));

        if (normalized.length > 0) {
          // Shuffle playlist
          this.playlist = normalized.sort(() => 0.5 - Math.random());
          return this.playlist;
        }
      }
    } catch (err) {
      console.warn('[AudioEngine] FreeToUse fetch error:', err.message);
    } finally {
      this.isLoading = false;
      this.notifyTrackChange();
    }

    return this.playlist;
  }

  /**
   * Plays a specific FreeToUse track with volume fade-in
   */
  async playTrack(track) {
    if (!track?.audioUrl) return;
    this.initAudioElement();
    this.currentTrack = track;
    this.notifyTrackChange();

    if (this.isMuted) return;

    try {
      // Fade out old track
      if (this.audioElement.src && !this.audioElement.paused) {
        let curVol = this.audioElement.volume;
        while (curVol > 0.05) {
          curVol -= 0.05;
          this.audioElement.volume = Math.max(0, curVol);
          await new Promise((r) => setTimeout(r, 30));
        }
      }

      this.audioElement.src = track.audioUrl;
      this.audioElement.volume = 0;
      await this.audioElement.play();

      // Smooth fade-in
      let targetVol = this.volume;
      let cur = 0;
      const step = targetVol / 10;
      while (cur < targetVol && !this.isMuted) {
        cur = Math.min(targetVol, cur + step);
        this.audioElement.volume = cur;
        await new Promise((r) => setTimeout(r, 40));
      }
    } catch (err) {
      console.warn('[AudioEngine] Playback failed (browser policy or network):', err);
    }
  }

  /**
   * Advances to the next random track from the current mood playlist
   */
  async nextTrack() {
    if (this.playlist.length === 0) {
      await this.fetchFreeToUseTracks(this.currentMood);
    }

    if (this.playlist.length > 0) {
      // Pick next track different from current
      const available = this.playlist.filter((t) => t.id !== this.currentTrack?.id);
      const chosen = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : this.playlist[0];
      await this.playTrack(chosen);
    }
  }

  /**
   * Switches to a new scene mood, fetching fresh FreeToUse tracks if needed
   */
  async playMood(mood, force = false) {
    if (!force && mood === this.currentMood && this.currentTrack && !this.audioElement?.paused) {
      return;
    }

    this.currentMood = mood;
    const tracks = await this.fetchFreeToUseTracks(mood);
    if (tracks && tracks.length > 0) {
      const chosen = tracks[Math.floor(Math.random() * tracks.length)];
      await this.playTrack(chosen);
    }
  }
}

export const audioEngine = new AudioEngine();
