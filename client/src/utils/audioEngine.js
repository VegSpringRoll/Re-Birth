/**
 * Re-Birth Scene-Adaptive BGM Engine powered by FreeToUse (https://freetouse.com/api)
 * Streams royalty-free, human-created music matching the current anime scene context.
 * Directly listens to AI Director's sceneMood and musicTrackQuery for precision scoring.
 */

class AudioEngine {
  constructor() {
    this.audioElement = null;
    this.currentTrack = null;
    this.playlist = [];
    this.currentMood = 'peaceful';
    this.aiSceneMood = '';
    this.currentQuery = '';
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

      // When the track ends, automatically advance to next random track in current mood
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
          aiSceneMood: this.aiSceneMood,
          currentQuery: this.currentQuery,
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
   * Normalizes arbitrary AI mood descriptions into core music presets
   */
  normalizeMood(str) {
    if (!str || typeof str !== 'string') return 'peaceful';
    const s = str.toLowerCase();

    if (/(combat|battle|fight|clash|attack|war|strike|action|epic|explosion)/.test(s)) return 'combat';
    if (/(comedy|funny|humor|laugh|joke|bicker|quirky|playful|ridiculous)/.test(s)) return 'comedy';
    if (/(tension|standoff|danger|threat|stalk|suspense|dark|shadow|dread)/.test(s)) return 'tension';
    if (/(rain|sad|melancholy|cry|grief|sorrow|tear|loss|depress)/.test(s)) return 'rain';
    if (/(tavern|inn|festival|celebrat|party|drinking|feast|cheerful)/.test(s)) return 'tavern';
    if (/(campfire|hearth|warmth|cozy|rest|peace|relax|calm|quiet)/.test(s)) return 'campfire';
    if (/(mystic|magic|fantasy|ruin|shrine|mana|spell|ethereal|sacred)/.test(s)) return 'mystic';
    if (/(dungeon|cavern|crypt|abyss|underground|void|horror)/.test(s)) return 'dungeon';
    if (/(romantic|love|kiss|gentle|sweet|date|blush)/.test(s)) return 'romantic';
    if (/(triumphant|victory|heroic|glory|proud)/.test(s)) return 'triumphant';

    return 'peaceful';
  }

  /**
   * Detects ambient mood based on AI sceneMood/musicTrackQuery, or fallback prose
   */
  detectMoodFromContext({ sceneMood = '', musicTrackQuery = '', narration = '', location = '', weather = '', universe = '' } = {}) {
    // 1. If AI explicitly specified musicTrackQuery or sceneMood in <state_update>, honor it with highest priority!
    if (musicTrackQuery && typeof musicTrackQuery === 'string' && musicTrackQuery.trim()) {
      const q = musicTrackQuery.trim();
      const mood = this.normalizeMood(sceneMood || q);
      return {
        mood,
        query: q,
        description: sceneMood || q,
        fromAI: true,
      };
    }

    if (sceneMood && typeof sceneMood === 'string' && sceneMood.trim()) {
      const desc = sceneMood.trim();
      const mood = this.normalizeMood(desc);
      return {
        mood,
        query: desc,
        description: desc,
        fromAI: true,
      };
    }

    // 2. Prose heuristic fallback
    const text = `${narration} ${location} ${weather} ${universe}`.toLowerCase();

    if (/\b(combat|battle|attack|blade|sword|slash|strike|demon|clash|domain|explosion|shatter|curse|blood|warrior|sorcerer|spellcraft|kill|destroy|fight)\b/.test(text)) {
      return { mood: 'combat', query: 'action battle', description: 'Intense Combat & Action', fromAI: false };
    }
    if (/\b(comedy|funny|laugh|bicker|idiot|stupid|screaming|tantrum|absurd|ridiculous)\b/.test(text)) {
      return { mood: 'comedy', query: 'funny quirky acoustic', description: 'Comedic Banter', fromAI: false };
    }
    if (/\b(rain|storm|thunder|downpour|drizzle|tempest|lightning|gale|tears|grief|sorrow|mourn)\b/.test(text)) {
      return { mood: 'rain', query: 'sad piano emotional', description: 'Rain & Melancholy', fromAI: false };
    }
    if (/\b(campfire|hearth|tavern|inn|flame|roasted|warmth|fireplace|camp|rest|ale|drink|feast)\b/.test(text)) {
      return { mood: 'campfire', query: 'acoustic folk guitar', description: 'Campfire & Hearth', fromAI: false };
    }
    if (/\b(cavern|cave|dungeon|abyss|crypt|subterranean|underground|void|shadow|tomb|dread)\b/.test(text)) {
      return { mood: 'dungeon', query: 'dark ambient suspense', description: 'Abyss & Crypt', fromAI: false };
    }
    if (/\b(ruin|shrine|temple|altar|mana|astral|celestial|crystal|grimoire|monument|sacred|sanctuary)\b/.test(text)) {
      return { mood: 'mystic', query: 'fantasy orchestral ambient', description: 'Mystic & Sacred', fromAI: false };
    }

    return { mood: 'peaceful', query: 'lofi chill ambient', description: 'Peaceful Atmosphere', fromAI: false };
  }

  /**
   * Fetches tracks from FreeToUse API matching the given mood and query
   */
  async fetchFreeToUseTracks(mood, customQuery = '') {
    try {
      this.isLoading = true;
      this.notifyTrackChange();

      const queryParam = (customQuery || '').trim();
      const url = queryParam
        ? `/api/bgm/search?query=${encodeURIComponent(queryParam)}&mood=${encodeURIComponent(mood)}&limit=15`
        : `/api/bgm/search?mood=${encodeURIComponent(mood)}&limit=15`;

      let res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
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
          comedy: 'quirky',
          tension: 'tension',
          tavern: 'folk',
          romantic: 'romantic',
          triumphant: 'epic',
        };
        const q = queryParam || fallbackQueries[mood] || 'cinematic';
        res = await fetch(`https://api.freetouse.com/v3/music/tracks/search?query=${encodeURIComponent(q)}&limit=10&order=random`, {
          signal: AbortSignal.timeout(6000),
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
            artist: t.artist || t.artists?.[0]?.[1]?.name || t.artists?.[0]?.name || 'FreeToUse Music',
            genre: t.genre || 'Cinematic',
            category: t.category || t.categories?.[0]?.[1]?.name || 'Soundtrack',
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
   * Plays a specific FreeToUse track with smooth crossfade
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
          await new Promise((r) => setTimeout(r, 25));
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
        await new Promise((r) => setTimeout(r, 35));
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
      await this.fetchFreeToUseTracks(this.currentMood, this.currentQuery);
    }

    if (this.playlist.length > 0) {
      const available = this.playlist.filter((t) => t.id !== this.currentTrack?.id);
      const chosen = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : this.playlist[0];
      await this.playTrack(chosen);
    }
  }

  /**
   * Switches to a new scene mood, fetching fresh FreeToUse tracks if needed
   */
  async playMood(mood, force = false, customQuery = '', aiDescription = '') {
    const isSame = !force && mood === this.currentMood && (!customQuery || customQuery === this.currentQuery) && this.currentTrack && !this.audioElement?.paused;
    if (isSame) {
      return;
    }

    this.currentMood = mood;
    this.currentQuery = customQuery;
    if (aiDescription) {
      this.aiSceneMood = aiDescription;
    }

    const tracks = await this.fetchFreeToUseTracks(mood, customQuery);
    if (tracks && tracks.length > 0) {
      const chosen = tracks[Math.floor(Math.random() * tracks.length)];
      await this.playTrack(chosen);
    }
  }
}

export const audioEngine = new AudioEngine();
