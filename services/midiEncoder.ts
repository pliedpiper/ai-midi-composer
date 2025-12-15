import { NoteEvent } from '../types';

/**
 * Encodes an array of NoteEvents into a Standard MIDI File (Type 0).
 * This is a pure binary construction to avoid heavy external dependencies.
 */
export const createMidiFile = (notes: NoteEvent[], bpm: number = 120): Blob => {
  // Constants
  const TICKS_PER_BEAT = 480;
  
  // Helper: Write variable length quantity
  const writeVarInt = (value: number): number[] => {
    let buffer: number[] = [];
    let v = value;
    if (v === 0) return [0];
    while (v > 0) {
      buffer.push(v & 0x7F);
      v >>= 7;
    }
    // Reverse and set MSB for all but last byte
    buffer.reverse();
    for (let i = 0; i < buffer.length - 1; i++) {
      buffer[i] |= 0x80;
    }
    return buffer;
  };

  // Helper: Convert string to char codes
  const strToBytes = (str: string) => str.split('').map(c => c.charCodeAt(0));

  // Helper: Number to bytes (big endian)
  const numToBytes = (num: number, bytes: number) => {
    const arr = [];
    for (let i = bytes - 1; i >= 0; i--) {
      arr.push((num >> (8 * i)) & 0xFF);
    }
    return arr;
  };

  // Convert NoteEvents to MIDI Track Events (Note On / Note Off)
  interface MidiTrackEvent {
    tick: number;
    type: 'on' | 'off';
    note: number;
    velocity: number;
  }

  const events: MidiTrackEvent[] = [];
  
  notes.forEach(n => {
    const startTick = Math.round(n.startTime * TICKS_PER_BEAT);
    const endTick = Math.round((n.startTime + n.duration) * TICKS_PER_BEAT);
    
    events.push({ tick: startTick, type: 'on', note: n.note, velocity: n.velocity });
    events.push({ tick: endTick, type: 'off', note: n.note, velocity: 0 });
  });

  // Sort by time
  events.sort((a, b) => a.tick - b.tick);

  // Construct Track Data
  let trackData: number[] = [];
  let currentTick = 0;

  // Set Tempo Meta Event (Optional but good practice)
  // Microseconds per quarter note = 60,000,000 / BPM
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  trackData.push(0x00); // Delta time 0
  trackData.push(0xFF, 0x51, 0x03, ...numToBytes(microsecondsPerBeat, 3));

  events.forEach(e => {
    const delta = e.tick - currentTick;
    trackData.push(...writeVarInt(delta));
    currentTick = e.tick;

    if (e.type === 'on') {
      trackData.push(0x90, e.note, e.velocity);
    } else {
      trackData.push(0x80, e.note, 0); // Note off
    }
  });

  // End of Track Meta Event
  trackData.push(0x00, 0xFF, 0x2F, 0x00);

  // Header Chunk
  const header = [
    ...strToBytes('MThd'),
    ...numToBytes(6, 4), // Header length
    ...numToBytes(0, 2), // Format 0 (Single Track)
    ...numToBytes(1, 2), // Number of tracks (1)
    ...numToBytes(TICKS_PER_BEAT, 2) // Time division
  ];

  // Track Chunk Header
  const trackHeader = [
    ...strToBytes('MTrk'),
    ...numToBytes(trackData.length, 4)
  ];

  // Combine all
  const midiData = new Uint8Array([...header, ...trackHeader, ...trackData]);
  return new Blob([midiData], { type: 'audio/midi' });
};