import { NoteEvent, FilterState } from '../types';
import { EFFECTS } from '../constants';
import { createEffectInstance, ToneEffectInstance } from './audioFilters';
import { createInstrumentInstance, ToneSynthInstance } from './instruments';

// Type definitions for Tone.js offline rendering
interface ToneOfflineContext {
  transport: {
    bpm: { value: number };
    start: (time: number) => void;
  };
}

interface TonePolySynthOffline {
  connect: (node: ToneEffectInstance) => void;
  toDestination: () => void;
  triggerAttackRelease: (
    note: string,
    duration: number,
    time: number,
    velocity: number
  ) => void;
  dispose: () => void;
}

interface ToneNamespaceExtended {
  Offline: (
    callback: (context: ToneOfflineContext) => void,
    duration: number
  ) => Promise<AudioBuffer>;
  PolySynth: new (synth: unknown, options: unknown) => TonePolySynthOffline;
  Synth: unknown;
  Frequency: (note: number, type: string) => { toNote: () => string };
}

// Helper to convert beats to seconds
const beatsToSeconds = (beats: number, bpm: number): number => {
  return (beats / bpm) * 60;
};

// Helper to write a string to a DataView
const writeString = (view: DataView, offset: number, str: string): void => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

// Convert AudioBuffer to WAV Blob
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;

  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true); // audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Get channel data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  // Interleave and write samples
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      // Clamp sample to [-1, 1] and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, Math.round(intSample), true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

interface ExportToWavOptions {
  notes: NoteEvent[];
  bpm: number;
  filterStates: FilterState[];
  instrumentId: string;
  onProgress?: (percent: number) => void;
}

/**
 * Export composition to WAV file using Tone.js offline rendering.
 * This renders the audio faster than real-time without needing playback.
 */
export const exportToWav = async (options: ExportToWavOptions): Promise<Blob> => {
  const { notes, bpm, filterStates, instrumentId } = options;

  // Get Tone.js from window
  const Tone = (window as unknown as { Tone: ToneNamespaceExtended }).Tone;
  if (!Tone) {
    throw new Error('Audio engine not loaded. Please refresh the page.');
  }

  if (notes.length === 0) {
    throw new Error('No notes to export.');
  }

  // Calculate duration: find the end of the last note + tail for effects
  const endBeats = notes.reduce(
    (max, n) => Math.max(max, n.startTime + n.duration),
    0
  );
  const durationSeconds = beatsToSeconds(endBeats, bpm) + EFFECTS.EXPORT_TAIL_SECONDS;

  // Render audio offline
  const audioBuffer = await Tone.Offline((context: ToneOfflineContext) => {
    // Create synth based on selected instrument
    const synth = createInstrumentInstance(instrumentId, Tone as unknown as Record<string, unknown>);
    if (!synth) {
      throw new Error(`Failed to create instrument: ${instrumentId}`);
    }

    // Build effect chain from enabled filters
    const enabledFilters = filterStates.filter(f => f.enabled);
    const effects: ToneEffectInstance[] = [];

    for (const filterState of enabledFilters) {
      const effect = createEffectInstance(filterState, Tone as unknown as Record<string, unknown>);
      if (effect) {
        effects.push(effect);
      }
    }

    // Connect chain: synth -> effects -> destination
    if (effects.length > 0) {
      synth.connect(effects[0]);
      for (let i = 0; i < effects.length - 1; i++) {
        effects[i].connect(effects[i + 1]);
      }
      effects[effects.length - 1].toDestination();
    } else {
      synth.toDestination();
    }

    // Set BPM
    context.transport.bpm.value = bpm;

    // Schedule all notes
    for (const n of notes) {
      const time = beatsToSeconds(n.startTime, bpm);
      const duration = beatsToSeconds(n.duration, bpm);
      const noteName = Tone.Frequency(n.note, 'midi').toNote();
      const velocity = n.velocity / 127;

      synth.triggerAttackRelease(noteName, duration, time, velocity);
    }

    // Start transport
    context.transport.start(0);
  }, durationSeconds);

  // Convert AudioBuffer to WAV
  return audioBufferToWav(audioBuffer);
};

/**
 * Download a Blob as a file.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
