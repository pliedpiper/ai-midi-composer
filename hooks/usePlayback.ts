import { useRef, useEffect, useCallback, useState } from 'react';
import { NoteEvent, FilterState } from '../types';
import { createEffectInstance, ToneEffectInstance } from '../services/audioFilters';
import { createInstrumentInstance, ToneSynthInstance } from '../services/instruments';

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
  disconnect: () => void;
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
  connect: (node: ToneEffect) => ToneEffect;
  disconnect: () => void;
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
  filterStates: FilterState[];
  instrumentId: string;
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

export const usePlayback = ({ notes, bpm, filterStates, instrumentId, onError }: UsePlaybackOptions): UsePlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<ToneSynthInstance | null>(null);
  const effectChainRef = useRef<ToneEffectInstance[]>([]);
  const partRef = useRef<TonePart | null>(null);
  const currentInstrumentRef = useRef<string>(instrumentId);

  // Rebuild effect chain when filter states change
  const rebuildEffectChain = useCallback(() => {
    const Tone = getTone();
    if (!Tone || !synthRef.current) return;

    try {
      // Disconnect synth from everything
      synthRef.current.disconnect();

      // Dispose existing effects
      effectChainRef.current.forEach(effect => {
        try {
          effect.dispose();
        } catch {
          // Ignore disposal errors
        }
      });
      effectChainRef.current = [];

      // Create new effects from enabled filters
      const enabledFilters = filterStates.filter(f => f.enabled);
      const effects: ToneEffectInstance[] = [];

      for (const filterState of enabledFilters) {
        const effect = createEffectInstance(filterState, Tone as unknown as Record<string, unknown>);
        if (effect) {
          effects.push(effect);
        }
      }

      effectChainRef.current = effects;

      // Connect chain: synth -> effect1 -> effect2 -> ... -> destination
      if (effects.length > 0) {
        synthRef.current.connect(effects[0] as unknown);
        for (let i = 0; i < effects.length - 1; i++) {
          effects[i].connect(effects[i + 1]);
        }
        effects[effects.length - 1].toDestination();
      } else {
        synthRef.current.toDestination();
      }
    } catch (e) {
      console.error('Failed to rebuild effect chain:', e);
      // Fallback: connect synth directly to destination
      try {
        synthRef.current?.toDestination();
      } catch {
        // Ignore
      }
    }
  }, [filterStates]);

  // Create or recreate synth when instrument changes
  const rebuildSynth = useCallback(() => {
    const Tone = getTone();
    if (!Tone) return;

    try {
      // Dispose old synth
      if (synthRef.current) {
        synthRef.current.disconnect();
        synthRef.current.dispose();
      }

      // Create new synth
      synthRef.current = createInstrumentInstance(instrumentId, Tone as unknown as Record<string, unknown>);
      currentInstrumentRef.current = instrumentId;

      // Rebuild effect chain to reconnect
      rebuildEffectChain();
    } catch (e) {
      console.error('Failed to create instrument:', e);
      onError?.(`Failed to create instrument: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }, [instrumentId, rebuildEffectChain, onError]);

  // Initialize synth on mount
  useEffect(() => {
    const Tone = getTone();
    if (!Tone) return;

    try {
      // Create initial synth
      synthRef.current = createInstrumentInstance(instrumentId, Tone as unknown as Record<string, unknown>);
      currentInstrumentRef.current = instrumentId;

      // Build initial effect chain
      rebuildEffectChain();
    } catch (e) {
      onError?.(`Failed to initialize audio: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    return () => {
      // Dispose synth
      synthRef.current?.dispose();
      synthRef.current = null;
      // Dispose all effects
      effectChainRef.current.forEach(effect => {
        try {
          effect.dispose();
        } catch {
          // Ignore disposal errors
        }
      });
      effectChainRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError]);

  // Rebuild synth when instrument changes
  useEffect(() => {
    if (currentInstrumentRef.current !== instrumentId) {
      rebuildSynth();
    }
  }, [instrumentId, rebuildSynth]);

  // Rebuild effect chain when filter states change
  useEffect(() => {
    rebuildEffectChain();
  }, [rebuildEffectChain]);

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
