import React, { useMemo, useRef, useEffect } from 'react';
import { NoteEvent } from '../types';
import { PIANO_ROLL } from '../constants';

interface PianoRollProps {
  notes: NoteEvent[];
  isPlaying: boolean;
  currentBeat?: number;
  bpm: number;
}

const PianoRoll: React.FC<PianoRollProps> = ({ notes, isPlaying, bpm }) => {
  const { NOTE_HEIGHT, BEAT_WIDTH, MIN_NOTE, MAX_NOTE, DEFAULT_MAX_TIME } = PIANO_ROLL;
  const TOTAL_NOTES = MAX_NOTE - MIN_NOTE + 1;
  const playheadRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Calculate display width for canvas (add some padding)
  const maxTime = useMemo(() => {
    if (notes.length === 0) return DEFAULT_MAX_TIME;
    const lastNote = notes[notes.length - 1];
    return Math.ceil(lastNote.startTime + lastNote.duration) + 1;
  }, [notes, DEFAULT_MAX_TIME]);

  // Calculate actual loop duration (same logic as usePlayback)
  const loopDuration = useMemo(() => {
    if (notes.length === 0) return DEFAULT_MAX_TIME;
    return notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);
  }, [notes]);

  const canvasWidth = maxTime * BEAT_WIDTH;
  const canvasHeight = TOTAL_NOTES * NOTE_HEIGHT;

  // Direct DOM animation for smooth playhead movement
  useEffect(() => {
    if (!isPlaying) {
      // Reset playhead position when stopped
      if (playheadRef.current) {
        playheadRef.current.style.left = '0px';
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startTimeRef.current = null;
      return;
    }

    // Start animation
    startTimeRef.current = performance.now();

    const animate = () => {
      if (!playheadRef.current || startTimeRef.current === null) return;

      const elapsed = (performance.now() - startTimeRef.current) / 1000; // seconds
      const totalBeats = elapsed * (bpm / 60);
      // Wrap around using modulo to handle looping
      const currentBeat = loopDuration > 0 ? totalBeats % loopDuration : totalBeats;
      const position = currentBeat * BEAT_WIDTH;

      playheadRef.current.style.left = `${position}px`;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, bpm, loopDuration, BEAT_WIDTH]);

  // Generate beat markers
  const beatMarkers = useMemo(() => {
    const markers = [];
    for (let i = 0; i <= maxTime; i++) {
      markers.push(i);
    }
    return markers;
  }, [maxTime]);

  return (
    <div
      className="w-full overflow-hidden relative piano-roll-container"
      style={{
        background: 'linear-gradient(180deg, #0c0c0c 0%, #080808 100%)'
      }}
    >
      <div className="w-full overflow-x-auto piano-roll-scroll" style={{ height: '320px' }}>
        <div
          className="relative"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
        >
          {/* Grid lines */}
          {beatMarkers.map((beat) => (
            <div
              key={beat}
              className="absolute top-0 bottom-0"
              style={{
                left: `${beat * BEAT_WIDTH}px`,
                width: '1px',
                background: beat % 4 === 0
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)'
              }}
            />
          ))}

          {/* Horizontal lines every octave */}
          {Array.from({ length: Math.ceil(TOTAL_NOTES / 12) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                top: `${i * 12 * NOTE_HEIGHT}px`,
                height: '1px',
                background: 'rgba(255, 255, 255, 0.06)'
              }}
            />
          ))}

          {/* Notes */}
          {notes.map((note) => {
            const rowIndex = MAX_NOTE - note.note;
            if (rowIndex < 0 || rowIndex >= TOTAL_NOTES) return null;

            const noteOpacity = 0.5 + (note.velocity / 127) * 0.5;

            return (
              <div
                key={note.id}
                className="absolute transition-all"
                style={{
                  left: `${note.startTime * BEAT_WIDTH}px`,
                  top: `${rowIndex * NOTE_HEIGHT + 1}px`,
                  width: `${Math.max(note.duration * BEAT_WIDTH - 1, 4)}px`,
                  height: `${NOTE_HEIGHT - 2}px`,
                  background: `linear-gradient(135deg, rgba(61, 139, 255, ${noteOpacity}) 0%, rgba(42, 95, 168, ${noteOpacity}) 100%)`,
                  borderRadius: '3px',
                  boxShadow: `0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                }}
                title={`MIDI ${note.note} · vel ${note.velocity}`}
              />
            );
          })}

          {/* Playhead */}
          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 z-10 playhead"
            style={{
              left: '0px',
              width: '2px',
              background: 'var(--accent)',
              boxShadow: isPlaying
                ? '0 0 12px var(--accent), 0 0 24px rgba(61, 139, 255, 0.4)'
                : 'none',
              opacity: isPlaying ? 1 : 0,
              willChange: 'left',
              transition: 'opacity 200ms ease'
            }}
          />
        </div>
      </div>

      {/* Octave labels */}
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none flex flex-col"
        style={{
          width: '36px',
          background: 'linear-gradient(to right, rgba(17, 17, 17, 0.95) 60%, transparent 100%)'
        }}
      >
        {Array.from({ length: Math.ceil(TOTAL_NOTES / 12) }).map((_, i) => {
          // MIDI note at this row = MAX_NOTE - (i * 12)
          // Octave number = floor(midiNote / 12) - 1 (standard MIDI convention: C4 = 60)
          const midiNoteAtRow = MAX_NOTE - (i * 12);
          const octave = Math.floor(midiNoteAtRow / 12) - 1;
          return (
            <div
              key={i}
              className="font-mono text-[10px] font-medium pl-2"
              style={{
                position: 'absolute',
                top: `${i * 12 * NOTE_HEIGHT + 1}px`,
                color: 'var(--text-muted)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
              }}
            >
              C{octave}
            </div>
          );
        })}
      </div>

      {/* Top gradient fade */}
      <div
        className="absolute top-0 left-0 right-0 h-4 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(12, 12, 12, 0.8) 0%, transparent 100%)'
        }}
      />

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
        style={{
          background: 'linear-gradient(0deg, rgba(8, 8, 8, 0.8) 0%, transparent 100%)'
        }}
      />
    </div>
  );
};

export default PianoRoll;
