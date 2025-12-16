// MIDI Constants
export const MIDI = {
  MIN_NOTE: 21,      // A0 - lowest piano note
  MAX_NOTE: 108,     // C8 - highest piano note
  MIN_VELOCITY: 0,
  MAX_VELOCITY: 127,
} as const;

// Piano Roll Display Constants
export const PIANO_ROLL = {
  NOTE_HEIGHT: 10,
  BEAT_WIDTH: 32,
  MIN_NOTE: 36,      // C2 - lowest displayed note
  MAX_NOTE: 96,      // C7 - highest displayed note
  DEFAULT_MAX_TIME: 16,
  DEFAULT_DURATION: 8,
} as const;

// Audio Constants
export const AUDIO = {
  TICKS_PER_BEAT: 480,
  REVERB_DECAY: 2,
  DEFAULT_BPM: 120,
  MAX_BPM: 300,
} as const;

// API Constants
export const API = {
  TIMEOUT_MS: 120000, // 2 minutes - complex operations like variations need more time
  PROXY_URL: '/api/chat/completions',
} as const;

// Generation Constants
export const GENERATION = {
  DEFAULT_BAR_COUNT: 8,
  BAR_COUNT_OPTIONS: [4, 8, 16, 32] as const,
  BEATS_PER_BAR: 4,
  DEFAULT_VARIATION_COUNT: 3,
  STYLE_PRESETS: [
    { id: 'jazzy', label: 'Jazzy', prompt: 'Add jazz elements with swing rhythms, blue notes, and extended chord voicings' },
    { id: 'classical', label: 'Classical', prompt: 'Transform into a classical style with clear voice leading and traditional harmony' },
    { id: 'syncopated', label: 'Syncopated', prompt: 'Add syncopation with off-beat accents and rhythmic displacement' },
    { id: 'minimalist', label: 'Minimalist', prompt: 'Simplify to minimalist style with repetitive patterns and gradual changes' },
    { id: 'dramatic', label: 'Dramatic', prompt: 'Add dramatic elements with dynamic contrasts and tension-building passages' },
  ],
} as const;
