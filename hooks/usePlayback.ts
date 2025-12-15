import { useRef, useEffect, useCallback, useState } from 'react';
import { NoteEvent } from '../types';

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

interface UsePlaybackOptions {
  notes: NoteEvent[];
  bpm: number;
  onPlaybackEnd?: () => void;
}

interface UsePlaybackReturn {
  isPlaying: boolean;
  startPlayback: () => Promise<void>;
  stopPlayback: () => void;
}

export const usePlayback = ({ notes, bpm, onPlaybackEnd }: UsePlaybackOptions): UsePlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<any>(null);
  const partRef = useRef<any>(null);
  const stopEventIdRef = useRef<number | null>(null);

  const clearScheduledStop = useCallback(() => {
    if (!window.Tone) return;
    if (stopEventIdRef.current != null) {
      window.Tone.Transport.clear(stopEventIdRef.current);
      stopEventIdRef.current = null;
    }
  }, []);

  // Initialize synth on mount
  useEffect(() => {
    if (window.Tone) {
      synthRef.current = new window.Tone.PolySynth(window.Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      }).toDestination();
      
      const reverb = new window.Tone.Reverb(2).toDestination();
      synthRef.current.connect(reverb);
    }
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const stopPlayback = useCallback(() => {
    if (window.Tone) {
      clearScheduledStop();
      window.Tone.Transport.stop();
      window.Tone.Transport.position = 0;
      if (partRef.current) {
        partRef.current.dispose();
        partRef.current = null;
      }
    }
    setIsPlaying(false);
  }, [clearScheduledStop]);

  const startPlayback = useCallback(async () => {
    if (notes.length === 0 || !window.Tone) return;
    await window.Tone.start();

    if (synthRef.current) {
      clearScheduledStop();
      if (partRef.current) {
        partRef.current.dispose();
      }

      window.Tone.Transport.bpm.value = bpm;

      const toneEvents = notes.map(n => ({
        time: beatsToTransportTime(n.startTime),
        note: window.Tone.Frequency(n.note, "midi").toNote(),
        duration: beatsToTransportTime(n.duration),
        velocity: n.velocity / 127
      }));

      partRef.current = new window.Tone.Part((time: any, value: any) => {
        synthRef.current.triggerAttackRelease(
          value.note, 
          value.duration, 
          time, 
          value.velocity
        );
      }, toneEvents).start(0);

      const endBeats = notes.reduce(
        (max, n) => Math.max(max, n.startTime + n.duration),
        0
      );
      const tailSeconds = 1.25;
      const tailBeats = (tailSeconds * bpm) / 60;
      
      stopEventIdRef.current = window.Tone.Transport.scheduleOnce(() => {
        stopEventIdRef.current = null;
        stopPlayback();
        onPlaybackEnd?.();
      }, beatsToTransportTime(endBeats + tailBeats));

      window.Tone.Transport.start();
      setIsPlaying(true);
    }
  }, [notes, bpm, clearScheduledStop, stopPlayback, onPlaybackEnd]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return { isPlaying, startPlayback, stopPlayback };
};

