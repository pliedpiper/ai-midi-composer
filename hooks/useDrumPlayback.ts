import { useRef, useEffect, useCallback, useState } from 'react';
import { DrumHit } from '../types/drums';
import { FilterState } from '../types';
import { createEffectInstance, ToneEffectInstance } from '../services/audioFilters';
import { createDrumKit, DrumKit, triggerDrumHit, connectDrumKit, disconnectDrumKit, disposeDrumKit } from '../services/drumSynths';

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

interface ToneGain {
  gain: { value: number };
  connect: (node: unknown) => void;
  toDestination: () => void;
  disconnect: () => void;
  dispose: () => void;
}

interface ToneNamespace {
  start: () => Promise<void>;
  Gain: new () => ToneGain;
  Part: new (
    callback: (time: number, value: DrumEventValue) => void,
    events: DrumEventValue[]
  ) => TonePart;
  Transport: ToneTransport;
}

interface DrumEventValue {
  time: string;
  drum: DrumHit['drum'];
  velocity: number;
}

interface UseDrumPlaybackOptions {
  hits: DrumHit[];
  bpm: number;
  filterStates: FilterState[];
  onError?: (error: string) => void;
}

interface UseDrumPlaybackReturn {
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

export const useDrumPlayback = ({ hits, bpm, filterStates, onError }: UseDrumPlaybackOptions): UseDrumPlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const drumKitRef = useRef<DrumKit | null>(null);
  const gainNodeRef = useRef<ToneGain | null>(null);
  const effectChainRef = useRef<ToneEffectInstance[]>([]);
  const partRef = useRef<TonePart | null>(null);

  // Rebuild effect chain when filter states change
  const rebuildEffectChain = useCallback(() => {
    const Tone = getTone();
    if (!Tone || !gainNodeRef.current || !drumKitRef.current) return;

    try {
      // Disconnect drum kit from gain
      disconnectDrumKit(drumKitRef.current);
      gainNodeRef.current.disconnect();

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

      // Reconnect drum kit to gain node
      connectDrumKit(drumKitRef.current, gainNodeRef.current);

      // Connect chain: gain -> effect1 -> effect2 -> ... -> destination
      if (effects.length > 0) {
        gainNodeRef.current.connect(effects[0] as unknown);
        for (let i = 0; i < effects.length - 1; i++) {
          effects[i].connect(effects[i + 1]);
        }
        effects[effects.length - 1].toDestination();
      } else {
        gainNodeRef.current.toDestination();
      }
    } catch (e) {
      console.error('Failed to rebuild effect chain:', e);
      // Fallback: connect gain directly to destination
      try {
        gainNodeRef.current?.toDestination();
      } catch {
        // Ignore
      }
    }
  }, [filterStates]);

  // Initialize drum kit on mount
  useEffect(() => {
    const Tone = getTone();
    if (!Tone) return;

    try {
      // Create gain node for mixing all drums
      gainNodeRef.current = new Tone.Gain();
      gainNodeRef.current.gain.value = 0.8;

      // Create drum kit
      drumKitRef.current = createDrumKit(Tone as unknown as Record<string, unknown>);

      if (drumKitRef.current) {
        // Connect drum kit to gain
        connectDrumKit(drumKitRef.current, gainNodeRef.current);

        // Build initial effect chain
        rebuildEffectChain();
      }
    } catch (e) {
      onError?.(`Failed to initialize drum audio: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    return () => {
      // Dispose drum kit
      if (drumKitRef.current) {
        disposeDrumKit(drumKitRef.current);
        drumKitRef.current = null;
      }
      // Dispose gain node
      gainNodeRef.current?.dispose();
      gainNodeRef.current = null;
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
    if (hits.length === 0) {
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

    if (!drumKitRef.current) {
      onError?.('Drum kit not initialized. Please refresh the page.');
      return;
    }

    try {
      if (partRef.current) {
        partRef.current.dispose();
      }

      Tone.Transport.bpm.value = bpm;

      const drumEvents: DrumEventValue[] = hits.map(h => ({
        time: beatsToTransportTime(h.time),
        drum: h.drum,
        velocity: h.velocity,
      }));

      const kit = drumKitRef.current;
      partRef.current = new Tone.Part((time: number, value: DrumEventValue) => {
        triggerDrumHit(kit, value.drum, time, value.velocity);
      }, drumEvents);

      // Calculate end time (find latest hit)
      const endBeats = hits.reduce(
        (max, h) => Math.max(max, h.time + 0.25), // Add 16th note duration
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
  }, [hits, bpm, onError]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return { isPlaying, startPlayback, stopPlayback };
};
