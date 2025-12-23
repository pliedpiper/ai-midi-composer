import { NoteEvent } from '../types';

// Scale intervals (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface DetectedKey {
  root: number;         // 0-11 (C=0, C#=1, etc.)
  mode: 'major' | 'minor';
  name: string;         // e.g., "C major", "A minor"
  scaleNotes: number[]; // pitch classes in the scale (0-11)
}

/**
 * Detects the musical key from a set of notes using pitch class distribution.
 * Uses a simple scoring algorithm that rewards notes in the scale and penalizes
 * notes outside the scale.
 */
export function detectKey(notes: NoteEvent[]): DetectedKey {
  // Default to C major if no notes
  if (notes.length === 0) {
    return {
      root: 0,
      mode: 'major',
      name: 'C major',
      scaleNotes: MAJOR_SCALE,
    };
  }

  // 1. Count pitch classes (0-11), weighted by duration
  const pitchCounts = new Array(12).fill(0);
  for (const note of notes) {
    const pitchClass = note.note % 12;
    // Weight by duration so longer notes count more
    pitchCounts[pitchClass] += note.duration;
  }

  // 2. Try all 24 keys, score each
  let bestKey: { root: number; mode: 'major' | 'minor'; score: number } = {
    root: 0,
    mode: 'major',
    score: -Infinity,
  };

  for (let root = 0; root < 12; root++) {
    for (const mode of ['major', 'minor'] as const) {
      const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
      let score = 0;

      for (let i = 0; i < 12; i++) {
        // Check if pitch class i is in the scale rooted at 'root'
        const intervalFromRoot = (i - root + 12) % 12;
        const isInScale = scale.includes(intervalFromRoot);

        // Reward notes in scale, penalize notes outside
        score += isInScale ? pitchCounts[i] : -pitchCounts[i] * 0.5;

        // Extra weight for root and fifth (strong tonal anchors)
        if (intervalFromRoot === 0) score += pitchCounts[i] * 0.5; // root
        if (intervalFromRoot === 7) score += pitchCounts[i] * 0.3; // fifth
      }

      if (score > bestKey.score) {
        bestKey = { root, mode, score };
      }
    }
  }

  // 3. Build result
  const scale = bestKey.mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  return {
    root: bestKey.root,
    mode: bestKey.mode,
    name: `${NOTE_NAMES[bestKey.root]} ${bestKey.mode}`,
    scaleNotes: scale.map(interval => (bestKey.root + interval) % 12),
  };
}

/**
 * Checks if a MIDI note is in the detected key.
 */
export function isNoteInKey(midiNote: number, key: DetectedKey): boolean {
  const pitchClass = midiNote % 12;
  return key.scaleNotes.includes(pitchClass);
}

/**
 * Snaps a MIDI note to the nearest note in the detected key.
 * Returns the original note if it's already in key, otherwise
 * returns the closest scale note.
 */
export function snapToKey(midiNote: number, key: DetectedKey): number {
  const pitchClass = midiNote % 12;

  // If already in key, return as-is
  if (key.scaleNotes.includes(pitchClass)) {
    return midiNote;
  }

  // Find nearest scale note (considering wrap-around)
  let minDistance = Infinity;
  let bestDelta = 0;

  for (const scalePitch of key.scaleNotes) {
    // Calculate distance in both directions
    const upDistance = (scalePitch - pitchClass + 12) % 12;
    const downDistance = (pitchClass - scalePitch + 12) % 12;

    if (upDistance <= downDistance && upDistance < minDistance) {
      minDistance = upDistance;
      bestDelta = upDistance;
    } else if (downDistance < upDistance && downDistance < minDistance) {
      minDistance = downDistance;
      bestDelta = -downDistance;
    }
  }

  return midiNote + bestDelta;
}
