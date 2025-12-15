import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateMusic, addMusicPart } from './services/geminiService';
import { createMidiFile } from './services/midiEncoder';
import PianoRoll from './components/PianoRoll';
import { Composition, PartType } from './types';
import { availableModels, assertModelListPresent, isValidModelId } from './services/models';
import { Play, Square, Download, Loader2, AlertCircle, Plus } from 'lucide-react';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [composition, setComposition] = useState<Composition | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string>('');
  const [addingPart, setAddingPart] = useState<PartType | null>(null);

  // Tone.js refs
  const synthRef = useRef<any>(null);
  const partRef = useRef<any>(null);
  const stopEventIdRef = useRef<number | null>(null);

  const beatsToTransportTime = (beats: number) => {
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

  const clearScheduledStop = useCallback(() => {
    if (!window.Tone) return;
    if (stopEventIdRef.current != null) {
      window.Tone.Transport.clear(stopEventIdRef.current);
      stopEventIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    try {
      assertModelListPresent();
    } catch (e: any) {
      setError(e.message || "Failed to load models.txt");
      if (availableModels.length > 0) {
        setModelId(availableModels[0]!.id);
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("model") || params.get("--model") || "";
    const fromStorage = localStorage.getItem("selectedModelId") || "";
    const initial = fromUrl || fromStorage;

    if (initial) {
      if (!isValidModelId(initial)) {
        setError(`Invalid model "${initial}". Select from models.txt.`);
        const fallback = availableModels[0]!.id;
        setModelId(fallback);
        localStorage.setItem("selectedModelId", fallback);
        return;
      }
      setModelId(initial);
      localStorage.setItem("selectedModelId", initial);
      return;
    }

    if (typeof window.prompt === "function") {
      const options = availableModels
        .map((m, i) => `${i + 1}) ${m.label} (${m.id})`)
        .join("\n");
      const input = window.prompt(
        `Choose a model from models.txt:\n\n${options}\n\nEnter a number or a model id:`,
        "1"
      );
      const trimmed = (input || "").trim();
      const byIndex = Number.parseInt(trimmed, 10);
      const chosen =
        Number.isFinite(byIndex) && byIndex >= 1 && byIndex <= availableModels.length
          ? availableModels[byIndex - 1]!.id
          : trimmed;
      const finalModelId = isValidModelId(chosen) ? chosen : availableModels[0]!.id;
      setModelId(finalModelId);
      localStorage.setItem("selectedModelId", finalModelId);
      return;
    }

    setModelId(availableModels[0]!.id);
  }, []);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (isPlaying) stopPlayback();

    setLoading(true);
    setError(null);
    setComposition(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }
      const data = await generateMusic(prompt, modelId);
      setComposition(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate music");
    } finally {
      setLoading(false);
    }
  };

  const startPlayback = async () => {
    if (!composition || !window.Tone) return;
    await window.Tone.start();

    if (synthRef.current) {
      clearScheduledStop();
      if (partRef.current) {
        partRef.current.dispose();
      }

      window.Tone.Transport.bpm.value = composition.bpm;

      const toneEvents = composition.notes.map(n => ({
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

      const endBeats = composition.notes.reduce(
        (max, n) => Math.max(max, n.startTime + n.duration),
        0
      );
      const tailSeconds = 1.25;
      const tailBeats = (tailSeconds * composition.bpm) / 60;
      stopEventIdRef.current = window.Tone.Transport.scheduleOnce(() => {
        stopEventIdRef.current = null;
        stopPlayback();
      }, beatsToTransportTime(endBeats + tailBeats));

      window.Tone.Transport.start();
      setIsPlaying(true);
    }
  };

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

  const handleDownloadMidi = () => {
    if (!composition) return;
    const blob = createMidiFile(composition.notes, composition.bpm);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${composition.title.replace(/\s+/g, '_')}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddPart = async (partType: PartType) => {
    if (!composition) return;
    if (isPlaying) stopPlayback();

    setAddingPart(partType);
    setError(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }
      const updatedComposition = await addMusicPart(composition, partType, modelId);
      setComposition(updatedComposition);
    } catch (err: any) {
      setError(err.message || `Failed to add ${partType}`);
    } finally {
      setAddingPart(null);
    }
  };

  const partTypes: { type: PartType; label: string }[] = [
    { type: 'melody', label: 'Melody' },
    { type: 'chords', label: 'Chords' },
    { type: 'bass', label: 'Bass' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ 
        background: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--border)' 
      }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-mono text-sm font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
            midi-composer
          </h1>
          <select
            value={modelId}
            onChange={(e) => {
              const next = e.target.value;
              setModelId(next);
              localStorage.setItem("selectedModelId", next);
            }}
            className="font-mono text-xs px-2 py-1 rounded border-none"
            style={{ 
              background: 'var(--bg-tertiary)', 
              color: 'var(--text-secondary)',
              maxWidth: '200px'
            }}
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>{m.id}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Input */}
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your music..."
              className="flex-1 px-4 py-3 text-sm rounded"
              style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim() || !modelId}
              className="px-6 py-3 text-sm font-medium rounded transition-opacity"
              style={{ 
                background: loading || !prompt.trim() || !modelId ? 'var(--bg-tertiary)' : 'var(--accent)',
                color: loading || !prompt.trim() || !modelId ? 'var(--text-muted)' : 'white',
                opacity: loading || !prompt.trim() || !modelId ? 0.5 : 1,
                cursor: loading || !prompt.trim() || !modelId ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Generate'
              )}
            </button>
          </div>
          
          {error && (
            <div 
              className="mt-3 px-3 py-2 rounded text-sm flex items-center gap-2"
              style={{ 
                background: 'rgba(220, 38, 38, 0.1)', 
                border: '1px solid rgba(220, 38, 38, 0.2)',
                color: '#f87171'
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        {composition && (
          <div className="animate-slide-up">
            {/* Title bar */}
            <div 
              className="flex items-center justify-between px-4 py-3 rounded-t"
              style={{ 
                background: 'var(--bg-secondary)', 
                borderTop: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)'
              }}
            >
              <div className="flex items-center gap-4">
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {composition.title}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {composition.bpm} bpm · {composition.notes.length} notes
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={isPlaying ? stopPlayback : startPlayback}
                  className="p-2 rounded transition-colors"
                  style={{ 
                    background: isPlaying ? 'var(--bg-tertiary)' : 'var(--accent)',
                    color: 'white'
                  }}
                >
                  {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownloadMidi}
                  className="p-2 rounded transition-colors"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Piano Roll */}
            <PianoRoll 
              notes={composition.notes} 
              isPlaying={isPlaying} 
              bpm={composition.bpm}
            />

            {/* Add Parts */}
            <div 
              className="flex items-center gap-2 px-4 py-3 rounded-b"
              style={{ 
                background: 'var(--bg-secondary)', 
                borderBottom: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)'
              }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Add:</span>
              {partTypes.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleAddPart(type)}
                  disabled={addingPart !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors"
                  style={{ 
                    background: 'var(--bg-tertiary)', 
                    color: addingPart === type ? 'var(--accent)' : 'var(--text-secondary)',
                    opacity: addingPart !== null && addingPart !== type ? 0.5 : 1,
                    cursor: addingPart !== null ? 'not-allowed' : 'pointer'
                  }}
                >
                  {addingPart === type ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!composition && !loading && (
          <div 
            className="rounded py-24 text-center"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px dashed var(--border)' 
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Generated MIDI will appear here
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
