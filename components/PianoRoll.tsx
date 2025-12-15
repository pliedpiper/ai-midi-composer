import React, { useMemo, useRef, useEffect } from 'react';
import { NoteEvent } from '../types';

interface PianoRollProps {
  notes: NoteEvent[];
  isPlaying: boolean;
  currentBeat: number;
  bpm: number;
}

const PianoRoll: React.FC<PianoRollProps> = ({ notes, isPlaying, bpm }) => {
  const NOTE_HEIGHT = 10;
  const BEAT_WIDTH = 32;
  const playheadRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const MIN_NOTE = 36;    // C2
  const MAX_NOTE = 96;    // C7
  const TOTAL_NOTES = MAX_NOTE - MIN_NOTE + 1;

  const maxTime = useMemo(() => {
    if (notes.length === 0) return 16;
    const lastNote = notes[notes.length - 1];
    return Math.ceil(lastNote.startTime + lastNote.duration) + 1;
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
      const currentBeat = elapsed * (bpm / 60);
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
  }, [isPlaying, bpm, BEAT_WIDTH]);

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
      className="w-full overflow-hidden relative"
      style={{ 
        background: 'var(--bg-primary)', 
        borderLeft: '1px solid var(--border)',
        borderRight: '1px solid var(--border)'
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
                background: beat % 4 === 0 ? '#2a2a2a' : '#1a1a1a'
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
                background: '#222'
              }}
            />
          ))}

          {/* Notes */}
          {notes.map((note, idx) => {
            const rowIndex = MAX_NOTE - note.note;
            if (rowIndex < 0 || rowIndex >= TOTAL_NOTES) return null;

            const noteOpacity = 0.4 + (note.velocity / 127) * 0.6;

            return (
              <div
                key={idx}
                className="absolute transition-opacity"
                style={{
                  left: `${note.startTime * BEAT_WIDTH}px`,
                  top: `${rowIndex * NOTE_HEIGHT + 1}px`,
                  width: `${Math.max(note.duration * BEAT_WIDTH - 1, 3)}px`,
                  height: `${NOTE_HEIGHT - 2}px`,
                  background: `rgba(61, 139, 255, ${noteOpacity})`,
                  borderRadius: '2px'
                }}
                title={`MIDI ${note.note} · vel ${note.velocity}`}
              />
            );
          })}

          {/* Playhead */}
          <div 
            ref={playheadRef}
            className="absolute top-0 bottom-0 z-10"
            style={{
              left: '0px',
              width: '2px',
              background: 'var(--accent)',
              boxShadow: '0 0 8px rgba(61, 139, 255, 0.5)',
              opacity: isPlaying ? 1 : 0,
              willChange: 'left'
            }}
          />
        </div>
      </div>
      
      {/* Octave labels */}
      <div 
        className="absolute left-0 top-0 bottom-0 pointer-events-none flex flex-col"
        style={{ 
          width: '32px',
          background: 'linear-gradient(to right, var(--bg-secondary) 80%, transparent)'
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
              className="font-mono text-[9px] pl-2"
              style={{ 
                position: 'absolute', 
                top: `${i * 12 * NOTE_HEIGHT + 2}px`,
                color: 'var(--text-muted)'
              }}
            >
              C{octave}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PianoRoll;
