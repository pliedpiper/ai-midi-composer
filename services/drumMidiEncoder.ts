import { DrumHit } from '../types/drums';
import { DRUM_MIDI_MAP, AUDIO } from '../constants';

const { TICKS_PER_BEAT } = AUDIO;

// MIDI drum channel is 10 (0-indexed = 9)
const DRUM_CHANNEL = 9;

// Default drum hit duration (16th note)
const DRUM_DURATION_BEATS = 0.25;

/**
 * Converts a number to a variable-length quantity (VLQ) for MIDI delta times.
 */
const toVLQ = (value: number): number[] => {
  if (value < 0) value = 0;

  const bytes: number[] = [];
  let v = value;

  bytes.push(v & 0x7f);
  v >>= 7;

  while (v > 0) {
    bytes.push((v & 0x7f) | 0x80);
    v >>= 7;
  }

  return bytes.reverse();
};

/**
 * Creates a standard MIDI file from drum hits.
 * Uses GM drum channel (10) and standard GM drum note mappings.
 */
export const createDrumMidiFile = (hits: DrumHit[], bpm: number): Blob => {
  const events: { tick: number; data: number[] }[] = [];

  // Convert hits to MIDI events
  for (const hit of hits) {
    const midiNote = DRUM_MIDI_MAP[hit.drum];
    const startTick = Math.round(hit.time * TICKS_PER_BEAT);
    const endTick = Math.round((hit.time + DRUM_DURATION_BEATS) * TICKS_PER_BEAT);

    // Note On (0x90 + channel)
    events.push({
      tick: startTick,
      data: [0x90 | DRUM_CHANNEL, midiNote, hit.velocity],
    });

    // Note Off (0x80 + channel)
    events.push({
      tick: endTick,
      data: [0x80 | DRUM_CHANNEL, midiNote, 0],
    });
  }

  // Sort events by tick
  events.sort((a, b) => a.tick - b.tick);

  // Build track data with delta times
  const trackData: number[] = [];

  // Tempo meta event: FF 51 03 <24-bit microseconds per beat>
  const microsecondsPerBeat = Math.round(60_000_000 / bpm);
  trackData.push(
    0x00, // Delta time 0
    0xff,
    0x51,
    0x03,
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff
  );

  // Add note events
  let lastTick = 0;
  for (const event of events) {
    const delta = event.tick - lastTick;
    lastTick = event.tick;

    trackData.push(...toVLQ(delta), ...event.data);
  }

  // End of track: FF 2F 00
  trackData.push(0x00, 0xff, 0x2f, 0x00);

  // Build complete MIDI file
  const headerChunk = [
    // "MThd"
    0x4d,
    0x54,
    0x68,
    0x64,
    // Header length (6)
    0x00,
    0x00,
    0x00,
    0x06,
    // Format type (0 = single track)
    0x00,
    0x00,
    // Number of tracks (1)
    0x00,
    0x01,
    // Time division (ticks per beat)
    (TICKS_PER_BEAT >> 8) & 0xff,
    TICKS_PER_BEAT & 0xff,
  ];

  const trackChunk = [
    // "MTrk"
    0x4d,
    0x54,
    0x72,
    0x6b,
    // Track length (4 bytes, big-endian)
    (trackData.length >> 24) & 0xff,
    (trackData.length >> 16) & 0xff,
    (trackData.length >> 8) & 0xff,
    trackData.length & 0xff,
    ...trackData,
  ];

  const midiData = new Uint8Array([...headerChunk, ...trackChunk]);
  return new Blob([midiData], { type: 'audio/midi' });
};

/**
 * Helper to download a blob.
 */
export const downloadDrumMidi = (hits: DrumHit[], bpm: number, filename: string): void => {
  const blob = createDrumMidiFile(hits, bpm);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mid') ? filename : `${filename}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
