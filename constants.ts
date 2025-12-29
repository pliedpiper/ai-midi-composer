import type { DrumPiece, DrumPieceInfo } from './types/drums';

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

// Effects Constants
export const EFFECTS = {
  // Extra time added to WAV export for reverb/delay tails
  EXPORT_TAIL_SECONDS: 2,
  // Sample rate for WAV export
  EXPORT_SAMPLE_RATE: 44100,
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

// Drum Constants

// General MIDI Drum Note Mapping
export const DRUM_MIDI_MAP: Record<DrumPiece, number> = {
  kick: 36,
  snare: 38,
  clap: 39,
  closedHiHat: 42,
  openHiHat: 46,
  crash: 49,
  ride: 51,
  highTom: 50,
  lowTom: 45,
} as const;

// Reverse mapping for MIDI import
export const MIDI_TO_DRUM: Record<number, DrumPiece> = {
  36: 'kick',
  35: 'kick',      // Acoustic Bass Drum -> Kick
  38: 'snare',
  40: 'snare',     // Electric Snare -> Snare
  39: 'clap',
  42: 'closedHiHat',
  44: 'closedHiHat', // Pedal Hi-Hat -> Closed
  46: 'openHiHat',
  49: 'crash',
  57: 'crash',     // Crash 2 -> Crash
  51: 'ride',
  59: 'ride',      // Ride 2 -> Ride
  50: 'highTom',
  48: 'highTom',   // Hi-Mid Tom -> High Tom
  45: 'lowTom',
  47: 'lowTom',    // Low-Mid Tom -> Low Tom
  43: 'lowTom',    // High Floor Tom -> Low Tom
  41: 'lowTom',    // Low Floor Tom -> Low Tom
} as const;

// Color for each drum piece (for lane visualization)
export const DRUM_COLORS: Record<DrumPiece, string> = {
  kick: '#ef4444',        // red
  snare: '#f97316',       // orange
  clap: '#eab308',        // yellow
  closedHiHat: '#06b6d4', // cyan
  openHiHat: '#14b8a6',   // teal
  crash: '#a855f7',       // purple
  ride: '#3b82f6',        // blue
  highTom: '#ec4899',     // pink
  lowTom: '#92400e',      // brown
} as const;

// Order of drum lanes (top to bottom in UI)
export const DRUM_ORDER: DrumPiece[] = [
  'crash',
  'ride',
  'openHiHat',
  'closedHiHat',
  'highTom',
  'lowTom',
  'snare',
  'clap',
  'kick',
] as const;

// Full drum piece info for UI
export const DRUM_PIECES: DrumPieceInfo[] = [
  { id: 'crash', name: 'Crash', shortName: 'CRS', midiNote: 49, color: '#a855f7' },
  { id: 'ride', name: 'Ride', shortName: 'RDE', midiNote: 51, color: '#3b82f6' },
  { id: 'openHiHat', name: 'Open Hi-Hat', shortName: 'OHH', midiNote: 46, color: '#14b8a6' },
  { id: 'closedHiHat', name: 'Closed Hi-Hat', shortName: 'CHH', midiNote: 42, color: '#06b6d4' },
  { id: 'highTom', name: 'High Tom', shortName: 'HT', midiNote: 50, color: '#ec4899' },
  { id: 'lowTom', name: 'Low Tom', shortName: 'LT', midiNote: 45, color: '#92400e' },
  { id: 'snare', name: 'Snare', shortName: 'SNR', midiNote: 38, color: '#f97316' },
  { id: 'clap', name: 'Clap', shortName: 'CLP', midiNote: 39, color: '#eab308' },
  { id: 'kick', name: 'Kick', shortName: 'KCK', midiNote: 36, color: '#ef4444' },
] as const;

// Drum lane view constants
export const DRUM_LANE = {
  LANE_HEIGHT: 32,
  CELL_WIDTH: 20,       // Width per 16th note
  CELLS_PER_BEAT: 4,    // 16th note resolution
  CELLS_PER_BAR: 16,    // 16 cells = 1 bar (4/4 time)
  LABEL_WIDTH: 80,      // Width of lane labels
  DEFAULT_VELOCITY: 100,
} as const;
