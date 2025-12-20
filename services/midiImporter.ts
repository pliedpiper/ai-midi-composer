import { Midi } from '@tonejs/midi';
import { Composition, NoteEvent } from '../types';
import { AUDIO, MIDI as MIDI_CONSTANTS } from '../constants';

/**
 * Parses a MIDI file and converts it to the app's Composition format.
 * All tracks are merged into a single composition.
 */
export const parseMidiFile = async (file: File): Promise<Composition> => {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  // Extract BPM from tempo track (use first tempo event, or default)
  let bpm: number = AUDIO.DEFAULT_BPM;
  if (midi.header.tempos.length > 0) {
    bpm = Math.round(midi.header.tempos[0].bpm);
    // Clamp BPM to reasonable range
    bpm = Math.max(20, Math.min(bpm, AUDIO.MAX_BPM));
  }

  // Merge all tracks into a single NoteEvent array
  const notes: NoteEvent[] = [];
  let noteIdCounter = 0;

  for (const track of midi.tracks) {
    for (const note of track.notes) {
      // Validate and clamp MIDI note number
      const midiNote = Math.max(
        MIDI_CONSTANTS.MIN_NOTE,
        Math.min(note.midi, MIDI_CONSTANTS.MAX_NOTE)
      );

      // Convert velocity (0-1 in @tonejs/midi) to 0-127
      const velocity = Math.round(
        Math.max(
          MIDI_CONSTANTS.MIN_VELOCITY,
          Math.min(note.velocity * 127, MIDI_CONSTANTS.MAX_VELOCITY)
        )
      );

      // Duration and time are already in beats
      const duration = Math.max(0.0625, note.duration); // Minimum 1/16 note
      const startTime = Math.max(0, note.time);

      notes.push({
        id: `imported-${noteIdCounter++}`,
        note: midiNote,
        velocity,
        duration,
        startTime,
      });
    }
  }

  // Sort notes by start time for consistent playback
  notes.sort((a, b) => a.startTime - b.startTime);

  // Generate title from filename (remove extension)
  const title = file.name.replace(/\.(mid|midi)$/i, '').replace(/_/g, ' ');

  if (notes.length === 0) {
    throw new Error('No notes found in MIDI file');
  }

  return {
    title,
    bpm,
    notes,
  };
};
