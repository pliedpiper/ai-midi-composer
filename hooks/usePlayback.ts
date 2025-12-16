import { useRef, useEffect, useCallback, useState } from 'react';
import { NoteEvent } from '../types';
import { AUDIO } from '../constants';

const beatsToTransportTime = (beats: number): string => {
  const safeBeats = Number.isFinite(beats) ? Math.max(0, beats) : 0;
  let bars = Math.floor(safeBeats / 4);
  const beatRemainder = safeBeats - bars * 4;
  let quarters = Math.floor(beatRemainder);
  let sixteenths = Math.round((beatRemainder - quarters) * 4);

  if (sixteenths >= 4) {
    quarters += 1;
    sixteenths = 0;
  }
  if (quarters >= 4) {
    bars += 1;
    quarters = 0;
  }

  return `${bars}:${quarters}:${sixteenths}`;
};

// Type definitions for Tone.js objects we use
interface TonePolySynth {
  toDestination: () => TonePolySynth;
  connect: (node: ToneEffect) => TonePolySynth;
  triggerAttackRelease: (
    note: string,
    duration: string,
    time: number,
    velocity: number
  ) => void;
  dispose: () => void;
}

interface ToneEffect {
  toDestination: () => ToneEffect;
  dispose: () => void;
}

interface TonePart {
  loop: boolean;
  loopEnd: string;
  start: (time: number) => void;
  dispose: () => void;
}

interface ToneTransport {
  bpm: { value: number };
  position: number;
  start: () => void;
  stop: () => void;
}

interface ToneFrequencyFn {
  (note: number, type: string): { toNote: () => string };
}

interface ToneNamespace {
  start: () => Promise<void>;
  PolySynth: new (synth: unknown, options: unknown) => TonePolySynth;
  Synth: unknown;
  Reverb: new (decay: number) => ToneEffect;
  Part: new (
    callback: (time: number, value: ToneEventValue) => void,
    events: ToneEventValue[]
  ) => TonePart;
  Transport: ToneTransport;
  Frequency: ToneFrequencyFn;
}

interface ToneEventValue {
  time: string;
  note: string;
  duration: string;
  velocity: number;
}

interface UsePlaybackOptions {
  notes: NoteEvent[];
  bpm: number;
  onError?: (error: string) => void;
}

interface UsePlaybackReturn {
  isPlaying: boolean;
  startPlayback: () => Promise<void>;
  stopPlayback: () => void;
}

/**
 * Safely gets the Tone.js namespace from window.
 * Returns null if Tone.js is not loaded.
 */
const getTone = (): ToneNamespace | null => {
  if (typeof window !== 'undefined' && window.Tone) {
    return window.Tone as ToneNamespace;
  }
  return null;
};

export const usePlayback = ({ notes, bpm, onError }: UsePlaybackOptions): UsePlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<TonePolySynth | null>(null);
  const reverbRef = useRef<ToneEffect | null>(null);
  const partRef = useRef<TonePart | null>(null);

  // Initialize synth and effects on mount
  useEffect(() => {
    const Tone = getTone();
    if (!Tone) return;

    try {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      }).toDestination();

      reverbRef.current = new Tone.Reverb(AUDIO.REVERB_DECAY).toDestination();
      synthRef.current.connect(reverbRef.current);
    } catch (e) {
      onError?.(`Failed to initialize audio: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    return () => {
      // Dispose both synth and reverb to prevent memory leaks
      synthRef.current?.dispose();
      synthRef.current = null;
      reverbRef.current?.dispose();
      reverbRef.current = null;
    };
  }, [onError]);

  const stopPlayback = useCallback(() => {
    const Tone = getTone();
    if (Tone) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      if (partRef.current) {
        partRef.current.dispose();
        partRef.current = null;
      }
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(async () => {
    if (notes.length === 0) {
      return;
    }

    const Tone = getTone();
    if (!Tone) {
      onError?.('Audio engine not loaded. Please refresh the page.');
      return;
    }

    try {
      // Tone.start() is required for browser autoplay policy compliance
      await Tone.start();
    } catch (e) {
      onError?.(`Failed to start audio: ${e instanceof Error ? e.message : 'Browser blocked audio playback. Click anywhere and try again.'}`);
      return;
    }

    if (!synthRef.current) {
      onError?.('Synthesizer not initialized. Please refresh the page.');
      return;
    }

    try {
      if (partRef.current) {
        partRef.current.dispose();
      }

      Tone.Transport.bpm.value = bpm;

      const toneEvents: ToneEventValue[] = notes.map(n => ({
        time: beatsToTransportTime(n.startTime),
        note: Tone.Frequency(n.note, "midi").toNote(),
        duration: beatsToTransportTime(n.duration),
        velocity: n.velocity / 127
      }));

      partRef.current = new Tone.Part((time: number, value: ToneEventValue) => {
        synthRef.current?.triggerAttackRelease(
          value.note,
          value.duration,
          time,
          value.velocity
        );
      }, toneEvents);

      const endBeats = notes.reduce(
        (max, n) => Math.max(max, n.startTime + n.duration),
        0
      );

      // Enable looping
      partRef.current.loop = true;
      partRef.current.loopEnd = beatsToTransportTime(endBeats);
      partRef.current.start(0);

      Tone.Transport.start();
      setIsPlaying(true);
    } catch (e) {
      onError?.(`Playback error: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }, [notes, bpm, onError]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return { isPlaying, startPlayback, stopPlayback };
};
