export interface NoteEvent {
  note: number;      // MIDI note number (0-127)
  velocity: number;  // 0-127
  duration: number;  // Duration in beats (e.g., 1.0 for quarter note)
  startTime: number; // Start time in beats
}

export interface Composition {
  title: string;
  bpm: number;
  notes: NoteEvent[];
}

export type PartType = 'melody' | 'chords' | 'bass';

// Tone.js global type definition since we are loading it via CDN
declare global {
  interface Window {
    Tone: any;
  }
}