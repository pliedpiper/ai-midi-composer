import { Midi } from '@tonejs/midi';
import { DrumPattern, DrumHit, DrumPiece } from '../types/drums';
import { MIDI_TO_DRUM, AUDIO } from '../constants';

const DEFAULT_BPM = 120;

// Counter for generating unique hit IDs
let hitIdCounter = 0;

const generateHitId = (): string => {
  hitIdCounter += 1;
  return `hit-${Date.now()}-${hitIdCounter}`;
};

// Valid drum MIDI note range (GM drums are typically 35-81)
const DRUM_MIDI_MIN = 35;
const DRUM_MIDI_MAX = 81;

// Get all known MIDI notes from our mapping
const KNOWN_DRUM_NOTES = Object.keys(MIDI_TO_DRUM).map(Number);

/**
 * Maps a MIDI note number to the nearest drum piece.
 * If the note is in our mapping, use it directly.
 * Otherwise, find the closest known drum note.
 */
const mapMidiNoteToDrum = (midiNote: number): DrumPiece | null => {
  // Direct mapping
  if (MIDI_TO_DRUM[midiNote]) {
    return MIDI_TO_DRUM[midiNote];
  }

  // Find closest known note
  let closestNote = KNOWN_DRUM_NOTES[0];
  let closestDistance = Math.abs(midiNote - closestNote);

  for (const knownNote of KNOWN_DRUM_NOTES) {
    const distance = Math.abs(midiNote - knownNote);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestNote = knownNote;
    }
  }

  // Only map if reasonably close (within an octave)
  if (closestDistance <= 12) {
    return MIDI_TO_DRUM[closestNote] || null;
  }

  return null;
};

/**
 * Parses a MIDI file and extracts drum hits.
 * Looks for notes on the drum channel (10) or in the drum note range.
 */
export const parseDrumMidiFile = async (file: File): Promise<DrumPattern> => {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  const hits: DrumHit[] = [];
  let detectedBpm = DEFAULT_BPM;

  // Try to get tempo from MIDI
  if (midi.header.tempos && midi.header.tempos.length > 0) {
    detectedBpm = Math.round(midi.header.tempos[0].bpm);
  }

  // Process all tracks looking for drum notes
  for (const track of midi.tracks) {
    // Check if this is a drum track (channel 10 in MIDI = channel 9 in 0-indexed)
    const isDrumChannel = track.channel === 9;

    for (const note of track.notes) {
      const midiNote = note.midi;

      // Accept notes that are either:
      // 1. On drum channel
      // 2. In drum MIDI range (35-81)
      const isDrumNote = isDrumChannel || (midiNote >= DRUM_MIDI_MIN && midiNote <= DRUM_MIDI_MAX);

      if (!isDrumNote) continue;

      // Map to our drum pieces
      const drumPiece = mapMidiNoteToDrum(midiNote);
      if (!drumPiece) continue;

      // Convert time from seconds to beats
      const timeInBeats = note.time * (detectedBpm / 60);

      // Convert velocity from 0-1 to 0-127
      const velocity = Math.round(note.velocity * 127);

      hits.push({
        id: generateHitId(),
        drum: drumPiece,
        time: Math.round(timeInBeats * 4) / 4, // Quantize to 16th notes
        velocity: Math.max(0, Math.min(127, velocity)),
      });
    }
  }

  // Sort hits by time
  hits.sort((a, b) => a.time - b.time);

  // Generate title from filename
  const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');

  return {
    title: title || 'Imported Drums',
    bpm: detectedBpm,
    hits,
  };
};
