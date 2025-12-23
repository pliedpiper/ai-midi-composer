import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { NoteEvent, PartType } from '../types';
import { MIDI, PIANO_ROLL } from '../constants';

// Color mapping for different parts
const PART_COLORS: Record<PartType, { from: string; to: string }> = {
  melody: { from: '61, 139, 255', to: '42, 95, 168' },   // Blue
  chords: { from: '168, 85, 247', to: '124, 58, 237' },  // Purple
  bass: { from: '34, 197, 94', to: '22, 163, 74' },      // Green
};

const DEFAULT_COLOR = { from: '61, 139, 255', to: '42, 95, 168' }; // Blue default

interface PianoRollProps {
  notes: NoteEvent[];
  isPlaying: boolean;
  bpm: number;
  height?: number;
  onAddNote?: (note: NoteEvent) => void;
  onRemoveNote?: (noteId: string) => void;
  noteDuration?: number;
}

const PianoRoll: React.FC<PianoRollProps> = ({
  notes,
  isPlaying,
  bpm,
  height,
  onAddNote,
  onRemoveNote,
  noteDuration = 1,
}) => {
  const {
    NOTE_HEIGHT: DEFAULT_NOTE_HEIGHT,
    BEAT_WIDTH,
    MIN_NOTE: DEFAULT_MIN_NOTE,
    MAX_NOTE: DEFAULT_MAX_NOTE,
    DEFAULT_MAX_TIME,
  } = PIANO_ROLL;
  const { MIN_NOTE: MIDI_MIN_NOTE, MAX_NOTE: MIDI_MAX_NOTE } = MIDI;
  const viewportHeight = height ?? 320;
  const VERTICAL_INSET = 6;

  const { displayMinNote, displayMaxNote } = useMemo(() => {
    if (notes.length === 0) {
      return { displayMinNote: DEFAULT_MIN_NOTE, displayMaxNote: DEFAULT_MAX_NOTE };
    }

    let minNote = Infinity;
    let maxNote = -Infinity;
    for (const note of notes) {
      if (note.note < minNote) minNote = note.note;
      if (note.note > maxNote) maxNote = note.note;
    }

    const paddingSemitones = 2;
    minNote = Math.max(MIDI_MIN_NOTE, minNote - paddingSemitones);
    maxNote = Math.min(MIDI_MAX_NOTE, maxNote + paddingSemitones);

    const maxToNextC = (12 - (maxNote % 12)) % 12;
    const roundedMaxNote = Math.min(MIDI_MAX_NOTE, maxNote + maxToNextC);

    const roundedMinNote = Math.max(MIDI_MIN_NOTE, minNote - (minNote % 12));
    return { displayMinNote: roundedMinNote, displayMaxNote: roundedMaxNote };
  }, [notes, DEFAULT_MIN_NOTE, DEFAULT_MAX_NOTE, MIDI_MIN_NOTE, MIDI_MAX_NOTE]);

  const TOTAL_NOTES = displayMaxNote - displayMinNote + 1;
  const playheadRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Calculate display width for canvas (add some padding)
  const maxTime = useMemo(() => {
    if (notes.length === 0) return DEFAULT_MAX_TIME;
    const endTime = notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);
    return Math.ceil(endTime) + 1;
  }, [notes, DEFAULT_MAX_TIME]);

  // Calculate actual loop duration (same logic as usePlayback)
  const loopDuration = useMemo(() => {
    if (notes.length === 0) return DEFAULT_MAX_TIME;
    return notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);
  }, [notes, DEFAULT_MAX_TIME]);

  const canvasWidth = maxTime * BEAT_WIDTH;
  const usableHeight = Math.max(viewportHeight - VERTICAL_INSET * 2, 1);
  const rowHeightUncapped = usableHeight / Math.max(TOTAL_NOTES, 1);
  const rowHeight = Math.min(DEFAULT_NOTE_HEIGHT, rowHeightUncapped);
  const gridHeight = TOTAL_NOTES * rowHeight;
  const gridTop = Math.max(VERTICAL_INSET, (viewportHeight - gridHeight) / 2);
  const noteVerticalPadding = Math.min(1, rowHeight * 0.2);
  const noteBlockHeight = Math.max(rowHeight - noteVerticalPadding * 2, 1);

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
        animationRef.current = null;
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

  // Grid container ref for click handling
  const gridRef = useRef<HTMLDivElement>(null);

  // Check if a click position intersects with any note
  const findNoteAtPosition = useCallback(
    (beatTime: number, midiNote: number): NoteEvent | null => {
      for (const note of notes) {
        const noteEnd = note.startTime + note.duration;
        if (
          beatTime >= note.startTime &&
          beatTime < noteEnd &&
          midiNote === note.note
        ) {
          return note;
        }
      }
      return null;
    },
    [notes]
  );

  // Handle grid click for adding/removing notes
  const handleGridClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert X to beat time (snap to half beats)
      const rawBeatTime = x / BEAT_WIDTH;
      const snappedBeatTime = Math.round(rawBeatTime * 2) / 2;

      // Convert Y to MIDI note number
      const rowIndex = Math.floor((y - gridTop) / rowHeight);
      const midiNote = displayMaxNote - rowIndex;

      // Check bounds
      if (midiNote < displayMinNote || midiNote > displayMaxNote) return;
      if (snappedBeatTime < 0) return;

      // Check if clicking on an existing note
      const clickedNote = findNoteAtPosition(snappedBeatTime, midiNote);

      if (clickedNote && onRemoveNote) {
        // Remove the note
        onRemoveNote(clickedNote.id);
      } else if (!clickedNote && onAddNote) {
        // Add a new note
        const newNote: NoteEvent = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          note: midiNote,
          startTime: snappedBeatTime,
          duration: noteDuration,
          velocity: 80,
          partType: 'melody',
        };
        onAddNote(newNote);
      }
    },
    [
      BEAT_WIDTH,
      gridTop,
      rowHeight,
      displayMinNote,
      displayMaxNote,
      noteDuration,
      findNoteAtPosition,
      onAddNote,
      onRemoveNote,
    ]
  );

  // Determine if piano roll is interactive
  const isInteractive = onAddNote || onRemoveNote;

  return (
    <div
      className="w-full overflow-hidden relative piano-roll-container"
      style={{
        background: 'linear-gradient(180deg, #0c0c0c 0%, #080808 100%)'
      }}
    >
      <div className="w-full overflow-x-auto piano-roll-scroll" style={{ height: `${viewportHeight}px` }}>
        <div
          ref={gridRef}
          className="relative"
          style={{
            width: `${canvasWidth}px`,
            height: `${viewportHeight}px`,
            cursor: isInteractive ? 'crosshair' : 'default',
          }}
          onClick={isInteractive ? handleGridClick : undefined}
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
                top: `${gridTop + i * 12 * rowHeight}px`,
                height: '1px',
                background: 'rgba(255, 255, 255, 0.06)'
              }}
            />
          ))}

          {/* Notes */}
          {notes.map((note) => {
            const rowIndex = displayMaxNote - note.note;
            if (rowIndex < 0 || rowIndex >= TOTAL_NOTES) return null;

            const noteOpacity = 0.5 + (note.velocity / 127) * 0.5;
            const colors = note.partType ? PART_COLORS[note.partType] : DEFAULT_COLOR;
            const canRemove = !!onRemoveNote;

            return (
              <div
                key={note.id}
                className={`absolute transition-all ${canRemove ? 'hover:scale-105 hover:brightness-110' : ''}`}
                style={{
                  left: `${note.startTime * BEAT_WIDTH}px`,
                  top: `${gridTop + rowIndex * rowHeight + noteVerticalPadding}px`,
                  width: `${Math.max(note.duration * BEAT_WIDTH - 1, 4)}px`,
                  height: `${noteBlockHeight}px`,
                  background: `linear-gradient(135deg, rgba(${colors.from}, ${noteOpacity}) 0%, rgba(${colors.to}, ${noteOpacity}) 100%)`,
                  borderRadius: '3px',
                  boxShadow: `0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                  cursor: canRemove ? 'pointer' : 'default',
                }}
                title={`${note.partType || 'note'} · MIDI ${note.note} · vel ${note.velocity}${canRemove ? ' · Click to remove' : ''}`}
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
          // MIDI note at this row = displayMaxNote - (i * 12)
          // Octave number = floor(midiNote / 12) - 1 (standard MIDI convention: C4 = 60)
          const midiNoteAtRow = displayMaxNote - (i * 12);
          const octave = Math.floor(midiNoteAtRow / 12) - 1;
          return (
            <div
              key={i}
              className="font-mono text-[10px] font-medium pl-2"
              style={{
                position: 'absolute',
                top: `${gridTop + i * 12 * rowHeight + noteVerticalPadding}px`,
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
