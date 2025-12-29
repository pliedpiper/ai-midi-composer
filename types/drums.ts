// Drum piece identifiers
export type DrumPiece =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'closedHiHat'
  | 'openHiHat'
  | 'crash'
  | 'ride'
  | 'highTom'
  | 'lowTom';

// A single drum hit
export interface DrumHit {
  id: string;
  drum: DrumPiece;
  time: number;      // Start time in beats (0 = bar 1 beat 1)
  velocity: number;  // 0-127
}

// A complete drum pattern
export interface DrumPattern {
  title: string;
  bpm: number;
  hits: DrumHit[];
}

// Drum pattern variation for A/B/C comparison
export interface DrumPatternVariation {
  id: string;
  pattern: DrumPattern;
  label: string;  // 'A', 'B', 'C'
}

// Drum piece metadata for UI
export interface DrumPieceInfo {
  id: DrumPiece;
  name: string;
  shortName: string;
  midiNote: number;
  color: string;
}
