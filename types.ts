export interface NoteEvent {
  id: string;        // Unique identifier for React keys
  note: number;      // MIDI note number (21-108)
  velocity: number;  // 0-127
  duration: number;  // Duration in beats (e.g., 1.0 for quarter note)
  startTime: number; // Start time in beats
  partType?: PartType; // Track which part this note belongs to
}

export interface Composition {
  title: string;
  bpm: number;
  notes: NoteEvent[];
}

export type PartType = 'melody' | 'chords' | 'bass';

// Bar count options for length control
export type BarCount = 4 | 8 | 16 | 32;

// Composition variation for side-by-side comparison
export interface CompositionVariation {
  id: string;
  composition: Composition;
  label: string; // "A", "B", "C"
}

// Style preset for style transfer
export interface StylePreset {
  id: string;
  label: string;
  prompt: string;
}

// Tone.js global type definition since we are loading it via CDN
declare global {
  interface Window {
    Tone: unknown;
  }
}
