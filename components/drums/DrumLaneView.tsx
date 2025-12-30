import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { DrumHit, DrumPiece } from '../../types/drums';
import { DRUM_PIECES, DRUM_LANE, GENERATION } from '../../constants';

interface DrumLaneViewProps {
  hits: DrumHit[];
  bpm: number;
  isPlaying: boolean;
  barCount?: number;
  onAddHit?: (drum: DrumPiece, time: number, velocity: number) => void;
  onRemoveHit?: (hitId: string) => void;
  onUpdateVelocity?: (hitId: string, velocity: number) => void;
  compact?: boolean;
}

const DrumLaneView: React.FC<DrumLaneViewProps> = ({
  hits,
  bpm,
  isPlaying,
  barCount = 4,
  onAddHit,
  onRemoveHit,
  onUpdateVelocity,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const laneHeight = compact ? 24 : DRUM_LANE.LANE_HEIGHT;
  const cellWidth = compact ? 14 : DRUM_LANE.CELL_WIDTH;
  const labelWidth = compact ? 50 : DRUM_LANE.LABEL_WIDTH;

  // Total cells and grid dimensions
  const totalCells = barCount * DRUM_LANE.CELLS_PER_BAR;
  const gridWidth = totalCells * cellWidth;
  const gridHeight = DRUM_PIECES.length * laneHeight;

  // Duration in beats
  const totalBeats = barCount * GENERATION.BEATS_PER_BAR;
  const durationMs = (totalBeats / bpm) * 60 * 1000;

  // Create a map for quick hit lookup by lane and time
  const hitMap = useMemo(() => {
    const map = new Map<string, DrumHit>();
    hits.forEach(hit => {
      // Convert time to cell index
      const cellIndex = Math.round(hit.time * DRUM_LANE.CELLS_PER_BEAT);
      const key = `${hit.drum}-${cellIndex}`;
      map.set(key, hit);
    });
    return map;
  }, [hits]);

  // Playhead animation
  useEffect(() => {
    if (!isPlaying || !playheadRef.current) {
      if (playheadRef.current) {
        playheadRef.current.style.left = `${labelWidth}px`;
      }
      return;
    }

    startTimeRef.current = performance.now();

    const animate = () => {
      if (!playheadRef.current) return;

      const elapsed = performance.now() - startTimeRef.current;
      const progress = (elapsed % durationMs) / durationMs;
      const x = labelWidth + progress * gridWidth;

      playheadRef.current.style.left = `${x}px`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, durationMs, gridWidth, labelWidth]);

  // Handle cell click
  const handleCellClick = useCallback((drum: DrumPiece, cellIndex: number) => {
    const key = `${drum}-${cellIndex}`;
    const existingHit = hitMap.get(key);

    if (existingHit) {
      // Remove hit (toggle)
      onRemoveHit?.(existingHit.id);
    } else {
      // Add hit at this position
      const time = cellIndex / DRUM_LANE.CELLS_PER_BEAT;
      onAddHit?.(drum, time, DRUM_LANE.DEFAULT_VELOCITY);
    }
  }, [hitMap, onAddHit, onRemoveHit]);

  // Render a single lane
  const renderLane = (piece: typeof DRUM_PIECES[0], laneIndex: number) => {
    const cells = [];

    for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
      const key = `${piece.id}-${cellIndex}`;
      const hit = hitMap.get(key);
      const isBarStart = cellIndex % DRUM_LANE.CELLS_PER_BAR === 0;
      const isBeatStart = cellIndex % DRUM_LANE.CELLS_PER_BEAT === 0;

      cells.push(
        <div
          key={cellIndex}
          className="relative cursor-pointer transition-colors"
          style={{
            width: cellWidth,
            height: laneHeight,
            boxSizing: 'border-box',
            borderRight: isBarStart
              ? '2px solid var(--border)'
              : isBeatStart
              ? '1px solid var(--border)'
              : '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid var(--border)',
            background: hit
              ? 'transparent'
              : isBarStart
              ? 'rgba(255,255,255,0.02)'
              : 'transparent',
          }}
          onClick={() => handleCellClick(piece.id, cellIndex)}
          onMouseEnter={(e) => {
            if (!hit) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (!hit) {
              e.currentTarget.style.background = isBarStart
                ? 'rgba(255,255,255,0.02)'
                : 'transparent';
            }
          }}
        >
          {hit && (
            <div
              className="absolute inset-0.5 rounded-sm"
              style={{
                background: piece.color,
                opacity: hit.velocity / 127,
              }}
            />
          )}
        </div>
      );
    }

    return (
      <div
        key={piece.id}
        className="flex"
        style={{ height: laneHeight }}
      >
        {/* Grid cells */}
        <div className="flex">
          {cells}
        </div>
      </div>
    );
  };

  // Render bar numbers
  const renderBarNumbers = () => {
    const barNumbers = [];
    for (let bar = 0; bar < barCount; bar++) {
      barNumbers.push(
        <div
          key={bar}
          className="font-mono text-xs flex items-center justify-center"
          style={{
            width: DRUM_LANE.CELLS_PER_BAR * cellWidth,
            height: 20,
            boxSizing: 'border-box',
            color: 'var(--text-muted)',
            borderRight: bar < barCount - 1 ? '2px solid var(--border)' : 'none',
          }}
        >
          {bar + 1}
        </div>
      );
    }

    return (
      <div className="flex">
        {barNumbers}
      </div>
    );
  };

  // Render sticky lane labels
  const renderLaneLabels = () => {
    return (
      <div className="flex flex-col">
        {/* Empty space for bar numbers header */}
        <div style={{ height: 20, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }} />
        {/* Lane labels */}
        {DRUM_PIECES.map((piece) => (
          <div
            key={piece.id}
            className="flex items-center justify-end pr-2 font-mono text-xs shrink-0"
            style={{
              width: labelWidth,
              height: laneHeight,
              color: piece.color,
              background: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {compact ? piece.shortName : piece.name}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex rounded-lg"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Sticky lane labels */}
      <div
        className="sticky left-0 z-20 shrink-0"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {renderLaneLabels()}
      </div>

      {/* Scrollable grid area */}
      <div className="overflow-x-auto">
        {/* Grid container with explicit width to ensure alignment */}
        <div style={{ width: gridWidth }}>
          {/* Bar numbers header */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {renderBarNumbers()}
          </div>

          {/* Lanes */}
          <div className="relative">
            {DRUM_PIECES.map((piece, index) => renderLane(piece, index))}

          {/* Playhead */}
          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10"
            style={{
              background: 'var(--accent)',
              left: 0,
              display: isPlaying ? 'block' : 'none',
              boxShadow: '0 0 8px var(--accent)',
            }}
          />
        </div>
        </div>
      </div>
    </div>
  );
};

export default DrumLaneView;
